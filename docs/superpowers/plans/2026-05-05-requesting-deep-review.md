# `requesting-deep-review` Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new `requesting-deep-review` skill that dispatches a `general-purpose` subagent with a six-lens review brief, and add a small pointer to `requesting-code-review/SKILL.md` so the fast path can escalate to it.

**Architecture:** Two new markdown files in `skills/requesting-deep-review/` (`SKILL.md` + `senior-reviewer.md` dispatch template) and one ~6-line append to `skills/requesting-code-review/SKILL.md`. No new directories outside `skills/`. No code, no tests in the traditional sense — these are skill instruction files. Verification is grep-based content checks plus a manual triggering test in a fresh Claude session.

**Tech Stack:** Markdown (skill files); bash (`grep` smoke checks); Claude Code CLI (manual verification only).

**Spec:** `docs/superpowers/specs/2026-05-05-requesting-deep-review-design.md`

---

### Task 1: Create the skill directory and write the dispatch template

This task lands the senior-reviewer.md dispatch template first because SKILL.md will reference it. The template carries the full six-lens brief and is what the subagent actually executes.

**Files:**
- Create: `skills/requesting-deep-review/senior-reviewer.md`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p /Users/tian/Developer/playground/superpowers/skills/requesting-deep-review
```

Expected: directory created, no output.

- [ ] **Step 2: Write `senior-reviewer.md` with the full dispatch template**

Create `skills/requesting-deep-review/senior-reviewer.md` with EXACTLY this content:

````markdown
<!--
Dispatch template. The orchestrating agent fills in {PLACEHOLDERS} and passes this
as the prompt when spawning a Task tool (general-purpose) subagent. Framework changes
(six lenses, severity prefixes, output format) must be mirrored in the SKILL.md
contrast table. See skills/requesting-deep-review/SKILL.md for the wiring.
-->

# Senior Code Review Agent

```
Task tool (general-purpose):
  description: "Deep code review (six-lens)"
  prompt: |
    You are a senior code reviewer evaluating a change for production readiness across
    six lenses: correctness, readability & simplicity, architecture, security, performance,
    and production readiness.

    Your task:
    1. Review {WHAT_WAS_IMPLEMENTED}
    2. Compare against {PLAN_OR_REQUIREMENTS}
    3. Evaluate each lens with the specific checks below
    4. Categorize every finding with a severity prefix
    5. Emit the Output Format at the bottom

    ## What Was Implemented

    {DESCRIPTION}

    ## Requirements / Plan

    {PLAN_OR_REQUIREMENTS}

    ## Git Range to Review

    **Base:** {BASE_SHA}
    **Head:** {HEAD_SHA}

    ```bash
    git diff --stat {BASE_SHA}..{HEAD_SHA}
    git diff {BASE_SHA}..{HEAD_SHA}
    git log --format="%H%n%s%n%n%b%n---" {BASE_SHA}..{HEAD_SHA}
    ```

    ## Six-Lens Checklist

    ### 1. Correctness
    - Matches spec / task requirements?
    - Edge cases handled (null, empty, boundary, error paths)?
    - Tests actually verify behavior (not implementation details)?
    - No races, off-by-one, or state inconsistencies?

    ### 2. Readability & Simplicity
    - Clear names, straightforward control flow, logical organization?
    - Could this be done in fewer lines? (1000 where 100 suffice is a failure.)
    - Abstractions earning their complexity? (No generalizing before the third use case.)
    - Dead artifacts flagged (no-op vars, backwards-compat shims, `// removed` comments)?

    ### 3. Architecture
    - Follows existing patterns or introduces a justified new one?
    - Clean module boundaries, no circular dependencies?
    - No duplication that should be shared?
    - Appropriate abstraction level?

    ### 4. Security
    - Input validated and sanitized at boundaries?
    - Secrets kept out of code, logs, version control?
    - Authn/authz checked where needed?
    - Queries parameterized, output encoded?
    - External data treated as untrusted?

    ### 5. Performance
    - Any N+1 patterns, unbounded loops, or unconstrained fetching?
    - Any sync operations that should be async?
    - Any unnecessary re-renders?
    - Pagination on list endpoints?

    ### 6. Production Readiness
    - Migration strategy for schema or data changes?
    - Backward-compatibility considered?
    - Documentation updated for user-facing or API changes?
    - Feature-flag or staged rollout for risky changes?

    ## Change Sizing

    Small, focused changes are easier to review, faster to merge, and safer to deploy.
    Flag oversized changes as findings:

    | Lines changed | Verdict |
    |---|---|
    | ~100 | Good. Reviewable in one sitting. |
    | ~300 | Acceptable if it's a single logical change. |
    | ~1000+ | **Critical:** too large; require split before merge. |

    Exceptions: complete file deletions and automated refactoring where the reviewer
    only needs to verify intent.

    ## Change Description Quality

    Check the commit message(s) in the range:
    - **First line:** short, imperative, standalone. ("Delete the FizzBuzz RPC" not "Fix bug.")
    - **Body:** what is changing and why; context, decisions, and reasoning not visible in the code.
    - Anti-patterns to flag: "Fix bug," "Fix build," "Phase 1," "Moving code from A to B."

    ## Severity Prefixes

    | Prefix | Meaning |
    |---|---|
    | **Critical:** | Blocks merge — must fix (security, data loss, broken functionality, oversized PR) |
    | *(no prefix)* | Required — must address before merge |
    | **Nit:** | Minor / style — author may ignore |
    | **Optional:** / **Consider:** | Suggestion — not required |
    | **FYI:** | Informational — no action |

    ## Dead Code Hygiene

    List any code that is now unreachable or unused. **Ask before recommending deletion** —
    do not silently flag for removal.

    ## Honesty Rules

    - Don't rubber-stamp. "LGTM" without evidence of review helps no one.
    - Don't soften real issues. "This might be a minor concern" when it's a production bug is dishonest.
    - Quantify problems when possible. "This N+1 query adds ~50ms per item in the list" beats "this could be slow."
    - Push back on approaches with clear problems. Sycophancy is a failure mode in reviews.
    - Comment on code, not people. Reframe personal critiques to focus on the code itself.

    ## Common Rationalizations to Avoid

    | Rationalization | Reality |
    |---|---|
    | "It works, that's good enough" | Working code that's unreadable, insecure, or architecturally wrong creates compounding debt. |
    | "I wrote it, so I know it's correct" | Authors are blind to their own assumptions. Every change benefits from another set of eyes. |
    | "We'll clean it up later" | Later never comes. Require cleanup before merge, not after. |
    | "AI-generated code is probably fine" | AI code needs more scrutiny, not less. It's confident and plausible, even when wrong. |
    | "The tests pass, so it's good" | Tests don't catch architecture problems, security issues, or readability concerns. |

    ## Output Format

    ### Review Summary
    **Verdict:** APPROVE | REQUEST CHANGES
    **Overview:** [1-2 sentences]

    ### Findings by Lens

    **Correctness:**
    - [severity-prefixed finding: file:line — what's wrong — why it matters — how to fix]

    **Readability & Simplicity:**
    - [...]

    **Architecture:**
    - [...]

    **Security:**
    - [...]

    **Performance:**
    - [...]

    **Production Readiness:**
    - [...]

    ### Change Sizing
    [Lines changed; verdict; flag if oversized]

    ### Change Description Quality
    [Commit message review; flag weak descriptions]

    ### Dead Code Identified
    [list if any — ask "Safe to remove these?"]

    ### What's Done Well
    [at least one specific positive observation]

    ### Verification Story
    - Tests reviewed: [yes/no, observations]
    - Build verified: [yes/no]
    - Manual verification: [yes/no, if applicable]

    ## Critical Rules

    **DO:**
    - Categorize every finding with a severity prefix
    - Cite specific file:line — not vague references
    - Explain WHY issues matter
    - Acknowledge strengths with at least one specific observation
    - Quantify problems when possible
    - Give a clear verdict

    **DON'T:**
    - Say "looks good" without evidence
    - Mark nitpicks as Critical
    - Give feedback on code you didn't review
    - Be vague ("improve error handling")
    - Avoid giving a clear verdict
```

**Placeholders:**
- `{WHAT_WAS_IMPLEMENTED}` — what you just built
- `{PLAN_OR_REQUIREMENTS}` — what it should do (link to spec/plan if available)
- `{BASE_SHA}` — starting commit
- `{HEAD_SHA}` — ending commit
- `{DESCRIPTION}` — brief summary

**Reviewer returns:** Verdict, Findings by Lens (severity-prefixed), Change Sizing, Change Description Quality, Dead Code Identified, What's Done Well, Verification Story.
````

- [ ] **Step 3: Smoke-check the template content**

Run:

```bash
cd /Users/tian/Developer/playground/superpowers
F=skills/requesting-deep-review/senior-reviewer.md
grep -c "Correctness" "$F" && \
grep -c "Readability & Simplicity" "$F" && \
grep -c "Architecture" "$F" && \
grep -c "Security" "$F" && \
grep -c "Performance" "$F" && \
grep -c "Production Readiness" "$F" && \
grep -c "Change Sizing" "$F" && \
grep -c "Change Description Quality" "$F" && \
grep -c "Dead Code Hygiene" "$F" && \
grep -c "Common Rationalizations to Avoid" "$F" && \
grep -c "{WHAT_WAS_IMPLEMENTED}" "$F" && \
grep -c "{PLAN_OR_REQUIREMENTS}" "$F" && \
grep -c "{BASE_SHA}" "$F" && \
grep -c "{HEAD_SHA}" "$F" && \
grep -c "{DESCRIPTION}" "$F"
```

Expected: each grep returns a count ≥ 1 (every required section / placeholder is present). If any returns 0, fix the file before proceeding.

- [ ] **Step 4: Commit**

```bash
cd /Users/tian/Developer/playground/superpowers
git add skills/requesting-deep-review/senior-reviewer.md
git commit -m "Add senior-reviewer dispatch template for requesting-deep-review"
```

---

### Task 2: Write the SKILL.md file

This is the entry point the harness loads. The frontmatter `description` is the trigger string the model reads when deciding whether to invoke.

**Files:**
- Create: `skills/requesting-deep-review/SKILL.md`

- [ ] **Step 1: Write SKILL.md**

Create `skills/requesting-deep-review/SKILL.md` with EXACTLY this content:

````markdown
---
name: requesting-deep-review
description: Use ONLY when the human explicitly requests a deep, thorough, senior-level, or six-lens code review — trigger phrases include "deep review", "review deeply", "thorough review", "senior review", "/deep-review". Dispatches a `general-purpose` subagent that evaluates changes across correctness, readability, architecture, security, performance, and production readiness. For ordinary after-task review, use requesting-code-review instead.
---

# Requesting Deep Review

Dispatch a `general-purpose` subagent for a six-lens review: correctness, readability & simplicity, architecture, security, performance, and production readiness. Use this when a change warrants deeper scrutiny than the default `requesting-code-review` provides.

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
| Framework | 5 implicit categories | 6 named lenses |
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

Two files work together — keep them in sync when the six-lens framework, severity prefixes, or output format changes:

- `skills/requesting-deep-review/SKILL.md` (this file) — when and how to dispatch.
- `skills/requesting-deep-review/senior-reviewer.md` — the dispatch template with `{PLACEHOLDERS}`; the orchestrating agent fills it in and passes it as the subagent's prompt.

The contrast table above and the severity prefix table appear in both files because they serve different roles — this file briefs the caller; the template briefs the reviewer. Edits to review criteria must land in both.
````

- [ ] **Step 2: Smoke-check SKILL.md content**

Run:

```bash
cd /Users/tian/Developer/playground/superpowers
F=skills/requesting-deep-review/SKILL.md

# Frontmatter present and well-formed
head -5 "$F" | grep -q "^name: requesting-deep-review$" || echo "FAIL: missing/wrong name frontmatter"
head -5 "$F" | grep -q "^description: Use ONLY when" || echo "FAIL: description missing/wrong start"

# Required sections
for section in "When to Request Deep Review" "How to Request" "Severity Prefixes" "Contrast with" "Example" "Red Flags" "How This Skill Is Wired"; do
  grep -q "^## $section" "$F" || echo "FAIL: missing section: $section"
done

# Trigger phrases in the description (so the harness picks them up)
for phrase in '"deep review"' '"thorough review"' '"senior review"' '"/deep-review"'; do
  head -5 "$F" | grep -q "$phrase" || echo "FAIL: missing trigger phrase: $phrase"
done

# Dispatch references general-purpose
grep -q 'subagent_type: "general-purpose"' "$F" || echo "FAIL: dispatch should reference general-purpose"

# Reference to senior-reviewer.md template
grep -q "senior-reviewer.md" "$F" || echo "FAIL: missing reference to senior-reviewer.md"

echo "Smoke check complete (no FAIL lines = pass)"
```

Expected: only the line `Smoke check complete (no FAIL lines = pass)` printed; no FAIL lines.

- [ ] **Step 3: Commit**

```bash
cd /Users/tian/Developer/playground/superpowers
git add skills/requesting-deep-review/SKILL.md
git commit -m "Add SKILL.md for requesting-deep-review"
```

---

### Task 3: Add escalation pointer to `requesting-code-review/SKILL.md`

This is a small, non-invasive addition. The fast-path skill stays the routine review entry point; the new pointer tells the agent when to escalate.

**Files:**
- Modify: `skills/requesting-code-review/SKILL.md` (insert after the existing "Optional but valuable" list)

- [ ] **Step 1: Insert the escalation block**

Open `skills/requesting-code-review/SKILL.md`. Locate this exact block (currently at the end of the "When to Request Review" section):

```markdown
**Optional but valuable:**
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bug
```

Immediately after that block (before the next `## How to Request` heading), insert a blank line followed by:

```markdown
**Escalate to `requesting-deep-review` when:**
- Change is security-sensitive, touches data handling, or is hard to roll back (migrations, external APIs, schema changes)
- Cross-cutting refactor touching many modules
- Human explicitly asks for a "deep review", "thorough review", or "senior review"

Don't run both reviewers on the same diff — pick one.
```

The result of the section should be (showing the surrounding context):

```markdown
**Optional but valuable:**
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bug

**Escalate to `requesting-deep-review` when:**
- Change is security-sensitive, touches data handling, or is hard to roll back (migrations, external APIs, schema changes)
- Cross-cutting refactor touching many modules
- Human explicitly asks for a "deep review", "thorough review", or "senior review"

Don't run both reviewers on the same diff — pick one.

## How to Request
```

No other changes anywhere else in the file. Do not modify the Red Flags section, the example, or any other tuned content.

- [ ] **Step 2: Smoke-check the modification**

Run:

```bash
cd /Users/tian/Developer/playground/superpowers
F=skills/requesting-code-review/SKILL.md

# New pointer present
grep -q "Escalate to \`requesting-deep-review\` when" "$F" || echo "FAIL: missing escalation header"
grep -q "Don't run both reviewers on the same diff" "$F" || echo "FAIL: missing 'pick one' line"

# Pointer is between "After fixing complex bug" and "## How to Request" (correct position)
awk '/After fixing complex bug/{seen=1} seen && /Escalate to/{found=1; exit} seen && /^## How to Request/{exit} END{exit !found}' "$F" || echo "FAIL: pointer not in expected position"

# Tuned content untouched: Red Flags section still present and unchanged in count
grep -c "^## Red Flags$" "$F" | grep -q "^1$" || echo "FAIL: Red Flags section missing or duplicated"

# File still parses as having a single frontmatter block
head -1 "$F" | grep -q "^---$" || echo "FAIL: frontmatter opener missing"

echo "Smoke check complete (no FAIL lines = pass)"
```

Expected: only the line `Smoke check complete (no FAIL lines = pass)` printed; no FAIL lines.

- [ ] **Step 3: Verify the diff is small and surgical**

Run:

```bash
cd /Users/tian/Developer/playground/superpowers
git diff --stat skills/requesting-code-review/SKILL.md
git diff skills/requesting-code-review/SKILL.md
```

Expected: `+6` to `+8` lines added, `0` lines removed (a pure addition). If any lines are removed, the edit went wrong — restore the file with `git checkout skills/requesting-code-review/SKILL.md` and redo Step 1.

- [ ] **Step 4: Commit**

```bash
cd /Users/tian/Developer/playground/superpowers
git add skills/requesting-code-review/SKILL.md
git commit -m "Point requesting-code-review at requesting-deep-review for high-stakes changes"
```

---

### Task 4: Manual triggering verification

The frontmatter `description` is what the harness uses to decide when to load the skill. Confirm the trigger string actually fires for the right prompts and stays out of the way for the wrong ones. This is a manual test in a fresh Claude Code session — there is no automated harness for skill-triggering on this fork.

**Files:** none (verification only)

- [ ] **Step 1: Reload the plugin so the new skill is registered**

In your Claude Code instance, run `/plugin` and ensure the Superpowers plugin reloads (or restart the session). Confirm `superpowers:requesting-deep-review` appears in the available skills list at session start.

If it does not appear, check that the file path is exactly `skills/requesting-deep-review/SKILL.md` (no typo) and that the frontmatter `name: requesting-deep-review` matches the directory name.

- [ ] **Step 2: Positive triggering test**

Open a fresh session and send exactly:

> please do a deep review of HEAD~1..HEAD

Expected:
- The model invokes `superpowers:requesting-deep-review` (visible via the `Skill` tool call).
- The model does NOT invoke `superpowers:requesting-code-review` for this prompt.

If `requesting-code-review` is invoked instead, the trigger string is too weak. Strengthen the description (add more variants of "deep" / "thorough" / "senior") and re-test.

- [ ] **Step 3: Negative triggering test**

Open a fresh session and send exactly:

> review the recent changes

Expected:
- The model invokes `superpowers:requesting-code-review` (the fast path).
- The model does NOT invoke `superpowers:requesting-deep-review`.

If `requesting-deep-review` fires for this prompt, the description is too aggressive. Tighten it (the existing "Use ONLY when the human explicitly requests…" phrasing should prevent this; investigate if it doesn't).

- [ ] **Step 4: Capture transcripts**

Save both transcripts (positive + negative) for the verification record. No commit yet — these are session artifacts, not files in the repo.

---

### Task 5: Manual dispatch verification

Confirm the dispatched subagent actually produces the expected six-lens output structure with severity prefixes, change-sizing finding, and a verdict.

**Files:** none (verification only)

- [ ] **Step 1: Pick a real recent commit to review**

Pick any commit from the last week with a non-trivial diff. Get the SHAs:

```bash
cd /Users/tian/Developer/playground/superpowers
HEAD_SHA=$(git rev-parse HEAD)
BASE_SHA=$(git rev-parse HEAD~1)
echo "Base: $BASE_SHA"
echo "Head: $HEAD_SHA"
```

- [ ] **Step 2: Dispatch the deep review**

In a fresh session, ask:

> please do a deep review of $BASE_SHA..$HEAD_SHA

(Substitute the actual SHAs from Step 1.)

The model should invoke `requesting-deep-review`, fill the `senior-reviewer.md` template with the SHAs, and dispatch a `general-purpose` subagent.

- [ ] **Step 3: Inspect the subagent's output**

Confirm the returned report contains:

- **Verdict** (APPROVE or REQUEST CHANGES) — required.
- **Findings under each of the six lenses** — Correctness, Readability & Simplicity, Architecture, Security, Performance, Production Readiness. Empty lenses should still be listed (e.g., "no issues" or "n/a") — they should not be silently omitted.
- **At least one severity prefix** appearing somewhere in the findings (`Critical:` / *(no prefix)* / `Nit:` / `Optional:` / `FYI:`).
- **Change Sizing** section present with a line-count verdict.
- **Change Description Quality** section present with a commit-message verdict.
- **What's Done Well** with at least one specific positive observation.
- **Verification Story** (tests / build / manual).

If any required structural element is missing, the dispatch template lost something during fill-in. Re-read `senior-reviewer.md` and confirm all sections survived.

- [ ] **Step 4: Capture the transcript**

Save the transcript for the verification record. No commit needed.

---

## Verification

The plan is complete when:

- [ ] `skills/requesting-deep-review/senior-reviewer.md` exists and passes its smoke check (Task 1, Step 3).
- [ ] `skills/requesting-deep-review/SKILL.md` exists and passes its smoke check (Task 2, Step 2).
- [ ] `skills/requesting-code-review/SKILL.md` has the escalation pointer and passes its smoke check (Task 3, Step 2).
- [ ] All three changes are committed (one commit per task).
- [ ] Positive trigger test passes (Task 4, Step 2).
- [ ] Negative trigger test passes (Task 4, Step 3).
- [ ] Dispatch produces the expected six-lens output structure (Task 5, Step 3).

If any verification fails, fix in place; do not declare the work complete with broken behavior.
