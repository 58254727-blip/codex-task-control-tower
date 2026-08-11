# Compatibility and Installation Matrix

Last updated: 2026-08-11

This record separates package/runtime proof from Codex plugin structure proof.
Passing one layer does not imply that another layer was tested.

## Packaged Consumer Matrix

Every CI job packs the current repository, installs that tarball into a clean
temporary npm project with the network disabled, checks the installed manifest
and executable link, then invokes `codex-control-tower init` and `status`.

| Platform | Shell used by maintainers | Node.js | Automated path | Expected result |
| --- | --- | ---: | --- | --- |
| Ubuntu latest | Bash | 18 | CI `verify:consumer` | Packed CLI initializes state and reports the synthetic task as `ready` |
| Ubuntu latest | Bash | 22 | CI `verify:consumer` | Packed CLI initializes state and reports the synthetic task as `ready` |
| Windows latest | PowerShell | 20 | CI `verify:consumer` | Packed CLI initializes state and reports the synthetic task as `ready` |
| macOS latest | zsh or Bash | 20 | CI `verify:consumer` | Packed CLI initializes state and reports the synthetic task as `ready` |

The current workflow is [`.github/workflows/ci.yml`](../.github/workflows/ci.yml),
and public runs are visible in [GitHub Actions](https://github.com/58254727-blip/codex-task-control-tower/actions/workflows/ci.yml).

To reproduce the packaged consumer check on any supported platform:

```bash
git clone https://github.com/58254727-blip/codex-task-control-tower.git
cd codex-task-control-tower
npm ci
npm run verify:consumer
```

The checkout may live in any user-writable directory. The scripts do not rely
on a machine-specific installation path.

## Codex Plugin Installation Check

1. Clone or download the repository.
2. In the Codex plugin interface, select the repository root containing
   `.codex-plugin/plugin.json`.
3. Confirm the display name is `Codex Task Control Tower`.
4. Confirm these six Skills are discoverable:
   `execution-controller`, `development-planner`, `skill-router`,
   `verification-gate`, `task-control-tower`, and `task-handoff`.
5. Ask Codex to use `execution-controller` on a synthetic bounded objective.

The official structure validators prove the manifest and Skill folders are
well-formed. Actual plugin discovery in the Codex UI remains a manual check and
must not be inferred from the npm consumer test.

## Validator Compatibility Record

| Release | Runtime date | Plugin manifest | `execution-controller` | `development-planner` | `skill-router` | `verification-gate` | `task-control-tower` | `task-handoff` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0.3.2 | 2026-08-11 | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| 0.3.1 | 2026-08-11 | Pass | Pass | Pass | Pass | Pass | Pass | Pass |

Validator used: the official Codex `validate_plugin.py` and
`quick_validate.py` scripts bundled with the local Codex runtime. A release is
not published if any cell fails.

### Warnings

- Validator warnings: none.
- Git line-ending notices are not validator warnings and do not affect the
  packaged LF-normalized source content.

## Release Maintenance

For each release, maintainers must:

1. run `npm run release:check`;
2. run the official plugin validator once;
3. run the official Skill validator for all six Skill directories;
4. update the row above and list warnings separately;
5. confirm the public CI matrix is green before creating the release.
