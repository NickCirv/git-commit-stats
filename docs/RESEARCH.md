# git-commit-stats — research record

## Revision and scope

- Repository: [NickCirv/git-commit-stats](https://github.com/NickCirv/git-commit-stats)
- Commit: `19ecbe9bcd85378d89655df39544d8d52bfb5602`
- Tree: `a6d5419d43d9f4c16bc35d98ecd8f621758564e6`
- Captured: 6 of 6 eligible text files (all eligible text files).
- Recursive tree truncated: `False`.
- Runtime verification: **unverified**; no repository code, installation or test command was executed.

The captured file inventory is broader than the semantic review. Authoring inspected package metadata, entrypoint/argument handling and implementation paths relevant to the claims below, plus test declarations. This is documentation research, not a line-by-line security audit. Generated/binary artifacts, lockfiles and file types outside the acquisition filter were not inspected.

## Claim and evidence

| Claim | Pinned evidence | Status |
| --- | --- | --- |
| Runtime requirement and executable mapping | [package.json](https://github.com/NickCirv/git-commit-stats/blob/19ecbe9bcd85378d89655df39544d8d52bfb5602/package.json) | verified in manifest; installation unverified |
| Explore Git commit frequency, change volume and contributor patterns. | [implementation](https://github.com/NickCirv/git-commit-stats/blob/19ecbe9bcd85378d89655df39544d8d52bfb5602/index.js) | partially verified by static implementation review |
| Operational limits and side effects | [implementation](https://github.com/NickCirv/git-commit-stats/blob/19ecbe9bcd85378d89655df39544d8d52bfb5602/index.js) and source map in [reference](REFERENCE.md) | partially verified; runtime unverified |
| Test command definition | [package.json](https://github.com/NickCirv/git-commit-stats/blob/19ecbe9bcd85378d89655df39544d8d52bfb5602/package.json) | verified as a declaration only |

## Findings carried into the rewrite

Counts depend on available history, date filters and author identity. Merge exclusion and rebases change the totals. These measures describe recorded commits rather than total work or individual performance.

No runtime checks were executed for this documentation review. The committed smoke test checks entrypoint JavaScript syntax; it does not exercise the command behavior.

## Documentation inventory and disposition

| Existing document | Disposition |
| --- | --- |
| [README.md](https://github.com/NickCirv/git-commit-stats/blob/19ecbe9bcd85378d89655df39544d8d52bfb5602/README.md) | Rewritten overview; historical copy remains at this pinned URL. |

New supporting documents: `docs/REFERENCE.md` and `docs/RESEARCH.md`. No original source or protected legal/security file was changed.

## Protected-file evidence

- `LICENSE` SHA-256 `68729cab364d82364078b08d8580ccfa51dc69c81a7d64e8d8d47a1da6c9349d`.

## Remaining verification

Clean installation, useful-command execution, malformed input, side-effect boundaries, platform compatibility and end-to-end tests remain unverified. Package-registry availability and live API destinations were not checked. No performance, customer-adoption, compliance or production-readiness claim is made.

## Captured evidence index

- [LICENSE](https://github.com/NickCirv/git-commit-stats/blob/19ecbe9bcd85378d89655df39544d8d52bfb5602/LICENSE) · blob `05b804beeec7d1a6c933d087387ba4adf6463d93`.
- [README.md](https://github.com/NickCirv/git-commit-stats/blob/19ecbe9bcd85378d89655df39544d8d52bfb5602/README.md) · blob `4a6ef30bf590c7f702e472faeffae729545a1eb3`.
- [package.json](https://github.com/NickCirv/git-commit-stats/blob/19ecbe9bcd85378d89655df39544d8d52bfb5602/package.json) · blob `05cc858bf3a54f089426e636e0e07e3ceb729552`.
- [.github/workflows/ci.yml](https://github.com/NickCirv/git-commit-stats/blob/19ecbe9bcd85378d89655df39544d8d52bfb5602/.github/workflows/ci.yml) · blob `44515034a394670de44454a7a1bd2c7ef0c9836e`.
- [index.js](https://github.com/NickCirv/git-commit-stats/blob/19ecbe9bcd85378d89655df39544d8d52bfb5602/index.js) · blob `a025ea0bb47e265aac3590de574b41eb24d76ea0`.
- [test/smoke.test.js](https://github.com/NickCirv/git-commit-stats/blob/19ecbe9bcd85378d89655df39544d8d52bfb5602/test/smoke.test.js) · blob `ebbccaaf2583b4850575f835313e4b0afd21bff7`.

## Tree files outside the captured text set

These paths were mapped but their contents were not acquired in this research pass:

- `banner.svg`
