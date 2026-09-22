![git-commit-stats — Nicholas Ashkar repository collection](assets/nicholas-ashkar/banner.png)

# git-commit-stats

Explore Git commit frequency, change volume and contributor patterns.


<a id="usage"></a>

## What it does

Reads non-merge commits and numstat data, then reports frequency, hour/day distribution, authors, hot files, message patterns and lines changed. Heatmap is a separate output mode. See the pinned [implementation](https://github.com/NickCirv/git-commit-stats/blob/19ecbe9bcd85378d89655df39544d8d52bfb5602/index.js).


<a id="install"></a>

## Quickstart

Node requirement from the inspected manifest: **`>=20`**. Requires Git and a local repository with the relevant history. Commands are source-inspected, not executed in this review.

The following example is **source-inspected, not executed**. It uses a pinned checkout; npm package publication is not assumed. Replace project paths or provide the stated input fixtures before running it.

```bash
git clone https://github.com/NickCirv/git-commit-stats.git
cd git-commit-stats
git checkout 19ecbe9bcd85378d89655df39544d8d52bfb5602
npm install --ignore-scripts
node index.js --since "3 months ago" --format json
```

Dependencies are installed with lifecycle scripts disabled in this recipe. Read the package scripts before enabling any lifecycle step required by your environment.

## Usage and reference

`git-commit-stats` | `gcs` are the executable names declared by the package. [Command reference](docs/REFERENCE.md) covers source-backed options and entry points.

| Control | Behavior in the inspected implementation |
| --- | --- |
| `--since DATE` | Limit the commit range |
| `--author TEXT` | Filter recorded author identity |
| `--format json` | Emit calculated statistics |
| `--format heatmap` | Render a contribution heatmap |
| `--top N` | Limit contributor/file lists |

## Limits and operational notes

Counts depend on available history, date filters and author identity. Merge exclusion and rebases change the totals. These measures describe recorded commits rather than total work or individual performance.

## Development

No runtime checks were executed for this documentation review. The committed smoke test checks entrypoint JavaScript syntax; it does not exercise the command behavior.

| Script | Declared command |
| --- | --- |
| `test` | `node --test` |

Work from the pinned source, keep changes focused, and reproduce the affected behavior with a small fixture before proposing a change. Existing contribution and security policies remain authoritative where present.

## Research and status

[Research record](docs/RESEARCH.md) identifies the inspected revision, source evidence, documentation disposition and verification gaps. Static inspection supports the descriptions here; runtime behavior, dependency installation and current hosted services remain unverified.

## License and author

[License](https://github.com/NickCirv/git-commit-stats/blob/19ecbe9bcd85378d89655df39544d8d52bfb5602/LICENSE)

[Nicholas Ashkar](https://nicholashkar.com) · Applied AI, systems and consulting.
