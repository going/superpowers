# Superpowers for DeepSeek Harness

Complete guide for using Superpowers with DeepSeek Harness (`dsh`) — the
Cordis-based harness with the `dsh` CLI, Web GUI, and Desktop app.

## Installation

Superpowers installs as a `dsh` profile bundle, using the harness's own plugin
manager. Install it separately for each profile where you want it; installing
for one profile does not enable it in another.

### From the Web or Desktop app

Open **Plugins** in the sidebar, choose **Add plugin** → **Install a third-party
plugin**, and enter the repository address
`https://github.com/obra/superpowers` (or the absolute path to a local checkout).
Install enables the bundle by default. The app's Desktop profile is owned by the
Desktop shell, so the app's own Plugins page is the supported install path
there.

To install into a CLI profile, use the launcher's `dsh plugin` command with the
same profile name you boot:

```bash
# Registry-style spec from this repository
dsh plugin --profile web add "superpowers@git+https://github.com/obra/superpowers.git"

# Local checkout (for development)
dsh plugin --profile web add /path/to/superpowers
```

The install adds `superpowers` to the profile's dependencies and appends it to
`dsh.profile.bundles`; the bundle patch then inserts the `superpowers` Host row.
Later bundles and your `cordis.patch.yml` can disable that row by id.

Restart or start a new session after installing. The plugin registers its
skills immediately and injects the bootstrap at the start of the next session.

### Verify

Ask the agent:

```text
What are your superpowers?
```

A working install names the Superpowers skills and knows to check them before
acting. The acceptance test is a fresh session with:

```text
Let's make a react todo list
```

A working install auto-triggers the `brainstorming` skill **before any code is
written** and asks clarifying questions first.

## What it does

- **Skills.** Every `skills/<name>/SKILL.md` in this repository is registered
  on the harness skill registry as the `superpowers` provider. They appear in
  the session catalog with their frontmatter descriptions and load on demand
  through the native `skill` tool. Skills marked `disable-model-invocation` are
  registered for explicit user invocation only.
- **Bootstrap.** The full `using-superpowers` instruction set is injected once
  per top-level session, wrapped in `<EXTREMELY_IMPORTANT>`, together with the
  DeepSeek Harness tool mapping. The harness delivers it as required runtime
  context — a sourced user-role snapshot at the start of the first request. It
  is not repeated while the snapshot stays retained, and it is re-injected after
  compaction shadows the snapshot.
- **Subagents.** Child sessions (sessions with a durable parent) do not receive
  the controller bootstrap, so delegated work never restarts a design or
  approval cycle the parent already completed. They keep full skill access.

No per-session opt-in is required, and no files are written into your home
directory.

## Usage

### Invoking skills

Use the native `skill` tool:

```text
skill("brainstorming")
skill("test-driven-development")
```

`using-superpowers` is already loaded as part of the bootstrap; do not load it
again. `references/dsh-tools.md` in that skill maps the skills' action
vocabulary to the harness tools (`read`, `write`, `edit`, `bash`, `grep`,
`glob`, `skill`, `todo_write`, `subagent`, `subagent_fork`, and the rest).

### Personal and project skills

The harness already discovers local skills without Superpowers. Add your own
under:

- `<project>/.dsh/skills/<name>/SKILL.md` — project scope
- `<project>/.agents/skills/<name>/SKILL.md` — project scope shared with other harnesses
- `~/.dsh/skills/<name>/SKILL.md` — user scope

Local skills win over packaged Superpowers skills when names collide.

## Updating

Reinstall the bundle so the profile picks up the new git revision or checkout:

```bash
dsh plugin --profile web add "superpowers@git+https://github.com/obra/superpowers.git"
```

For a local checkout, editing a skill body takes effect on the next load (each
load re-reads `SKILL.md`). Adding, renaming, or removing a skill directory, or
changing the plugin module or bundle patch, needs the profile recomposed — with
HMR enabled that happens on the next configuration reload; otherwise restart the
app. Pin a tag or commit in the spec when you need a fixed release.

## Troubleshooting

- **The agent does not know it has superpowers.** Check **Plugins** for the
  Superpowers bundle. A failed activation is reported on the row — a missing
  `skills/` tree or tool-mapping file fails loudly by design instead of
  injecting an empty bootstrap. Reinstall the bundle and start a new session.
- **A skill is missing from the catalog.** Confirm the bundle is enabled for
  this profile and that the session is not inside a child agent (workers get
  skill access, but their catalog is scoped by the preset they run).
- **Profile refuses the bundle.** A profile can declare a DSH version
  requirement its bundles must satisfy; this package deliberately declares no
  `engines.dsh` or DSH peer dependency, so it runs on any harness version that
  accepts the manifest.

## How it works

| File | Role |
|---|---|
| `package.json` → `dsh.bundle.patch` | Declares the repository as a `dsh` profile bundle. |
| `.dsh-plugin/cordis.patch.yml` | Inserts the `superpowers` Host row into the profile. |
| `.dsh-plugin/index.js` | Cordis plugin: skill provider over `skills/`, plus the required `superpowers:bootstrap` runtime context. |
| `skills/using-superpowers/references/dsh-tools.md` | Tool mapping appended to the bootstrap. |
| `.dsh-plugin/locale/*.json`, `.dsh-plugin/icon.svg` | Plugin and bundle display metadata. |

The plugin has no runtime dependencies — it uses Node built-ins only, so the
Superpowers package stays a zero-dependency plugin.
