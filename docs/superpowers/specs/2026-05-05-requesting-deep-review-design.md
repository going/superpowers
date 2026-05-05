# Design: `requesting-deep-review` skill

**Date:** 2026-05-05
**Scope:** Fork-local (`going/superpowers`); not intended for upstream PR.
**Status:** Approved (pending implementation)

## Problem

This fork has only one code-review skill: `requesting-code-review` (fast path, dispatches a `general-purpose` subagent with a 5-axis review template). Two gaps:

1. **No "deep review" path.** High-stakes changes (security-sensitive code, cross-cutting refactors, hard-to-roll-back migrations) get the same routine review as a small feature. There is no way for the human to opt in to deeper scrutiny without abandoning the skill system and writing the prompt by hand.
2. **Useful review content lives outside the repo.** `agent-skills/code-review-and-quality` carries reviewer-side material this fork would benefit from — six-lens framework, richer severity prefixes, change-size discipline, change-description quality, anti-rubber-stamp honesty rules, common-rationalizations table — but it is a self-review skill in a different repo, so the content is not reachable from this fork's workflows.

## Goal

Add a new `requesting-deep-review` skill that:

- Dispatches a `general-purpose` subagent (matching this repo's convention — no `agents/` directory) with a richer six-lens review brief.
- Coexists with `requesting-code-review` as the explicit-opt-in deep path.
- Folds in the high-value reviewer-side and author-side content from `agent-skills/code-review-and-quality`.

## Non-goals

- Replacing `requesting-code-review`. The fast path stays as the routine per-task review for subagent-driven development.
- Adding a `senior-reviewer` agent persona / `agents/` directory. This repo does all persona work via prompt templates; we follow that convention.
- Auto-invoking the deep review at any checkpoint. Explicit opt-in only.
- Upstream contribution. This is fork-local; eval rigor required by `CLAUDE.md` for upstream changes does not gate this work.

## Design decisions

| Decision | Choice | Rationale |
|---|---|---|
| Pattern | Dispatch skill | Matches `requesting-code-review`; keeps main context clean; parallelizable |
| Subagent type | `general-purpose` | Matches repo convention; avoids net-new `agents/` infrastructure |
| Trigger philosophy | Explicit opt-in only | Mirrors validated upstream design; preserves the cheap fast path |
| Scope of fold-in | Reviewer-side + author-side | Six lenses + severity + dead-code + honesty + rationalizations + change sizing + change-description quality |
| Coexistence | Add a small pointer in `requesting-code-review/SKILL.md` | Non-invasive; doesn't restructure tuned content |

## Files to create

```
skills/requesting-deep-review/
├── SKILL.md                 # When/how to dispatch; contrast with fast path
└── senior-reviewer.md       # The dispatch prompt template (filled by caller)
```

### `SKILL.md`

**Frontmatter `description`** (the auto-trigger string):

> Use ONLY when the human explicitly requests a deep, thorough, senior-level, or six-lens code review — trigger phrases include "deep review", "review deeply", "thorough review", "senior review", "/deep-review". Dispatches a `general-purpose` subagent that evaluates changes across correctness, readability, architecture, security, performance, and production readiness. For ordinary after-task review, use `requesting-code-review` instead.

**Body sections:**

1. **Header + core principle.** "Opt-in only. NOT auto-invoked by `subagent-driven-development` or `executing-plans`."
2. **When to Request Deep Review.** When to reach for it (security-sensitive, cross-cutting refactor, hard-to-roll-back changes) vs. keep using the fast path.
3. **How to Request.** Get `BASE_SHA` / `HEAD_SHA`, dispatch via `Task tool (general-purpose)` with the filled `senior-reviewer.md` template.
4. **Severity Prefixes.** `Critical:` / *(no prefix)* / `Nit:` / `Optional:` / `FYI:`. Richer than `requesting-code-review`'s Critical/Important/Minor — the distinction is load-bearing so authors do not treat all comments as required.
5. **Contrast with `requesting-code-review`.** A table making the fast-path vs. deep-path distinction explicit (trigger, framework, severity labels, dead-code handling, typical use).
6. **Example.** Sample dispatch + sample subagent output.
7. **Red Flags.** Never run both reviewers on the same diff; never use this for routine per-task review; do not ignore severity prefixes when acting on findings.
8. **How This Skill Is Wired.** Two-file structure (SKILL.md + template), edits to review criteria must land in the template.

### `senior-reviewer.md` (dispatch prompt template)

Adapted from upstream's `senior-reviewer.md`, with two adjustments:

- Dispatch target is `general-purpose` (not a custom `senior-reviewer` subagent_type).
- Folds in change-sizing, change-description quality, honesty rules, and common-rationalizations content from `code-review-and-quality`.

**Placeholders:** `{WHAT_WAS_IMPLEMENTED}`, `{PLAN_OR_REQUIREMENTS}`, `{BASE_SHA}`, `{HEAD_SHA}`, `{DESCRIPTION}`.

**Sections:**

1. **Role + task.** Senior reviewer evaluating across six lenses; emit the output format at the bottom.
2. **Inputs.** Filled placeholders + `git diff --stat` and `git diff` commands.
3. **Six-lens checklist:**
   - **Correctness** — spec match, edge cases, tests verify behavior, no races / off-by-one.
   - **Readability & Simplicity** — naming, control flow, "could this be done in fewer lines?", abstractions earning complexity, dead artifacts.
   - **Architecture** — pattern fit, module boundaries, no circular deps, abstraction level.
   - **Security** — input validation, secrets, authn/authz, parameterized queries, untrusted external data.
   - **Performance** — N+1 patterns, unbounded loops, sync/async, re-renders, pagination.
   - **Production Readiness** — migrations, backward compatibility, docs, staged rollout for risky changes.
4. **Change-size finding** *(new vs. upstream)* — `~100` / `~300` / `~1000` line tiers; flag oversized changes as findings with appropriate severity. A 1500-line PR that should be split is a `Critical:` merge blocker, not a `Nit:`.
5. **Change-description finding** *(new)* — first line imperative + standalone; body explains why, not what. Flag weak descriptions.
6. **Severity prefixes.** `Critical:` / *(no prefix)* / `Nit:` / `Optional:` / `FYI:` with explicit meanings.
7. **Dead code hygiene.** List unreachable/unused code; **ask before recommending deletion** — do not silently flag for removal.
8. **Honesty rules** *(new)* — don't rubber-stamp; quantify problems ("adds ~50ms per row" beats "might be slow"); push back on approaches with clear problems; comment on code, not people.
9. **Common rationalizations** *(new)* — embedded table:
   - "It works, that's good enough" → working but unreadable/insecure code creates compounding debt.
   - "I wrote it, so I know it's correct" → authors are blind to their own assumptions.
   - "We'll clean it up later" → later never comes; require cleanup before merge.
   - "AI-generated code is probably fine" → AI code needs more scrutiny, not less.
   - "The tests pass, so it's good" → tests don't catch architecture, security, or readability issues.
10. **Output format.**
    - **Verdict:** APPROVE | REQUEST CHANGES + 1-2 sentence overview.
    - **Findings by lens** — each finding severity-prefixed, with file:line + what's wrong + why it matters + how to fix.
    - **Dead code identified** — list + "Safe to remove these?" prompt.
    - **What's done well** — at least one specific positive observation.
    - **Verification story** — tests reviewed, build verified, manual verification.
11. **Critical rules.** DO/DON'T:
    - DO: severity-prefix every finding, cite file:line, explain WHY, acknowledge strengths, quantify problems, give a clear verdict.
    - DON'T: say "looks good" without evidence, mark nitpicks as Critical, give feedback on code you didn't review, be vague, avoid the verdict.

## Files to modify

### `skills/requesting-code-review/SKILL.md`

Append to the "When to Request Review" section, after the existing "Optional but valuable" list:

```markdown
**Escalate to `requesting-deep-review` when:**
- Change is security-sensitive, touches data handling, or is hard to roll back (migrations, external APIs, schema changes)
- Cross-cutting refactor touching many modules
- Human explicitly asks for a "deep review", "thorough review", or "senior review"

Don't run both reviewers on the same diff — pick one.
```

No other changes to the existing skill. Tuned content (Red Flags table, "When to Request Review" intro, dispatch instructions) is left intact per `CLAUDE.md` guidance.

## Excluded from scope

These `code-review-and-quality` sections are deliberately not folded in:

- **Multi-model review pattern.** Meta/process, not what one review produces.
- **Slow-review costs / response-time guidance.** Team-scheduling concern, irrelevant for a per-dispatch skill.
- **Handling-disagreements hierarchy.** Orthogonal; already covered by `receiving-code-review`.
- **Dependency-discipline checklist.** Could become its own skill if needed; out of scope per "B" decision.
- **Full review checklist (markdown).** Duplicative with the six-lens checklist; redundant.

## Verification

This is a net-new skill plus one small append to an existing skill. Verification:

1. **Triggering test.** In a fresh session, send the prompt: `please do a deep review of HEAD~1..HEAD`. Confirm the model invokes `superpowers:requesting-deep-review` (not `requesting-code-review`).
2. **Negative triggering test.** In a fresh session, send: `review the recent changes`. Confirm the model invokes `requesting-code-review` (the fast path), not `requesting-deep-review`.
3. **Dispatch test.** Run the new skill against a real recent commit on this fork. Confirm the subagent produces:
   - Severity-prefixed findings under each of the six lenses.
   - A change-size finding when the diff is oversized (or a confirmation when right-sized).
   - A change-description finding when the commit message is weak (or a confirmation when strong).
   - A "What's done well" observation.
   - A clear verdict.
4. **Coexistence test.** Confirm the pointer in `requesting-code-review/SKILL.md` does not cause the fast path to spuriously route to deep review on routine task completions.

Test transcripts captured in the implementation plan, not in this spec.

`CLAUDE.md`'s upstream eval-evidence bar does not gate this fork-local change.

## Open questions

None.
