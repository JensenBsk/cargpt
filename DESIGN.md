---
name: Mechanic Carlos
description: An AI mechanic that reads like a premium scan tool — real diagnosis, real data, on your side.
colors:
  bg-oled: "#060810"
  surface: "#0b1019"
  surface-2: "#101822"
  surface-3: "#162232"
  border: "#172134"
  border-muted: "#1c2a3e"
  input-well: "#0a0d14"
  ink: "#dce8f5"
  ink-2: "#7d8fa8"
  ink-3: "#4a5c72"
  ink-4: "#2d3f55"
  scanner-blue: "#4a9eff"
  scanner-blue-deep: "#2d6fd6"
  verdict-red: "#ef4444"
  verdict-amber: "#f59e0b"
  verdict-green: "#22c55e"
  tint-red-bg: "#120608"
  tint-amber-bg: "#120d02"
typography:
  display:
    fontFamily: "Barlow Condensed, sans-serif"
    fontWeight: 700
    letterSpacing: "0.12em"
  headline:
    fontFamily: "IBM Plex Sans, Inter, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "IBM Plex Sans, Inter, sans-serif"
    fontSize: "15px"
    fontWeight: 600
  body:
    fontFamily: "IBM Plex Sans, Inter, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "10px"
    fontWeight: 700
    letterSpacing: "0.1em"
  data:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "16px"
    fontWeight: 600
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  2xl: "20px"
  pill: "20px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
components:
  button-primary:
    backgroundColor: "{colors.scanner-blue}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    height: "54px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.lg}"
    height: "46px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "20px"
  chip:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    height: "34px"
  input:
    backgroundColor: "{colors.input-well}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "48px"
  readout-label:
    textColor: "{colors.ink-3}"
    typography: "{typography.label}"
---

# Design System: Mechanic Carlos

## 1. Overview

**Creative North Star: "The Master Tech's Scan Tool"**

Carlos looks like a premium diagnostic instrument in expert hands: near-black OLED surfaces, hairline borders, mono readouts, and one electric accent that means *live data*. The scene that picked the theme: a worried owner in a dark driveway at night, phone held over a warm engine — dark mode is the working default (a light theme exists for daylight, same tokens, verdicts darkened for contrast). The wow-factor is load-bearing only: a diagnosis streaming in token by token, fuel trims read off the running engine, 176 federal bulletins surfacing for this exact car. Nothing glows unless it's measuring something.

This system explicitly rejects: generic AI-wrapper styling (stock dark + orange, chat-box-with-a-logo), sterile enterprise dashboards, cartoonish mascot-ware, and parts-store clutter. Carlos gives one clear answer first; depth unfolds beneath it.

**Key characteristics:**
- OLED navy-black foundation with tonal surface steps, not shadows
- JetBrains Mono for everything measured; IBM Plex Sans for everything spoken
- Scanner Blue as the single accent, used sparingly
- Verdict colors (red/amber/green) reserved for safety and status semantics
- Components feel like a precision instrument: crisp, instant, calm

## 2. Colors: The Scan Tool Palette

A near-black navy foundation, a slate-blue ink ramp, one electric accent, and three verdict colors that are never decoration.

### Primary
- **Scanner Blue** (#4a9eff): the color of live data — active states, primary CTAs, streaming cursors, rank badges, data highlights. Hover/pressed deepens to **#2d6fd6**. In light theme it darkens to **#2563eb** to hold AA on white.

### Neutral
- **OLED Black** (#060810): page background. True working dark, not gray.
- **Surface** (#0b1019) / **Surface-2** (#101822) / **Surface-3** (#162232): tonal elevation steps — cards, wells, skeletons.
- **Border** (#172134) / **Border-muted** (#1c2a3e): hairline structure; border-muted for inputs.
- **Ink** (#dce8f5) → **Ink-2** (#7d8fa8) → **Ink-3** (#4a5c72) → **Ink-4** (#2d3f55): the text ramp — primary, secondary, labels/muted, faint.
- Light theme counterparts: bg #eef2f7, surface #ffffff, surface-2 #f1f5f9, surface-3/border #e2e8f0, ink #0f172a, ink-2 #475569, ink-3 #64748b, ink-4 #94a3b8.

### Tertiary (verdict colors)
- **Verdict Red** (#ef4444; light #dc2626): STOP, overdue, major severity, destructive.
- **Verdict Amber** (#f59e0b; light #b45309): CAUTION, due soon, recalls, ruled-out.
- **Verdict Green** (#22c55e; light #15803d): OKAY, confirmed, all-clear, success.
- Tint panels: red on #120608, amber on #120d02 (light: #fef2f2 / #fffbeb).

### Named Rules
**The Live Data Rule.** Scanner Blue appears on ≤10% of any screen and always means something active or measured. If everything is blue, nothing is live.
**The Verdict Rule.** Red, amber, and green are safety/status semantics only — never decoration, never brand flair. A green button that doesn't mean "confirmed/safe" is a bug.

## 3. Typography

**Display Font:** Barlow Condensed (700/800) — wordmark and big step numerals only.
**Body Font:** IBM Plex Sans (Inter fallback) — everything Carlos says.
**Data Font:** JetBrains Mono — everything Carlos measures.

**Character:** an engineer's voice in a friend's cadence. The sans carries warm plain-English prose; the mono stamps numbers, codes, prices, and labels with instrument authority. The pairing contrast (humanist sans + mono) is the brand's trust signal.

### Hierarchy
- **Display** (Barlow Condensed 700, 0.12em tracking, uppercase): CARLOS wordmark, guided-repair step numerals.
- **Headline** (700, 20–22px, 1.3): screen titles, report verdicts, "Found it."
- **Title** (600, 14–15px): card headers, causes, buttons.
- **Body** (400, 14–15px, 1.65): explanations, reasoning, chat. Keep ≤75ch.
- **Readout Label** (JetBrains Mono 700, 10–11px, 0.1em tracking, uppercase, Ink-3): section kickers — "WHAT THE DEALER KNOWS", "STEP 2 OF 3", "GUIDED REPAIR".
- **Data** (JetBrains Mono 600–700, 11–34px): prices, percentages, fault codes, counts, the health score.

### Named Rules
**The Mono Means Measured Rule.** JetBrains Mono is reserved for measured or coded values and readout labels. Body prose in mono is forbidden; measured values in the sans are forbidden. This single rule is most of the scan-tool feel.
**The Readout Label system.** The uppercase mono kicker is a deliberate, named instrument convention — one per module, always Ink-3, always 0.1em. It is not a decorative eyebrow; if a module doesn't read like an instrument panel section, it doesn't get one.

## 4. Elevation

Flat, tonal, and bordered — a screen, not a stack of paper. Depth comes from the surface ramp (bg → surface → surface-2 → surface-3) plus 1px hairline borders, not shadows. The exceptions are deliberate and few: the primary CTA may carry a soft Scanner Blue glow (`0 4px 16px rgba(59,130,246,0.3)`), and overlays (sheets, modals, Repair Mode) sit on `rgba(0,0,0,0.75–0.8)` scrims with the same flat surfaces inside. No neumorphism, no glassmorphism, no layered drop shadows.

## 5. Components

- **Primary button:** Scanner Blue fill, white 700 text, 12px radius, 48–54px tall, soft blue glow. Instant state change (≤200ms), no bounce.
- **Secondary button:** Surface fill, hairline border, Ink-2 text, same geometry — quiet sibling, never competes.
- **Card:** Surface fill, Border hairline, 16px radius, 20px padding. One card per idea; no nested cards.
- **Chip / stat pill:** Surface-2 or tinted fill, pill radius, 32–34px min height, mono number + sans label ("176 bulletins"). Active = accent tint + accent border.
- **Input:** Input-well fill (darker than its card), border-muted hairline, 10px radius, 48px tall, 16px text; focus = Scanner Blue ring (3px at 25%).
- **Readout module:** Surface-2 panel, 12px radius, Readout Label header, one-at-a-time expandable rows (the dealer-intel pattern).
- **Sheet:** bottom-anchored, 20px top radii, drag handle, `sheet-enter` rise; used for settings, history, scanner.
- **Verdict banner:** tinted background + matching verdict text, mono uppercase verdict word, full-width.
- **Progress:** segmented bars (4px, 2px radius) whose segments carry meaning (amber = ruled out, green = done); the health score ring animates once, ease-out, 700ms.

**Interaction character: precision instrument.** Feedback is immediate and proportional — 150–300ms ease-out transitions, haptics on native, no spring physics, no hover scale-ups that shift layout. Motion exists when data moves: streaming text, progress fills, score rings, live gauges. Every animation has a `prefers-reduced-motion` fallback.

## 6. Do's and Don'ts

**Do**
- Stream anything that takes longer than a second; show the work arriving.
- Put the verdict first (safe? what's wrong? what's it cost?), receipts directly beneath.
- Explain every part's job in the same sentence that names it.
- Use skeletons that match the real layout while data loads.
- Keep 44px minimum touch targets — gloved hands are a persona.
- Test every surface in both themes; status text must hold 4.5:1 in each.

**Don't**
- No gradients as decoration, no gradient text, no glassmorphism.
- No emoji as icons — Lucide line icons at consistent sizes only.
- No decorative motion: if nothing is being measured or revealed, nothing moves.
- No orange-accent-on-black AI-app styling; that's the competitor costume.
- No dense data walls or SKU-grid layouts; one clear answer, then depth.
- Never invent a fourth verdict color or repurpose the three that exist.
- Never put body prose in mono or a measured number in the sans.
