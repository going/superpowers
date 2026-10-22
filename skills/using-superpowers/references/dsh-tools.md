# DeepSeek Harness (dsh) Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On DeepSeek Harness these resolve to the tools below. The Superpowers plugin appends this mapping to the `using-superpowers` bootstrap, so it is current in every top-level session.

## Tools

| Action skills request | DeepSeek Harness tool |
|---|---|
| Read a file | `read` |
| Create or overwrite a file | `write` |
| Edit a file (targeted replacement) | `edit` |
| Delete, move, or copy a file | `bash` (`rm`, `mv`, `cp`) |
| Run a shell command | `bash` (Windows sessions use the PowerShell tool) |
| Start a long-running command | `bash` with `run_in_background: true`, then `job_output`, `job_kill`, `job_list` |
| Search file contents | `grep` |
| Find files by name | `glob` |
| Fetch a URL | `web_fetch` |
| Search the web | `web_search` |
| Dispatch a subagent | `subagent` (isolated spawn) or `subagent_fork` (inherits this conversation) |
| Continue or observe a subagent | `send_message`, `wait_agent`, `list_agents`, `interrupt_agent` |
| Task tracking ("create a todo", "mark complete") | `todo_write` |
| Invoke a skill | `skill` |
| Ask the human partner a question | `ask_user_question` |
| Present a deliverable file | `present` |
| Change or read the working directory | `working_directory` |

Treat older `TodoWrite` references as the task-tracking action above; `todo_write` is that action here.

## Invoking a skill

DeepSeek Harness has a native `skill` tool and lists every available skill with its description in the session catalog. Invoke a Superpowers skill by its exact name:

```text
skill("brainstorming")
skill("test-driven-development")
```

The `using-superpowers` skill is already loaded as part of this bootstrap; do not load it again. If a skill is not in the catalog, the plugin did not register (check the Plugins page for a Superpowers bundle error) — do not fall back to reading `SKILL.md` from disk on this harness.

Skill names here are plain kebab-case with **no `superpowers:` prefix**. Where skill text illustrates a call as `superpowers:brainstorming`, the real call is `skill("brainstorming")`; the prefixed name is rejected as invalid.

## Subagent dispatch

`subagent` starts a background child session that returns a child id immediately; the parent receives a completion notice and can follow up with `send_message`. `subagent_fork` seeds the child with this conversation's history and is the choice for review or continuation work that needs the same context. Prefer `subagent_fork` for review tasks and `subagent` for independent investigations.

When the session also exposes the Agent Teams tools (`spawn_teammate`, `send_message`, `wait_agent`, `team_task_create`, `team_task_update`, ...), use them for durable multi-agent work and the shared task board. Otherwise stay with `subagent`/`subagent_fork`; never invent a `Task` tool call.

## Task tracking

Use `todo_write` for the checklist several skills ask you to create ("create a todo per item"). Steps stay `in_progress` only while actively worked and are marked `completed` as soon as they are done.

## Deliverables

When a skill produces a file the human partner should open, finish with `present` for the 1–2 most important files rather than only naming paths.

## Workspace instructions

`AGENTS.md` (and `CLAUDE.md`) files are loaded automatically by the harness as workspace guidance. User instructions take precedence over skills, which take precedence over default behavior.
