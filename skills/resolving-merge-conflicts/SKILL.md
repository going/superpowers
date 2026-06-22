---
name: resolving-merge-conflicts
description: Resolve Git merge conflicts by extracting only unresolved paths, conflict hunks, and compact diffs instead of loading whole files into context. Use when a merge, rebase, cherry-pick, or stash pop stops on conflicts, when `git status` shows unmerged paths, or when files contain conflict markers.
---

# Resolving Merge Conflicts

## Overview

Resolve conflicts without opening full files unless the compact view is insufficient. Start with a summary, then inspect one conflicted file at a time.

The `extract_conflict_context.py` script is bundled with this skill, under `scripts/` relative to this skill's directory. Run it from inside the repository that has the conflicts (it locates the repo root from the current directory).

## Workflow

1. Start with a summary.

```bash
python3 scripts/extract_conflict_context.py
```

Use the summary to identify which files are unresolved, which index stages exist, and how many text hunks each file contains.

2. Drill into one file.

```bash
python3 scripts/extract_conflict_context.py --file path/to/file
```

Prefer this over reading the whole file. The script prints only nearby context, the `ours` / `base` / `theirs` sections for each hunk, and a compact unified diff between `ours` and `theirs`.

3. Resolve the file.

- **Understand each side's intent first.** Before editing a hunk, know *why* both sides changed it — read the commit messages behind the conflict (`git log --merge -p -- path/to/file`), and the linked PR or issue when the message isn't enough. You can't merge intents you don't understand.
- **Preserve both intents where possible.** A conflict usually means two real changes collided, not that one is wrong.
- **Where the two are genuinely incompatible,** pick the side matching the merge's stated goal and note the trade-off in the commit message. Don't split the difference into something neither side intended.
- **Don't invent new behaviour.** Resolve to code one side actually wrote; a conflict is not a license to rewrite.
- Take one side wholesale with `git checkout --ours -- path/to/file` or `git checkout --theirs -- path/to/file` when that side is entirely correct.
- Otherwise edit the file directly and remove the conflict markers.
- Read more of the file only if the compact output is not enough to decide the correct merge.
- **Never `--abort` just because a hunk is hard** — that throws away the whole merge/rebase. Resolve it.

4. Re-check unresolved files.

```bash
python3 scripts/extract_conflict_context.py
git diff --name-only --diff-filter=U
```

5. Validate the resolution.

- Ensure no unmerged paths remain.
- Ensure no `<<<<<<<`, `=======`, or `>>>>>>>` markers remain in the resolved files.
- Run the project's automated checks for the touched area — typically typecheck, then tests, then format — and fix anything the merge broke.
- Stage the resolved files.

6. Finish the operation.

- **Merge:** once everything is staged, `git commit` (the merge message is pre-filled).
- **Rebase:** `git rebase --continue`. Conflicts can recur on the next commit — repeat steps 1–5 for each until the rebase finishes.
- **Cherry-pick:** `git cherry-pick --continue`. **Stash pop:** once the markers are gone the changes are already in the worktree; there's nothing to continue.

## Commands

### Summary only

```bash
python3 scripts/extract_conflict_context.py
```

### Detailed view for one file

```bash
python3 scripts/extract_conflict_context.py --file path/to/file
```

### Detailed view for all conflicted files

```bash
python3 scripts/extract_conflict_context.py --all
```

### JSON output

```bash
python3 scripts/extract_conflict_context.py --file path/to/file --json
```

### Tune output size

```bash
python3 scripts/extract_conflict_context.py \
  --file path/to/file \
  --context 3 \
  --max-lines 60
```

## Notes

- Use the script before opening conflicted files directly.
- Resolve one file at a time to keep context small.
- Expect marker-based text conflicts and index-only conflicts such as add/add or modify/delete. The script summarizes both, and it falls back to index-stage previews when the worktree file has no conflict markers.
