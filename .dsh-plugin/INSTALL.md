# Installing Superpowers for DeepSeek Harness

## Prerequisites

- DeepSeek Harness (`dsh`) with the Web GUI, Desktop app, or CLI.

## Installation

Superpowers is a `dsh` profile bundle. Install it with the harness's own plugin
manager — do not copy files into the profile by hand.

### Web or Desktop app

Open **Plugins** in the sidebar, choose **Add plugin** → **Install a third-party
plugin**, and enter `https://github.com/obra/superpowers` (or the absolute path
to a local checkout). Install enables the bundle by default. A Creator-mode
agent can also perform the same install with its `plugin_manager` tool and
`action: install_bundle`.

### CLI profile

```bash
dsh plugin --profile web add "superpowers@git+https://github.com/obra/superpowers.git"
```

Use the profile name you actually boot (`web`, `headless`, a custom profile). To
install from a local checkout instead:

```bash
dsh plugin --profile web add /path/to/superpowers
```

Start a new session (or restart the app when the profile does not hot-reload
configuration). Superpowers registers its skills immediately and injects the
`using-superpowers` bootstrap at the start of the next session.

## Verify

Ask the agent: `What are your superpowers?`

Then run the acceptance test in a clean session:

```text
Let's make a react todo list
```

A working install auto-triggers `brainstorming` before any code is written.

If the agent does not know it has superpowers, open **Plugins**, find the
Superpowers bundle, and read any activation error on its row before retrying.

## Uninstall

Disable or remove the bundle from the Plugins page, or with the launcher's
plugin command for the same profile. Skill files live in the installed package;
removing the bundle removes their registration.
