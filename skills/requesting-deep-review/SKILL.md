---
name: requesting-deep-review
description: Use ONLY when the human explicitly requests a deep, thorough, senior-level, or six-lens code review — trigger phrases include "deep review", "review deeply", "thorough review", "senior review", "/deep-review". Dispatches a `general-purpose` subagent that evaluates changes across correctness, readability, architecture, security, performance, and production readiness. For ordinary after-task review, use requesting-code-review instead.
---

# Requesting Deep Review

Dispatch a `general-purpose` subagent for a six-lens review: correctness, readability & simplicity, architecture, security, performance, and production readiness — with the readability and architecture lenses drawing on a named Fowler design-smell baseline, plus a dedicated Spec Conformance pass that checks the change against its originating spec requirement by requirement. Use this when a change warrants deeper scrutiny than the default `requesting-code-review` provides.

**Core principle:** Opt-in only. This skill is NOT auto-invoked by `subagent-driven-development` or `executing-plans`. It runs only when the human explicitly asks for a deep review.

## When to Request Deep Review

**Reach for this (instead of `requesting-code-review`) when:**
- About to merge a significant change — security-sensitive, architecture-altering, or data-handling code
- Following up on a close-call fast review and you want an independent, more rigorous lens
- Cross-cutting refactor touching many modules
- Changes that are hard to roll back (migrations, external-facing APIs, data format changes)

**Keep using `requesting-code-review` (the fast path) when:**
- Routine task completion during subagent-driven development
- Self-contained feature work with good test coverage
- Anything small enough that the overhead of a deep review isn't earned

## How to Request

**1. Get git SHAs:**

```bash
BASE_SHA=$(git merge-base HEAD origin/main 2>/dev/null || git rev-parse HEAD~1)
HEAD_SHA=$(git rev-parse HEAD)
```

**2. Dispatch the subagent:**

Use the Task tool with `subagent_type: "general-purpose"` and pass the filled template at `skills/requesting-deep-review/senior-reviewer.md` as the prompt.

**Placeholders to fill:**
- `{WHAT_WAS_IMPLEMENTED}` — what you just built
- `{PLAN_OR_REQUIREMENTS}` — what it should do (link to spec/plan if available)
- `{BASE_SHA}` — starting commit
- `{HEAD_SHA}` — ending commit
- `{DESCRIPTION}` — brief summary

**3. Act on feedback, severity-prefix-aware:**
- `Critical:` — fix immediately
- *(no prefix)* — fix before merge
- `Optional:` / `Consider:` — judgment call
- `Nit:` — skip if you want
- `FYI:` — note for context; no action

## Severity Prefixes

| Prefix | Meaning |
|---|---|
| **Critical:** | Blocks merge — must fix (security, data loss, broken functionality, oversized PR) |
| *(no prefix)* | Required — must address before merge |
| **Nit:** | Minor / style — author may ignore |
| **Optional:** / **Consider:** | Suggestion — not required |
| **FYI:** | Informational — no action |

This is richer than `requesting-code-review`'s Critical / Important / Minor — the distinction is load-bearing so authors don't treat all comments as required.

## Contrast with `requesting-code-review`

| Aspect | `requesting-code-review` (fast) | `requesting-deep-review` (this) |
|---|---|---|
| Trigger | After any task | Explicit opt-in only |
| Subagent | `general-purpose` + `code-reviewer.md` template | `general-purpose` + `senior-reviewer.md` template |
| Framework | 5 implicit categories | 6 named lenses + Fowler design-smell baseline |
| Spec conformance | Folded into review | Dedicated requirement-by-requirement pass |
| Severity labels | Critical / Important / Minor | Critical / (no prefix) / Nit / Optional / FYI |
| Change sizing | Not flagged | Explicit finding |
| Change description | Not flagged | Explicit finding |
| Dead code | Not explicitly checked | Explicit "ask before remove" step |
| Typical use | Routine per-task review | Pre-merge or high-stakes changes |

## Example

```
[About to merge a significant auth refactor touching 8 files]

You: Let me request a deep review before merging.

BASE_SHA=$(git merge-base HEAD origin/main)
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch general-purpose subagent via Task tool with senior-reviewer.md template filled]
  WHAT_WAS_IMPLEMENTED: Auth flow refactor — token rotation + session binding
  PLAN_OR_REQUIREMENTS: docs/superpowers/plans/2026-04-19-auth-refactor.md
  BASE_SHA: e2f18a1
  HEAD_SHA: 8bc034d
  DESCRIPTION: Rotate tokens on privilege elevation; bind sessions to device fingerprint

[Subagent returns]:
  Verdict: REQUEST CHANGES
  Security: Critical — device fingerprint uses MD5 (auth.ts:142). Switch to SHA-256.
  Performance: Consider — fingerprint computed per request; cache by session.
  Change sizing: Critical — 1400 lines across 8 files; split into rotation + binding PRs.
  Dead code identified: legacyTokenRefresh() — safe to remove?
  What's done well: comprehensive edge-case tests for expired tokens.

You: [Split the PR, fix MD5 → SHA-256, confirm cache suggestion, remove legacy function]
```

## Red Flags

**Never:**
- Run both reviewers on the same diff "just to be thorough" — pick one
- Use this for routine per-task review (the fast path exists for a reason)
- Ignore severity prefixes when acting on findings

**If the senior reviewer is wrong:**
- Push back with technical reasoning
- Show code/tests that prove it works
- Request clarification or re-review with more context

## How This Skill Is Wired

Two files work together — keep them in sync when the six-lens framework, the design-smell baseline, the Spec Conformance pass, severity prefixes, or output format changes:

- `skills/requesting-deep-review/SKILL.md` (this file) — when and how to dispatch.
- `skills/requesting-deep-review/senior-reviewer.md` — the dispatch template with `{PLACEHOLDERS}`; the orchestrating agent fills it in and passes it as the subagent's prompt.

The contrast table above and the severity prefix table appear in both files because they serve different roles — this file briefs the caller; the template briefs the reviewer. Edits to review criteria must land in both.
