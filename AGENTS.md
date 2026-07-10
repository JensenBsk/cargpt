<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Design context

Strategic and visual ground truth live at the repo root — read them before any UI work:
- `PRODUCT.md` — register (product), positioning ("your advocate against the shop"), brand personality (wow that stays trustworthy), anti-references, design principles.
- `DESIGN.md` — the full token system ("The Master Tech's Scan Tool"): Scanner Blue accent, mono-means-measured typography, verdict colors, component specs.
The `/impeccable` skill (.claude/skills/impeccable) reads both; its detector hook auto-checks UI edits.
