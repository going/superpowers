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
2. **Real semantic HTML, not screenshots.** Code in `<pre><code>` (copyable), tabular data in `<table>`, diagrams as inline `<svg>` with real `<g>`/`<path>` — never an embedded PNG, never ASCII/Unicode-arrow "diagrams". The reader must be able to select and copy any value, line, or label. Syntax-highlight by hand-tokenizing into `<span>` classes colored with CSS vars — don't pull a CDN highlighter.
3. **Build the DOM safely.** Use `textContent` and `document.createElement` + `appendChild`. **Never** assign `innerHTML` from a string containing a variable, user input, computed value, or imported data — it's an XSS vector and many agent harnesses block it via security hooks. Static literal markup inline in your script is fine.
4. **Accessibility is not optional, and color is never the only signal.** Body text meets WCAG AA contrast. Convey status/severity by shape or label *too*, not color alone (traffic-light dots with no text label fail color-blind readers). Controls are keyboard-reachable with visible focus states. If you animate, gate non-essential motion behind `@media (prefers-reduced-motion: no-preference)` (or strip durations and delays in a `reduce` override) — vestibular users get no relief otherwise.
5. **Mobile-responsive.** Collapse cleanly to a single column under ~700px.
6. **Print- and PDF-readable.** `Cmd/Ctrl+P` produces something usable: meaningful backgrounds print, content isn't clipped, dark themes have a sane print fallback. Hide any `position:fixed`/`sticky` nav, TOC, or slide counter in `@media print` so it doesn't overlap the content.
7. **Deliberate aesthetic — skip the generic-AI look.** No default purple gradient + Inter + three centered feature cards. Match the visual direction to the domain (utilitarian for ops, editorial for writeups, engineering for diagrams). Centralize colors/type/spacing in `:root` CSS variables. A grounded header — a small uppercase eyebrow for context, a strong heading, and (when useful) the originating prompt shown verbatim — reads as deliberate and keeps the artifact self-explanatory when reopened later.
8. **No `localStorage` / `sessionStorage` / `IndexedDB`.** Some artifact surfaces forbid browser storage. State lives in JS memory; an export/copy button is the persistence layer.
9. **Sample data is obviously fictional.** When an artifact needs example data, use clearly illustrative placeholders (a fake brand like *Acme*, round or obviously-invented figures). Never fabricate realistic-looking metrics, customer names, or quotes a reader could mistake for real.
10. **Visible last-updated timestamp** in the footer for anything someone revisits (specs, diagrams, reports, roadmaps, dashboards). One-shot editors can skip it.
11. **Descriptive filename.** Save as `<topic>-<kind>.html` so multiple artifacts on a project compose into a readable folder instead of colliding on `output.html`.

## SVG text overflow — the #1 diagram failure

SVG `<text>` does **not** wrap, and the browser won't reflow your layout to make room. Size a box for "Service A" and label it "Authentication & Authorization Service" and the text bleeds into the next node.

- **Default for any label longer than ~12 chars or that might vary:** wrap with `<foreignObject>` containing a real HTML `<div>` — it wraps, pads, and ellipsizes for real.
- **Plain `<text>` only for short, fixed labels** — and even then, size the shape *from* the label (≥ 8px/char + 16px padding each side at 14px), not the other way around.
- **Title + subtitle node:** stack two `<text>` elements with explicit `y` offsets (dimmer fill on the second) rather than reaching for `<foreignObject>`.
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

**Explorable / exportable diagrams:** give each node a `data-key` and update a sticky detail `<aside>` on click. To let the reader save the diagram, serialize the `<svg>` (`XMLSerializer` → `Blob` → a temporary download link) — and embed a `<style>` inside the SVG's `<defs>` so the downloaded file keeps its fonts.

## Choosing the diagram type

Pick the shape that fits the relationship, then keep one direction (left-to-right *or* top-to-bottom) across the whole diagram and hold to three colors used for type/status, never decoration.

| Type | Use when | Key conventions |
|---|---|---|
| **Flowchart / data-flow** | Request paths, ETL pipelines, decision branches | Boxes = stages, diamonds = branches, edges annotated with the data shape |
| **Sequence** | Interactions over time across actors | Vertical lifelines, arrows flow downward, steps numbered |
| **State machine** | Discrete states + transitions (order status, connection state, UI mode) | Circles = states, arrows labeled with triggering event + side effect |
| **Architecture / component** | "How the system fits together" | Layers or zones; show data-ownership boundaries; sync vs async edges (below) |
| **Dependency graph** | "What depends on what" — modules, packages, services | Directed edges, layer by depth, cycles highlighted in red |
| **Timeline / Gantt** | Sequences with duration | Horizontal time axis, bars for activities, milestones as vertical lines |
| **Layered / sandwich** | Stack-like concepts (network layers, request lifecycle) | Horizontal bands, each labeled, concrete details inside |

**Architecture edge + shape vocabulary** (so styles aren't reinvented per diagram): solid = synchronous call, dashed = asynchronous (queue/event), dotted = optional/fallback, thick = hot path, red = known problem. Rectangle = service, cylinder = data store, hexagon/pill = queue or topic, cloud = third-party, person = actor. For 10+ components, use zoom levels in one file — a zone map up top linking down to per-zone and per-service detail sections.

## Interactivity without dependencies

You rarely need a framework or a CDN — the native toolkit covers most artifacts, accessibly and with less code:

- **Progressive disclosure:** `<details>`/`<summary>` for collapsible sections (file diffs, FAQs, long step lists). Keyboard-accessible and screen-reader-announced for free; rotate a CSS `::before` chevron on `details[open]`. Reach for this before hand-rolling an accordion.
- **Toggles / tabs / segmented controls:** native `<input type="radio">` or `checkbox` styled with `label:has(input:checked)` — selection state with zero JS, keyboard-navigable by default.
- **Tunable parameters (sliders/knobs):** on input, mutate a CSS variable — `document.documentElement.style.setProperty('--pad', v + 'px')` — and let the cascade repaint; no re-render.
- **Slide deck:** `scroll-snap-type:y mandatory` + `scroll-snap-align:start` per slide; `→`/`space` next, `←` previous, `f` toggles fullscreen (`requestFullscreen`/`exitFullscreen`), `n` toggles speaker notes kept in an `<aside>` per `<section>`. Sync `location.hash` to the slide number so `#3` deep-links slide 3; an `IntersectionObserver` keeps the "N / M" counter in sync. Size headings with `clamp(40px,6vw,64px)`.
- **Stable demos:** seed any placement/shuffle from a tiny inline hash (e.g. FNV-1a) instead of `Math.random()`, so reload and "reset" return the same layout.
- **Re-render on input:** debounce with `requestAnimationFrame`, not a `setTimeout` guess. For `contenteditable`, intercept paste (insert `text/plain` only) and Enter so the markup can't corrupt.

**Exporting a result.** When the artifact's value is what the reader hands back, give it an **export button** that serializes state to JSON or an indented outline and copies it with a hardened clipboard helper (async Clipboard API → `execCommand('copy')` → visible-textarea fallback) — never a bare `navigator.clipboard.writeText`, which breaks on `file://` and in sandboxes. One export affordance per result; don't make the reader choose between redundant "copy as X" buttons. *Genuinely distinct* exports are fine — a config editor offering "copy diff" vs "copy full" serves two real needs. There's no background server here; the clipboard round-trip is the contract.

## Design-token / palette pages

When the artifact *is* a palette, type scale, or token reference, rendered swatches aren't enough — give it the affordances markdown can't:

- **Contrast per pairing, not in the abstract.** Show each color's WCAG ratio against the colors it will actually sit on (text on background), tagged `AA` / `AAA` / `fail`. Never hide a failing pair.
- **Dual-click copy.** Click the swatch to copy the CSS variable (`var(--accent-500)`); click the value to copy the raw hex/token. Flash a brief "copied".
- **Bulk export.** A "Copy all as CSS variables" button emits a paste-ready `:root { … }` block for every token shown.
- **Type samples in real sentences, not lorem ipsum** — each labeled with font, weight, size, line-height, and letter-spacing so the scale can be judged in context.

## Red Flags — STOP

| Thought | Reality |
|---|---|
| "I'll draw the diagram with box-chars / CSS boxes + arrows" | Use real inline `<svg>`. ASCII/Unicode arrows are the workaround you no longer need. |
| "Color-coded dots, no legend needed" | Color alone fails color-blind readers and prints flat. Add a shape or text label. |
| "Dark theme looks sharp" | Did you check the print fallback and WCAG contrast? |
| "I'll just set `el.innerHTML = …` with the data" | XSS + security-hook trip. `textContent` / `createElement`. |
| "It's a quick page, skip mobile/print" | The single-column + print fallback cost is small; reviewers open these on phones. |
| "I'll render it inline so they see it now" | Inline rendering strips features and themes unreadably. Write the file. |
| "It's just a little animation" | Gate it behind `prefers-reduced-motion: no-preference` — motion makes some users ill. |
| "I'll hand-roll an accordion / tabs in JS" | `<details>`/`<summary>` and `label:has(input:checked)` do it accessibly with zero JS. |
| "Realistic sample numbers look better" | Make placeholders obviously fake (Acme, round numbers) so no one mistakes them for real. |

## Anti-patterns

- Generic AI aesthetic (purple gradient, Inter, centered hero, three feature cards).
- Decorative visuals that carry no information — every diagram should say something prose can't.
- Diagrams as screenshots/PNGs instead of real SVG.
- More than ~12 elements in one diagram — split into zoom levels.
- Burying open questions / key numbers in a flat wall of text instead of surfacing them visually.

---

*Adapted for static, self-contained output from [f-labs-io/agent-html-skills](https://github.com/f-labs-io/agent-html-skills) (MIT), itself derived from Thariq's "The Unreasonable Effectiveness of HTML." The 16-skill original adds an interactive submit-back pipeline (local server + Monitor) that this consolidated skill deliberately omits. Patterns also informed by Anthropic's [html-effectiveness](https://github.com/anthropics/html-effectiveness) example gallery (MIT).*
