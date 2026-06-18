<div align="center">

# git-commit-stats

**Rich git analytics in your terminal — heatmaps, streaks, author breakdown, file churn, and a GitHub-style contribution graph.**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue?labelColor=0B0A09)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?labelColor=0B0A09)](package.json)
[![Node](https://img.shields.io/badge/node-%3E%3D18-lightgrey?labelColor=0B0A09)](package.json)

</div>

## Install

```bash
# Run directly — no global install needed
npx github:NickCirv/git-commit-stats

# Or install globally
npm install -g github:NickCirv/git-commit-stats
```

## Usage

```bash
# Full report for current repo
git-commit-stats

# Filter by author and date range
git-commit-stats --since "3 months ago" --author "Alice"

# GitHub-style contribution heatmap only
git-commit-stats --format heatmap

# JSON output — pipe to jq or save to file
git-commit-stats --format json | jq '.frequency.total'
```

| Flag | Description | Default |
|------|-------------|---------|
| `--since <date>` | Filter since date (`2024-01-01` or `"3 months ago"`) | All time |
| `--author <name>` | Filter by author name or email | All authors |
| `--branch <name>` | Analyse specific branch | Current branch |
| `--format <mode>` | `default` \| `heatmap` \| `json` | `default` |
| `--top <n>` | Limit author/file lists | `10` |
| `--version`, `-v` | Print version | — |
| `--help`, `-h` | Show help | — |

## What it does

Runs `git log` against the current repo and renders a full analytics report in the terminal. Output includes commit frequency and streaks, time-of-day and day-of-week heatmaps, a GitHub-style 7×52 contribution graph, top authors with percentage share, most-churned files, commit message word analysis, a 12-month trend chart, and lines-added vs lines-deleted. Use `--format json` to pipe the full dataset into other tools. Requires Node.js ≥ 18 and git in PATH, run from inside a git repository.

---
<sub>Zero dependencies · Node ≥18 · MIT · by <a href="https://github.com/NickCirv">NickCirv</a></sub>
