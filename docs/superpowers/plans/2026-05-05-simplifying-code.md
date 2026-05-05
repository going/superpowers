# `simplifying-code` Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a single-file `simplifying-code` skill to this fork by porting `agent-skills/code-simplification`'s body content under upstream's frontmatter `name`/`description`.

**Architecture:** One new directory (`skills/simplifying-code/`) containing one new file (`SKILL.md`). No `references/` subdirectory — language examples are inlined per the spec's `B` decision. No modifications to existing files. No code, no tests in the traditional sense — verification is grep-based content checks plus manual triggering tests in a fresh Claude session.

**Tech Stack:** Markdown (skill file); bash (`grep` smoke checks); Claude Code CLI (manual verification only).

**Spec:** `docs/superpowers/specs/2026-05-05-simplifying-code-design.md`

---

### Task 1: Create the skill directory and write SKILL.md

**Files:**
- Create: `skills/simplifying-code/SKILL.md`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p /Users/tian/Developer/playground/superpowers/skills/simplifying-code
```

Expected: directory created, no output.

- [ ] **Step 2: Write SKILL.md with the full content**

Create `skills/simplifying-code/SKILL.md` with EXACTLY this content (a verbatim port of `agent-skills/code-simplification/SKILL.md` with the `name` and `description` swapped to upstream's values):

````markdown
---
name: simplifying-code
description: Simplify code for clarity while preserving exact behavior — refactor without changing what it does. Trigger phrases include "simplify this code", "refactor for clarity", "reduce complexity", "clean up this function". For code review or issue-finding (not behavior-preserving refactor), use the built-in `simplify` skill (review changed code for quality, then fix issues) instead.
---

# Simplifying Code

> Inspired by the [Claude Code Simplifier plugin](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/code-simplifier/agents/code-simplifier.md). Adapted here as a model-agnostic, process-driven skill for any AI coding agent.

## Overview

Simplify code by reducing complexity while preserving exact behavior. The goal is not fewer lines — it's code that is easier to read, understand, modify, and debug. Every simplification must pass a simple test: "Would a new team member understand this faster than the original?"

## When to Use

- After a feature is working and tests pass, but the implementation feels heavier than it needs to be
- During code review when readability or complexity issues are flagged
- When you encounter deeply nested logic, long functions, or unclear names
- When refactoring code written under time pressure
- When consolidating related logic scattered across files
- After merging changes that introduced duplication or inconsistency

**When NOT to use:**

- Code is already clean and readable — don't simplify for the sake of it
- You don't understand what the code does yet — comprehend before you simplify
- The code is performance-critical and the "simpler" version would be measurably slower
- You're about to rewrite the module entirely — simplifying throwaway code wastes effort

## The Five Principles

### 1. Preserve Behavior Exactly

Don't change what the code does — only how it expresses it. All inputs, outputs, side effects, error behavior, and edge cases must remain identical. If you're not sure a simplification preserves behavior, don't make it.

```
ASK BEFORE EVERY CHANGE:
→ Does this produce the same output for every input?
→ Does this maintain the same error behavior?
→ Does this preserve the same side effects and ordering?
→ Do all existing tests still pass without modification?
```

### 2. Follow Project Conventions

Simplification means making code more consistent with the codebase, not imposing external preferences. Before simplifying:

```
1. Read CLAUDE.md / project conventions
2. Study how neighboring code handles similar patterns
3. Match the project's style for:
   - Import ordering and module system
   - Function declaration style
   - Naming conventions
   - Error handling patterns
   - Type annotation depth
```

Simplification that breaks project consistency is not simplification — it's churn.

### 3. Prefer Clarity Over Cleverness

Explicit code is better than compact code when the compact version requires a mental pause to parse.

```typescript
// UNCLEAR: Dense ternary chain
const label = isNew ? 'New' : isUpdated ? 'Updated' : isArchived ? 'Archived' : 'Active';

// CLEAR: Readable mapping
function getStatusLabel(item: Item): string {
  if (item.isNew) return 'New';
  if (item.isUpdated) return 'Updated';
  if (item.isArchived) return 'Archived';
  return 'Active';
}
```

```typescript
// UNCLEAR: Chained reduces with inline logic
const result = items.reduce((acc, item) => ({
  ...acc,
  [item.id]: { ...acc[item.id], count: (acc[item.id]?.count ?? 0) + 1 }
}), {});

// CLEAR: Named intermediate step
const countById = new Map<string, number>();
for (const item of items) {
  countById.set(item.id, (countById.get(item.id) ?? 0) + 1);
}
```

### 4. Maintain Balance

Simplification has a failure mode: over-simplification. Watch for these traps:

- **Inlining too aggressively** — removing a helper that gave a concept a name makes the call site harder to read
- **Combining unrelated logic** — two simple functions merged into one complex function is not simpler
- **Removing "unnecessary" abstraction** — some abstractions exist for extensibility or testability, not complexity
- **Optimizing for line count** — fewer lines is not the goal; easier comprehension is

### 5. Scope to What Changed

Default to simplifying recently modified code. Avoid drive-by refactors of unrelated code unless explicitly asked to broaden scope. Unscoped simplification creates noise in diffs and risks unintended regressions.

## The Simplification Process

### Step 1: Understand Before Touching (Chesterton's Fence)

Before changing or removing anything, understand why it exists. This is Chesterton's Fence: if you see a fence across a road and don't understand why it's there, don't tear it down. First understand the reason, then decide if the reason still applies.

```
BEFORE SIMPLIFYING, ANSWER:
- What is this code's responsibility?
- What calls it? What does it call?
- What are the edge cases and error paths?
- Are there tests that define the expected behavior?
- Why might it have been written this way? (Performance? Platform constraint? Historical reason?)
- Check git blame: what was the original context for this code?
```

If you can't answer these, you're not ready to simplify. Read more context first.

### Step 2: Identify Simplification Opportunities

Scan for these patterns — each one is a concrete signal, not a vague smell:

**Structural complexity:**

| Pattern | Signal | Simplification |
|---------|--------|----------------|
| Deep nesting (3+ levels) | Hard to follow control flow | Extract conditions into guard clauses or helper functions |
| Long functions (50+ lines) | Multiple responsibilities | Split into focused functions with descriptive names |
| Nested ternaries | Requires mental stack to parse | Replace with if/else chains, switch, or lookup objects |
| Boolean parameter flags | `doThing(true, false, true)` | Replace with options objects or separate functions |
| Repeated conditionals | Same `if` check in multiple places | Extract to a well-named predicate function |

**Naming and readability:**

| Pattern | Signal | Simplification |
|---------|--------|----------------|
| Generic names | `data`, `result`, `temp`, `val`, `item` | Rename to describe the content: `userProfile`, `validationErrors` |
| Abbreviated names | `usr`, `cfg`, `btn`, `evt` | Use full words unless the abbreviation is universal (`id`, `url`, `api`) |
| Misleading names | Function named `get` that also mutates state | Rename to reflect actual behavior |
| Comments explaining "what" | `// increment counter` above `count++` | Delete the comment — the code is clear enough |
| Comments explaining "why" | `// Retry because the API is flaky under load` | Keep these — they carry intent the code can't express |

**Redundancy:**

| Pattern | Signal | Simplification |
|---------|--------|----------------|
| Duplicated logic | Same 5+ lines in multiple places | Extract to a shared function |
| Dead code | Unreachable branches, unused variables, commented-out blocks | Remove (after confirming it's truly dead) |
| Unnecessary abstractions | Wrapper that adds no value | Inline the wrapper, call the underlying function directly |
| Over-engineered patterns | Factory-for-a-factory, strategy-with-one-strategy | Replace with the simple direct approach |
| Redundant type assertions | Casting to a type that's already inferred | Remove the assertion |

### Step 3: Apply Changes Incrementally

Make one simplification at a time. Run tests after each change. **Submit refactoring changes separately from feature or bug fix changes.** A PR that refactors and adds a feature is two PRs — split them.

```
FOR EACH SIMPLIFICATION:
1. Make the change
2. Run the test suite
3. If tests pass → commit (or continue to next simplification)
4. If tests fail → revert and reconsider
```

Avoid batching multiple simplifications into a single untested change. If something breaks, you need to know which simplification caused it.

**The Rule of 500:** If a refactoring would touch more than 500 lines, invest in automation (codemods, sed scripts, AST transforms) rather than making the changes by hand. Manual edits at that scale are error-prone and exhausting to review.

### Step 4: Verify the Result

After all simplifications, step back and evaluate the whole:

```
COMPARE BEFORE AND AFTER:
- Is the simplified version genuinely easier to understand?
- Did you introduce any new patterns inconsistent with the codebase?
- Is the diff clean and reviewable?
- Would a teammate approve this change?
```

If the "simplified" version is harder to understand or review, revert. Not every simplification attempt succeeds.

## Language-Specific Guidance

### TypeScript / JavaScript

```typescript
// SIMPLIFY: Unnecessary async wrapper
// Before
async function getUser(id: string): Promise<User> {
  return await userService.findById(id);
}
// After
function getUser(id: string): Promise<User> {
  return userService.findById(id);
}

// SIMPLIFY: Verbose conditional assignment
// Before
let displayName: string;
if (user.nickname) {
  displayName = user.nickname;
} else {
  displayName = user.fullName;
}
// After
const displayName = user.nickname || user.fullName;

// SIMPLIFY: Manual array building
// Before
const activeUsers: User[] = [];
for (const user of users) {
  if (user.isActive) {
    activeUsers.push(user);
  }
}
// After
const activeUsers = users.filter((user) => user.isActive);

// SIMPLIFY: Redundant boolean return
// Before
function isValid(input: string): boolean {
  if (input.length > 0 && input.length < 100) {
    return true;
  }
  return false;
}
// After
function isValid(input: string): boolean {
  return input.length > 0 && input.length < 100;
}
```

### Python

```python
# SIMPLIFY: Verbose dictionary building
# Before
result = {}
for item in items:
    result[item.id] = item.name
# After
result = {item.id: item.name for item in items}

# SIMPLIFY: Nested conditionals with early return
# Before
def process(data):
    if data is not None:
        if data.is_valid():
            if data.has_permission():
                return do_work(data)
            else:
                raise PermissionError("No permission")
        else:
            raise ValueError("Invalid data")
    else:
        raise TypeError("Data is None")
# After
def process(data):
    if data is None:
        raise TypeError("Data is None")
    if not data.is_valid():
        raise ValueError("Invalid data")
    if not data.has_permission():
        raise PermissionError("No permission")
    return do_work(data)
```

### React / JSX

```tsx
// SIMPLIFY: Verbose conditional rendering
// Before
function UserBadge({ user }: Props) {
  if (user.isAdmin) {
    return <Badge variant="admin">Admin</Badge>;
  } else {
    return <Badge variant="default">User</Badge>;
  }
}
// After
function UserBadge({ user }: Props) {
  const variant = user.isAdmin ? 'admin' : 'default';
  const label = user.isAdmin ? 'Admin' : 'User';
  return <Badge variant={variant}>{label}</Badge>;
}

// SIMPLIFY: Prop drilling through intermediate components
// Before — consider whether context or composition solves this better.
// This is a judgment call — flag it, don't auto-refactor.
```

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "It's working, no need to touch it" | Working code that's hard to read will be hard to fix when it breaks. Simplifying now saves time on every future change. |
| "Fewer lines is always simpler" | A 1-line nested ternary is not simpler than a 5-line if/else. Simplicity is about comprehension speed, not line count. |
| "I'll just quickly simplify this unrelated code too" | Unscoped simplification creates noisy diffs and risks regressions in code you didn't intend to change. Stay focused. |
| "The types make it self-documenting" | Types document structure, not intent. A well-named function explains *why* better than a type signature explains *what*. |
| "This abstraction might be useful later" | Don't preserve speculative abstractions. If it's not used now, it's complexity without value. Remove it and re-add when needed. |
| "The original author must have had a reason" | Maybe. Check git blame — apply Chesterton's Fence. But accumulated complexity often has no reason; it's just the residue of iteration under pressure. |
| "I'll refactor while adding this feature" | Separate refactoring from feature work. Mixed changes are harder to review, revert, and understand in history. |

## Red Flags

- Simplification that requires modifying tests to pass (you likely changed behavior)
- "Simplified" code that is longer and harder to follow than the original
- Renaming things to match your preferences rather than project conventions
- Removing error handling because "it makes the code cleaner"
- Simplifying code you don't fully understand
- Batching many simplifications into one large, hard-to-review commit
- Refactoring code outside the scope of the current task without being asked

## Verification

After completing a simplification pass:

- [ ] All existing tests pass without modification
- [ ] Build succeeds with no new warnings
- [ ] Linter/formatter passes (no style regressions)
- [ ] Each simplification is a reviewable, incremental change
- [ ] The diff is clean — no unrelated changes mixed in
- [ ] Simplified code follows project conventions (checked against CLAUDE.md or equivalent)
- [ ] No error handling was removed or weakened
- [ ] No dead code was left behind (unused imports, unreachable branches)
- [ ] A teammate or review agent would approve the change as a net improvement
````

- [ ] **Step 3: Smoke-check the SKILL.md content**

Run:

```bash
cd /Users/tian/Developer/playground/superpowers
F=skills/simplifying-code/SKILL.md

echo "=== Frontmatter ==="
head -5 "$F" | grep -q "^name: simplifying-code$" && echo "  name OK" || echo "  FAIL: name"
head -5 "$F" | grep -q "^description: Simplify code for clarity" && echo "  description starts correctly" || echo "  FAIL: description start"

echo "=== Trigger phrases in description ==="
for phrase in '"simplify this code"' '"refactor for clarity"' '"reduce complexity"' '"clean up this function"'; do
  head -5 "$F" | grep -q "$phrase" && echo "  $phrase: OK" || echo "  FAIL: $phrase"
done

echo "=== Disambiguation with built-in simplify ==="
head -5 "$F" | grep -q 'built-in `simplify`' && echo "  built-in simplify pointer: OK" || echo "  FAIL: built-in simplify pointer"

echo "=== Required sections ==="
for section in "Overview" "When to Use" "The Five Principles" "The Simplification Process" "Language-Specific Guidance" "Common Rationalizations" "Red Flags" "Verification"; do
  grep -q "^## $section" "$F" && echo "  $section: OK" || echo "  FAIL: $section"
done

echo "=== Five Principles by name ==="
for p in "Preserve Behavior Exactly" "Follow Project Conventions" "Prefer Clarity Over Cleverness" "Maintain Balance" "Scope to What Changed"; do
  grep -q "$p" "$F" && echo "  $p: OK" || echo "  FAIL: $p"
done

echo "=== Four-step process ==="
for s in "Step 1: Understand Before Touching" "Step 2: Identify Simplification Opportunities" "Step 3: Apply Changes Incrementally" "Step 4: Verify the Result"; do
  grep -q "$s" "$F" && echo "  $s: OK" || echo "  FAIL: $s"
done

echo "=== Languages covered ==="
for lang in "TypeScript / JavaScript" "Python" "React / JSX"; do
  grep -q "### $lang" "$F" && echo "  $lang: OK" || echo "  FAIL: $lang"
done

echo "=== Attribution line ==="
grep -q "Inspired by the \[Claude Code Simplifier plugin\]" "$F" && echo "  attribution: OK" || echo "  FAIL: attribution"

echo "Smoke check complete (no FAIL lines = pass)"
```

Expected: only the line `Smoke check complete (no FAIL lines = pass)` printed; no FAIL lines.

- [ ] **Step 4: Commit**

```bash
cd /Users/tian/Developer/playground/superpowers
git add skills/simplifying-code/SKILL.md
git commit -m "Add simplifying-code skill"
```

---

### Task 2: Manual triggering verification

The frontmatter `description` is the trigger string the harness uses to decide when to load the skill. Confirm it fires for the right prompts and stays disambiguated from the built-in `simplify`. This is a manual test in a fresh Claude Code session — there is no automated harness for skill-triggering on this fork.

**Files:** none (verification only)

- [ ] **Step 1: Reload the plugin so the new skill is registered**

In your Claude Code instance, run `/plugin` and ensure the Superpowers plugin reloads (or restart the session). Confirm `superpowers:simplifying-code` appears in the available skills list at session start.

If it does not appear, check that the file path is exactly `skills/simplifying-code/SKILL.md` (no typo) and that the frontmatter `name: simplifying-code` matches the directory name.

- [ ] **Step 2: Positive trigger test (primary phrase)**

Open a fresh session and send a message containing a verbose snippet to refactor, using the primary trigger phrase. Example:

> simplify this code:
> ```ts
> let displayName: string;
> if (user.nickname) {
>   displayName = user.nickname;
> } else {
>   displayName = user.fullName;
> }
> ```

Expected:
- The model invokes `superpowers:simplifying-code` (visible via the `Skill` tool call).
- The model does NOT invoke the built-in `simplify` skill.

- [ ] **Step 3: Positive trigger test (alternative phrases)**

Open three more fresh sessions and try each of the upstream's other trigger phrases on a similar verbose snippet:

1. `refactor this for clarity: ...`
2. `reduce the complexity of this function: ...`
3. `clean up this function: ...`

Expected: each one invokes `superpowers:simplifying-code`.

If any phrase does NOT trigger, that's a description-tuning problem — strengthen by adding the variant explicitly to the trigger-phrases list in the description.

- [ ] **Step 4: Disambiguation test (built-in `simplify`)**

Open a fresh session and send:

> review the changed code for quality issues and fix what you find

Expected:
- The model invokes the built-in `simplify` skill (which is described in the harness as: "Review changed code for reuse, quality, and efficiency, then fix any issues found").
- The model does NOT invoke `superpowers:simplifying-code` (which is for behavior-preserving refactor, not issue-finding review).

If `simplifying-code` fires for this prompt, the disambiguation language is too weak. The current "For code review or issue-finding (not behavior-preserving refactor), use the built-in `simplify` skill instead" should prevent this; investigate if it doesn't.

- [ ] **Step 5: Capture transcripts**

Save all four transcripts (primary, three alternative phrases, disambiguation) for the verification record. No commit needed — these are session artifacts.

---

## Verification

The plan is complete when:

- [ ] `skills/simplifying-code/SKILL.md` exists and passes its smoke check (Task 1, Step 3).
- [ ] The skill is committed (Task 1, Step 4).
- [ ] Positive trigger test passes for primary phrase (Task 2, Step 2).
- [ ] Positive trigger test passes for at least 2 of 3 alternative phrases (Task 2, Step 3).
- [ ] Disambiguation test passes — built-in `simplify` fires for issue-finding review (Task 2, Step 4).

If any verification fails, fix in place; do not declare the work complete with broken behavior.
