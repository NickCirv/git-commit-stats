# git-commit-stats — command reference

[Overview](../README.md) · [Research record](RESEARCH.md)

Describes revision `19ecbe9bcd85378d89655df39544d8d52bfb5602`. Commands are source-inspected; no execution results are asserted.

## Workflow

Reads non-merge commits and numstat data, then reports frequency, hour/day distribution, authors, hot files, message patterns and lines changed. Heatmap is a separate output mode.

Requires Git and a local repository with the relevant history. Commands are source-inspected, not executed in this review.

```bash
node index.js --since "3 months ago" --format json
```

## Commands and controls

| Control | Behavior in the inspected implementation |
| --- | --- |
| `--since DATE` | Limit the commit range |
| `--author TEXT` | Filter recorded author identity |
| `--format json` | Emit calculated statistics |
| `--format heatmap` | Render a contribution heatmap |
| `--top N` | Limit contributor/file lists |

## Interpretation and side effects

Counts depend on available history, date filters and author identity. Merge exclusion and rebases change the totals. These measures describe recorded commits rather than total work or individual performance.

## Implementation reference

- [package.json](https://github.com/NickCirv/git-commit-stats/blob/19ecbe9bcd85378d89655df39544d8d52bfb5602/package.json)
- [index.js](https://github.com/NickCirv/git-commit-stats/blob/19ecbe9bcd85378d89655df39544d8d52bfb5602/index.js)
- [test/smoke.test.js](https://github.com/NickCirv/git-commit-stats/blob/19ecbe9bcd85378d89655df39544d8d52bfb5602/test/smoke.test.js)
