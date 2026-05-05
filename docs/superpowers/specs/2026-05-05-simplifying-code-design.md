# Design: `simplifying-code` skill

**Date:** 2026-05-05
**Scope:** Fork-local (`going/superpowers`); not intended for upstream PR.
**Status:** Approved (pending implementation)

## Problem

This fork has no skill for behavior-preserving refactor. The `agent-skills/code-simplification` skill carries a strong, well-tested treatment of this work — Five Principles, four-step process (Chesterton's Fence first), language-specific examples, rationalizations table, red flags, and a verification checklist — but it lives in a different repo and is not loaded by this fork's bootstrap.

The upstream/installed `obra/superpowers` already has a port (`simplifying-code`) that adapts the agent-skills content. That port is not in this fork's source tree.

## Goal

Add a `skills/simplifying-code/SKILL.md` to this fork that contains the agent-skills' content (Five Principles, four-step process, language examples inlined) under the upstream's frontmatter `name`/`description`, so the skill triggers on the right phrases and stays disambiguated from the harness's built-in `simplify` skill.

## Non-goals

- Replacing or modifying the harness's built-in `simplify` skill (different intent: issue-finding code review, not behavior-preserving refactor).
- Splitting language examples into a `references/` directory. The user chose to keep examples inline (`B` in the brainstorming flow). This costs more context per skill load but matches agent-skills' structure 1:1.
- Upstream contribution. Fork-local only.

## Design decisions

| Decision | Choice | Rationale |
|---|---|---|
| Source-of-truth for body content | `agent-skills/code-simplification/SKILL.md` | User chose `B` — follow agent-skills' content/structure |
| Language-example structure | Inlined in SKILL.md | Matches agent-skills'; one-file skill is simpler to maintain |
| Frontmatter `name` | `simplifying-code` | Matches user's request and upstream convention; `code-simplification` is a noun phrase, less natural as a skill name |
| Frontmatter `description` | Upstream's verbatim | Includes explicit trigger phrases (better triggering accuracy) and disambiguates from built-in `simplify` |
| Attribution line | Kept from agent-skills | Acknowledges Claude Code Simplifier plugin as the original source |
| Coexistence with built-in `simplify` | Disambiguated in frontmatter description | Built-in `simplify` does issue-finding review; this skill does behavior-preserving refactor — different lanes |

## Files to create

```
skills/simplifying-code/
└── SKILL.md
```

No new directories outside `skills/`. No `references/` subdirectory (per the inlined-examples decision). No modifications to existing files.

### `SKILL.md` structure

**Frontmatter:**

```yaml
---
name: simplifying-code
description: Simplify code for clarity while preserving exact behavior — refactor without changing what it does. Trigger phrases include "simplify this code", "refactor for clarity", "reduce complexity", "clean up this function". For code review or issue-finding (not behavior-preserving refactor), use the built-in `simplify` skill (review changed code for quality, then fix issues) instead.
---
```

**Body sections (in order):**

1. **Title:** `# Simplifying Code`
2. **Attribution:** `> Inspired by the [Claude Code Simplifier plugin](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/code-simplifier/agents/code-simplifier.md). Adapted here as a model-agnostic, process-driven skill for any AI coding agent.`
3. **Overview** — comprehension speed, not line count; "Would a new team member understand this faster than the original?"
4. **When to Use / When NOT to Use** — bullets verbatim from agent-skills.
5. **The Five Principles**
   1. Preserve Behavior Exactly (with the four-question checklist).
   2. Follow Project Conventions (with the three-step before-simplifying list).
   3. Prefer Clarity Over Cleverness (with two TypeScript before/after examples).
   4. Maintain Balance (four over-simplification traps).
   5. Scope to What Changed.
6. **The Simplification Process**
   - Step 1: Understand Before Touching (Chesterton's Fence) — six questions to answer first.
   - Step 2: Identify Simplification Opportunities — three tables: Structural complexity, Naming and readability, Redundancy.
   - Step 3: Apply Changes Incrementally — four-step per-simplification loop, plus the Rule of 500.
   - Step 4: Verify the Result — four before/after questions.
7. **Language-Specific Guidance** (INLINED, not in `references/`):
   - TypeScript / JavaScript: four examples (unnecessary async wrapper; verbose conditional assignment; manual array building; redundant boolean return).
   - Python: two examples (verbose dictionary building; nested conditionals with early return).
   - React / JSX: two examples (verbose conditional rendering; prop drilling — judgment-call note, no auto-refactor).
8. **Common Rationalizations** — seven-row table, verbatim from agent-skills.
9. **Red Flags** — seven bullets, verbatim from agent-skills.
10. **Verification** — nine-item checklist, verbatim from agent-skills.

## Differences from agent-skills source

| Element | agent-skills source | This skill |
|---|---|---|
| Filename / dir | `code-simplification/SKILL.md` | `simplifying-code/SKILL.md` |
| Frontmatter `name` | `code-simplification` | `simplifying-code` |
| Frontmatter `description` | Conceptual usage description | Trigger-phrases + disambiguation from built-in `simplify` |
| Body content | Five Principles + four-step process + language examples + rationalizations + red flags + verification | Identical |
| Attribution | "Inspired by Claude Code Simplifier plugin" | Identical |

## Excluded from scope

- **`references/` split.** Upstream uses per-language reference files to save context. This fork keeps examples inline per the user's `B` choice. If context cost becomes an issue later, the split can be added in a follow-up.
- **Additional language examples.** Only TypeScript, Python, and React are covered (matching agent-skills' source). Other languages can be added later if needed.
- **Cross-skill pointers.** `simplify`-built-in disambiguation is in the frontmatter description. No body-level pointer to other skills (no link to `requesting-deep-review`, `requesting-code-review`, etc.) — this skill stands alone.

## Verification

Same approach as `requesting-deep-review`:

1. **Triggering test (positive).** In a fresh session: `simplify this code: [paste a verbose snippet]`. Confirm `superpowers:simplifying-code` is invoked, not the built-in `simplify`.
2. **Triggering test (positive, alt phrasings).** Try each of the upstream's trigger phrases: `"refactor for clarity"`, `"reduce complexity"`, `"clean up this function"`. Each should fire `simplifying-code`.
3. **Disambiguation test.** Send `review the changed code for quality issues`. Confirm the model invokes the built-in `simplify` (not `simplifying-code`) — that's the issue-finding review skill.
4. **Content smoke check.** grep-based verification that all required sections, principles, language examples, and the trigger phrases in the description are present. (To be specified in the implementation plan.)

The dispatch test from `requesting-deep-review` doesn't apply — `simplifying-code` is a *self-execution* skill (the calling agent does the simplification work in-session), not a dispatch skill.

`CLAUDE.md`'s upstream eval-evidence bar does not gate this fork-local change.

## Open questions

None.
