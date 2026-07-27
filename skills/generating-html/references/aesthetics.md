# Aesthetics, type, and token pages

Read when picking a visual direction, or when the artifact *is* a palette or type scale.

## Pick a direction before you start

The generic-AI look — purple gradient, Inter, three centered feature cards — is what you get by default, so choose deliberately instead. Match the direction to the domain:

| Direction | Reads as | Fits |
|---|---|---|
| **Editorial** | Large serif headlines, generous whitespace, sparse color | Writeups, reports, explainers, decks |
| **Technical / engineering** | Crisp lines, monospace labels, dark theme, one accent | Diagrams, ops dashboards, dev-tool docs |
| **Textbook** | Confident type, serif labels, two-color emphasis | Teaching artifacts, concept explainers |
| **Product-doc** | Clean geometric, soft shadows, subtle color | Specs, design systems, roadmaps |
| **Brutalist** | Heavy type, asymmetric layout, flat color blocks | Decks, brainstorms, anything that should feel loud |
| **Sketch** | Slightly hand-drawn, warm neutrals (Excalidraw-ish) | Early diagrams, thinking-out-loud artifacts |

Pick one and commit. Mixed directions read as unfinished.

## Type pairings that aren't generic

All available on Google Fonts, so they satisfy the self-contained rule:

- Fraunces + Geist
- Instrument Serif + IBM Plex Sans
- Newsreader + DM Sans
- Spectral + Outfit

Avoid commercial-only families (GT Sectra, Söhne) unless the user holds a license.

Centralize colors, type, and spacing in `:root` CSS variables so the artifact can be re-skinned in one place — and so the design decisions are visible rather than buried across 40 inline declarations.

**Ground the header.** A small uppercase eyebrow for context, a strong heading, and — when useful — the originating prompt shown verbatim. It reads as deliberate, and it keeps the artifact self-explanatory when someone reopens it months later with no memory of why it exists.

## Content in mockups

Realistic in **shape**, obviously fake in **identity**. Lorem ipsum makes a design impossible to judge — real-length names, real-shaped data, and real sentences are what expose a layout's problems. But keep the identities plainly invented (*Acme*, round numbers) so nothing reads as a real customer or a real metric.

## Design-token and palette pages

When the artifact *is* a palette, type scale, or token reference, rendered swatches aren't enough:

- **Every token gets four things:** the value rendered for real (the actual color, spacing, shadow), its identifier (`--color-accent-500`), its value (`#B8602A`), and a copy button.
- **Contrast per pairing, not in the abstract.** Show each color's WCAG ratio against the colors it will actually sit on, tagged `AA` / `AAA` / `fail`. Never hide a failing pair — designers ship inaccessible palettes precisely when contrast isn't visible.
- **Dual-click copy.** Click the swatch to copy the CSS variable (`var(--accent-500)`); click the value to copy the raw hex. Flash a brief "copied".
- **Bulk export.** A "Copy all as CSS variables" button emitting a paste-ready `:root { … }` block.
- **Type samples in real sentences**, each labeled with font, weight, size, line-height, letter-spacing.
- **Theme variants** (light/dark/high-contrast) in a tab strip, with the choice in `location.hash` so a link can deep-link a theme. Show the same component in each — colors alone don't tell the whole story.

Sections a complete token doc usually covers: color, type, spacing, radius, shadow/elevation, motion (with a replay button), and a small set of representative components proving the tokens compose.

## Anti-patterns

- Hex codes without rendered swatches — that defeats the point of using HTML.
- Lorem ipsum in type samples.
- Listing tokens without grouping or showing how they compose.
- Skipping the accessibility info.
- Decorative animation in a motion section instead of the actual motion tokens.
