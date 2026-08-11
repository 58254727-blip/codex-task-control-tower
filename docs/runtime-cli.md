# Local Runtime CLI

`codex-control-tower` is an optional, zero-dependency evidence ledger for the
plugin's orchestration contracts. It persists local task state; it does not run
project commands, call models, monitor in the background, or grant permission.

## Plan format

Start from `examples/synthetic-plan.json`. A plan contains one objective,
optional boundaries, and at least one task. Every task declares:

- a stable lower-case `id`;
- an `outcome`;
- dependency task IDs;
- the intended write scope;
- success criteria and verification commands;
- a stop condition.

Unknown dependencies, duplicate IDs, self-dependencies, and cycles fail closed.

## Commands

```bash
node bin/control-tower.mjs init examples/synthetic-plan.json
node bin/control-tower.mjs status
node bin/control-tower.mjs record --task contract --type complete --evidence "Focused synthetic contract test passed"
node bin/control-tower.mjs verify
node bin/control-tower.mjs handoff --output handoff.md
```

State defaults to `.control-tower/state.json`; use `--state` to choose another
local file. `init` refuses to overwrite existing state unless `--force` is
explicit. `verify` exits with code `0` only when every task is completed with
evidence. An unfinished or blocked run exits with code `1`; invalid input exits
with code `2`.

For repeated failures, supply a stable root-cause key:

```bash
node bin/control-tower.mjs record --task implementation --type failure --failure-key parser-timeout --evidence "Synthetic parser timeout in focused test"
```

Two failures with the same key block that path. The tool refuses a third blind
attempt. After the root cause or verification path genuinely changes, record
the remediation evidence explicitly before continuing:

```bash
node bin/control-tower.mjs record --task implementation --type resume --evidence "Synthetic focused reproduction now passes"
```

`resume` is accepted only for `blocked` or `unverified` tasks. It preserves the
failure history, clears the current blocker, and returns the task to dependency
evaluation; it is not a way to erase failed attempts.

## Privacy boundary

The state file may contain local paths, commands, and raw evidence summaries;
keep it local and do not commit it. The `handoff` command removes common secret,
email, absolute-path, address, and UUID patterns before writing Markdown. The
sanitizer is defense in depth, not permission to put private material in a
public repository.
