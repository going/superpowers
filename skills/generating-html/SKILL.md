---
name: generating-html
description: Use when producing a deliverable that is visual, spatial, interactive, or longer than a screen — specs, plans, RFCs, design docs, diagrams, flowcharts, architecture/ERD maps, dashboards, filterable data tables, color palettes / design tokens, slideshows, roadmaps/timelines, comparison matrices, mind maps, research reports, code-tour writeups. Reach for a self-contained HTML file over long-form markdown whenever color, layout, diagrams, or interactivity carry meaning — even when the user doesn't say "HTML".
---

# Generating HTML Artifacts

## Overview

Long-form markdown throws away the things that make a deliverable land: color, layout, real diagrams, type hierarchy, interactivity. When an answer is visual, spatial, comparative, or longer than a screen, a **single self-contained `.html` file the reader opens in a browser** is the better surface.

**Core principle:** Choosing HTML is the easy half. The hard half — and the one that's skipped — is meeting a consistent quality floor *every time*: real SVG (not ASCII/Unicode arrows), accessibility beyond color, mobile + print, safe DOM, and a deliberate aesthetic. This skill is that floor plus a catalog of artifact patterns.

## When to Use

Reach for an HTML artifact when the deliverable is any of:

| Category | Use when |
|---|---|
| Spec / plan / RFC / design doc | Planning artifact longer than a screen, or shared with reviewers / fed back to another session |
| Diagram / flowchart / sequence / state machine | The explanation leans on arrows, boxes, layers, or "first… then… meanwhile" |
| Architecture / ERD map | A real system topology or database schema |
| Dashboard / data explorer | Filterable tables, faceted search, log/metric views |
| Design tokens / palette | Colors, type scale, spacing — markdown literally can't render a color |
| Slideshow deck | Keyboard-navigable presentation |
| Roadmap / timeline / Gantt | Anything on a time axis |
| Comparison matrix / decision grid | Scoring named candidates across weighted criteria |
| Mind map / brainstorm grid | Branching or N-variant idea exploration |
| Research report / code tour | Multi-source synthesis, PR explainers, refactor risk maps |

**When NOT to use:** a short answer that fits in a few lines of chat; code or docs that belong in the repo (README, comments, source files); anything the user explicitly asked for as markdown or plain text. Don't wrap a two-sentence answer in HTML.

## The Foundation — non-negotiable for every artifact

1. **Write a real `.html` file on disk; never inline-render in chat.** No fenced ```html``` block, no canvas/artifact widget, no iframe. The file must be self-contained: inline CSS and JS, no build step, no CDN/npm runtime. Google Fonts via `<link>` is the one allowed exception.
2. **Real semantic HTML, not screenshots.** Code in `<pre><code>` (copyable), tabular data in `<table>`, diagrams as inline `<svg>` with real `<g>`/`<path>` — never an embedded PNG, never ASCII/Unicode-arrow "diagrams". The reader must be able to select and copy any value, line, or label.
3. **Build the DOM safely.** Use `textContent` and `document.createElement` + `appendChild`. **Never** assign `innerHTML` from a string containing a variable, user input, computed value, or imported data — it's an XSS vector and many agent harnesses block it via security hooks. Static literal markup inline in your script is fine.
4. **Accessibility is not optional, and color is never the only signal.** Body text meets WCAG AA contrast. Convey status/severity by shape or label *too*, not color alone (traffic-light dots with no text label fail color-blind readers). Controls are keyboard-reachable with visible focus states.
5. **Mobile-responsive.** Collapse cleanly to a single column under ~700px.
6. **Print- and PDF-readable.** `Cmd/Ctrl+P` produces something usable: meaningful backgrounds print, content isn't clipped, dark themes have a sane print fallback.
7. **Deliberate aesthetic — skip the generic-AI look.** No default purple gradient + Inter + three centered feature cards. Match the visual direction to the domain (utilitarian for ops, editorial for writeups, engineering for diagrams). Centralize colors/type/spacing in `:root` CSS variables.
8. **No `localStorage` / `sessionStorage` / `IndexedDB`.** Some artifact surfaces forbid browser storage. State lives in JS memory; an export/copy button is the persistence layer.
9. **Visible last-updated timestamp** in the footer for anything someone revisits (specs, diagrams, reports, roadmaps, dashboards). One-shot editors can skip it.
10. **Descriptive filename.** Save as `<topic>-<kind>.html` so multiple artifacts on a project compose into a readable folder instead of colliding on `output.html`.

## SVG text overflow — the #1 diagram failure

SVG `<text>` does **not** wrap, and the browser won't reflow your layout to make room. Size a box for "Service A" and label it "Authentication & Authorization Service" and the text bleeds into the next node.

- **Default for any label longer than ~12 chars or that might vary:** wrap with `<foreignObject>` containing a real HTML `<div>` — it wraps, pads, and ellipsizes for real.
- **Plain `<text>` only for short, fixed labels** — and even then, size the shape *from* the label (≥ 8px/char + 16px padding each side at 14px), not the other way around.
- Minimum 40px gap between adjacent nodes; put a background `<rect>` behind any edge label that floats over a path.

```html
<foreignObject x="100" y="60" width="180" height="60">
  <div xmlns="http://www.w3.org/1999/xhtml"
       style="width:100%;height:100%;padding:8px 12px;box-sizing:border-box;
              display:flex;align-items:center;justify-content:center;
              font:14px/1.3 system-ui;text-align:center;overflow-wrap:anywhere;">
    Order processing queue (high-priority)
  </div>
</foreignObject>
```

## Interactive artifacts (static-only)

Some artifacts (mind maps, editors, playgrounds, comparison grids) produce a *result* the user wants to hand back. Keep it simple: one **export / copy button** that serializes the state to JSON (or an indented outline) and copies it to the clipboard for paste-back. One button per artifact — not parallel "copy as X" affordances.

Use a hardened clipboard helper (async Clipboard API → `execCommand('copy')` → visible textarea fallback), not a bare `navigator.clipboard.writeText` — the latter breaks in `file://` and sandboxed contexts. There is no background server in this skill; the clipboard round-trip is the contract.

## Red Flags — STOP

| Thought | Reality |
|---|---|
| "I'll draw the diagram with box-chars / CSS boxes + arrows" | Use real inline `<svg>`. ASCII/Unicode arrows are the workaround you no longer need. |
| "Color-coded dots, no legend needed" | Color alone fails color-blind readers and prints flat. Add a shape or text label. |
| "Dark theme looks sharp" | Did you check the print fallback and WCAG contrast? |
| "I'll just set `el.innerHTML = …` with the data" | XSS + security-hook trip. `textContent` / `createElement`. |
| "It's a quick page, skip mobile/print" | The single-column + print fallback cost is small; reviewers open these on phones. |
| "I'll render it inline so they see it now" | Inline rendering strips features and themes unreadably. Write the file. |

## Anti-patterns

- Generic AI aesthetic (purple gradient, Inter, centered hero, three feature cards).
- Decorative visuals that carry no information — every diagram should say something prose can't.
- Diagrams as screenshots/PNGs instead of real SVG.
- More than ~12 elements in one diagram — split into zoom levels.
- Burying open questions / key numbers in a flat wall of text instead of surfacing them visually.

---

*Adapted for static, self-contained output from [f-labs-io/agent-html-skills](https://github.com/f-labs-io/agent-html-skills) (MIT), itself derived from Thariq's "The Unreasonable Effectiveness of HTML." The 16-skill original adds an interactive submit-back pipeline (local server + Monitor) that this consolidated skill deliberately omits.*
