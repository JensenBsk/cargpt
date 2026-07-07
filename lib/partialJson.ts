// Tolerant parser for a JSON object that is still streaming in.
// Given a prefix of a valid JSON document it returns the parsed object with:
// - open containers closed,
// - a string VALUE that is still streaming kept (closed at the cut point),
// - a dangling key, colon, or partial primitive dropped.
// Returns null until the buffer contains the start of an object, or if the
// prefix is not a prefix of valid JSON.
export function parsePartialJson(raw: string): unknown | null {
  const start = raw.indexOf("{");
  if (start === -1) return null;
  const src = raw.slice(start);

  const stack: ("}" | "]")[] = [];
  // "Stable" cut point: slicing here and appending the closers recorded for it
  // always yields valid JSON. Updated after completed values and container
  // openers; commas cut BEFORE the comma so no trailing comma is left.
  let lastStable = 0;
  let closersAtStable = "";

  let inString = false;
  let stringIsValue = false; // value position (after ':' or inside an array)
  let escaped = false;
  let unicodeLeft = 0; // hex digits still expected for a \uXXXX escape
  let expectValue = false; // saw ':' (or array context) — next token is a value

  const closers = () => stack.slice().reverse().join("");
  const markStable = (pos: number) => {
    lastStable = pos;
    closersAtStable = closers();
  };

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];

    if (inString) {
      if (unicodeLeft > 0) {
        unicodeLeft--;
      } else if (escaped) {
        escaped = false;
        if (ch === "u") unicodeLeft = 4;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
        if (stringIsValue) {
          expectValue = false;
          markStable(i + 1);
        }
        // A completed KEY string is not stable — it awaits ':' and a value.
      }
      continue;
    }

    switch (ch) {
      case '"':
        inString = true;
        escaped = false;
        unicodeLeft = 0;
        stringIsValue = expectValue || stack[stack.length - 1] === "]";
        break;
      case ":":
        expectValue = true;
        break;
      case "{":
      case "[":
        stack.push(ch === "{" ? "}" : "]");
        expectValue = false;
        markStable(i + 1);
        break;
      case "}":
      case "]": {
        if (stack.pop() !== ch) return null; // malformed
        expectValue = false;
        markStable(i + 1);
        if (stack.length === 0) {
          try {
            return JSON.parse(src.slice(0, i + 1));
          } catch {
            return null;
          }
        }
        break;
      }
      case ",":
        // Cut before the comma: keeps any preceding primitive value intact
        // without leaving a trailing comma.
        expectValue = false;
        markStable(i);
        break;
      default:
        break;
    }
  }

  // Truncated mid-string-value: keep what streamed in, trimming any
  // incomplete trailing escape sequence, and close the quote.
  if (inString && stringIsValue) {
    let end = src.length;
    if (unicodeLeft > 0) end -= 2 + (4 - unicodeLeft); // drop "\u" + partial hex
    else if (escaped) end -= 1; // drop lone trailing backslash
    const candidate = src.slice(0, end) + '"' + closers();
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  }

  if (lastStable === 0) return null;
  const candidate = src.slice(0, lastStable) + closersAtStable;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}
