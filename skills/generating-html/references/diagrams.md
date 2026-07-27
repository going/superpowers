# Diagram craft

Read when the artifact contains any inline `<svg>` diagram.

## SVG text overflow — the #1 diagram failure

SVG `<text>` does **not** wrap, and the browser won't reflow your layout to make room. Size a box for "Service A" and label it "Authentication & Authorization Service" and the text bleeds into the next node.

- **Default for any label longer than ~12 chars or that might vary:** wrap with `<foreignObject>` containing a real HTML `<div>` — it wraps, pads, and ellipsizes for real.
- **Plain `<text>` only for short, fixed labels** — and even then, size the shape *from* the label (≥ 8px/char + 16px padding each side at 14px), not the other way around.
- **Title + subtitle node:** stack two `<text>` elements with explicit `y` offsets (dimmer fill on the second) rather than reaching for `<foreignObject>`.
- **Multi-line `<tspan>`:** set `dy="1.2em"` per line and grow the box height accordingly.

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

**Before saving, check each of these:**

1. **Did you measure?** No box set to a guessed width — either `<foreignObject>`, or width computed from label length.
2. **Padding ≥ 8px on every side.** Cramped labels read as broken.
3. **Minimum 40px gap between adjacent nodes**, so one node's label can't brush its neighbour.
4. **Backing `<rect>` behind any edge label** that floats over a path — otherwise it turns unreadable where the path crosses something.
5. **A label over ~32 chars is probably not one line.** Shorten it or wrap it.
6. **Test with the longest plausible value**, not the one in the prompt.

## Choosing the diagram type

Pick the shape that fits the relationship, keep one direction (left-to-right *or* top-to-bottom) across the whole diagram, and hold to three colors used for type/status, never decoration.

| Type | Use when | Key conventions |
|---|---|---|
| **Flowchart / data-flow** | Request paths, ETL pipelines, decision branches | Boxes = stages, diamonds = branches, edges annotated with the data shape |
| **Sequence** | Interactions over time across actors | Vertical lifelines, arrows flow downward, steps numbered so prose can reference them |
| **State machine** | Discrete states + transitions (order status, connection state, UI mode) | Circles = states, arrows labeled with triggering event + side effect |
| **Architecture / component** | "How the system fits together" | Layers or zones; show data-ownership boundaries; sync vs async edges (below) |
| **Dependency graph** | "What depends on what" — modules, packages, services | Directed edges, layer by depth, cycles highlighted in red |
| **Timeline / Gantt** | Sequences with duration | Horizontal time axis, bars for activities, milestones as vertical lines |
| **Layered / sandwich** | Stack-like concepts (network layers, request lifecycle) | Horizontal bands, each labeled, concrete details inside |

## Architecture vocabulary

So styles aren't reinvented per diagram:

- **Edges:** solid = synchronous call · dashed = asynchronous (queue/event) · dotted = optional/fallback · thick = hot path · red = known problem / current incident.
- **Shapes:** rectangle = service · cylinder = data store · hexagon or pill = queue/topic · cloud = third-party · person = actor.
- **Color:** pick one meaning and hold it — by domain, by criticality tier, or by owning team. Never decorative.

**Zoom levels.** For 10+ components, use one file with three tiers: a zone map at the top (no internal detail), zone deep-dives below, then service deep-dives for the few worth it. Link from each zone in the top map down to its section.

**Annotations** are what make a system diagram useful during an incident: "single point of failure", "~10k req/s", "owned by Platform", "deprecated, migrating to X". Put them in the margin on thin connecting lines — don't crowd the diagram body.

**Show the failure modes, not just the happy path.** And date-stamp visibly: an out-of-date diagram that looks authoritative is worse than none.

## Layout principles

- **Direction:** pick one and hold it.
- **Alignment:** align on a grid; diagonals are noise unless they mean something.
- **Labels:** every box and every arrow gets one. Unlabeled arrows leave the reader guessing.
- **Type:** a single sans at 1–2 sizes. Resist varying it.
- **Legend** whenever shape or color carries meaning.
- Pair every diagram with a short prose caption. The diagram alone is rarely enough.
- One SVG per concept with its own caption, not one giant SVG holding everything.

## Explorable and exportable diagrams

Give each node a `data-key` and update a sticky detail `<aside>` on click. To let the reader save the diagram, serialize the `<svg>` (`XMLSerializer` → `Blob` → temporary download link) — and embed a `<style>` inside the SVG's `<defs>` so the downloaded file keeps its fonts.

## Anti-patterns

- ASCII/Unicode-arrow "diagrams", or a screenshot of a diagram drawn elsewhere.
- More than ~12 elements in one diagram — split into zoom levels.
- "Box of arrows" with no legend.
- Decorative arrows that don't convey direction.
- The same diagram redrawn in multiple visual styles in one document.
