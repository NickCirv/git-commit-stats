#!/usr/bin/env node
import { execFileSync } from 'child_process';
import { existsSync } from 'fs';

// ─── Constants ────────────────────────────────────────────────────────────────

const VERSION = '1.0.0';

const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  cyan:    '\x1b[36m',
  green:   '\x1b[32m',
  red:     '\x1b[31m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  magenta: '\x1b[35m',
  white:   '\x1b[97m',
  gray:    '\x1b[90m',
};

const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','from','is','was','are','were','be','been','being','have','has',
  'had','do','does','did','will','would','could','should','may','might',
  'this','that','these','those','it','its','as','up','out','if','not',
  'no','so','we','i','my','our','you','your','they','their','he','his',
  'she','her','also','into','after','before','than','then','when','where',
  'which','who','what','how','all','more','some','can','just','fix','add',
  'use','via','per','vs','re','pr','wip',
]);

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── CLI Parsing ──────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    since: null,
    author: null,
    branch: null,
    format: 'default',
    top: 10,
    help: false,
    version: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--help':    case '-h': opts.help = true; break;
      case '--version': case '-v': opts.version = true; break;
      case '--since':   opts.since  = args[++i]; break;
      case '--author':  opts.author = args[++i]; break;
      case '--branch':  opts.branch = args[++i]; break;
      case '--format':  opts.format = args[++i]; break;
      case '--top':     opts.top    = parseInt(args[++i], 10) || 10; break;
    }
  }
  return opts;
}

// ─── Git Helpers ──────────────────────────────────────────────────────────────

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['pipe','pipe','pipe'] });
}

function isGitRepo() {
  try { git('rev-parse', '--git-dir'); return true; }
  catch { return false; }
}

function getCurrentBranch() {
  try { return git('rev-parse', '--abbrev-ref', 'HEAD').trim(); }
  catch { return 'HEAD'; }
}

function buildLogArgs(opts) {
  const args = ['log', '--no-merges'];
  if (opts.branch) args.push(opts.branch);
  if (opts.since)  args.push(`--since=${opts.since}`);
  if (opts.author) args.push(`--author=${opts.author}`);
  return args;
}

// ─── Data Collection ──────────────────────────────────────────────────────────

function fetchCommits(opts) {
  const logArgs = buildLogArgs(opts);
  // Use %x1f (unit separator) and %x1e (record separator) — git expands %xNN in format strings
  const SEP  = '\x1f';
  const RSEP = '\x1e';
  const fmt = `%H${SEP}%ae${SEP}%an${SEP}%at${SEP}%s${SEP}%b${RSEP}`;
  const raw = git(...logArgs, `--format=${fmt}`);
  if (!raw.trim()) return [];

  return raw.split(RSEP).filter(s => s.trim()).map(entry => {
    const parts = entry.trim().split(SEP);
    const [hash, email, author, ts, subject] = parts;
    const d = new Date(parseInt(ts, 10) * 1000);
    if (isNaN(d.getTime())) return null;
    return { hash, email, author, date: d, subject };
  }).filter(Boolean);
}

function fetchNumstat(opts) {
  const logArgs = buildLogArgs(opts);
  const raw = git(...logArgs, '--numstat', '--format=%x1e%H');
  const blocks = raw.split('\x1e').filter(Boolean);
  const result = {};

  for (const block of blocks) {
    const lines = block.trim().split('\n').filter(Boolean);
    if (!lines.length) continue;
    const hash = lines[0].trim();
    result[hash] = { additions: 0, deletions: 0, files: [] };
    for (const line of lines.slice(1)) {
      const parts = line.split('\t');
      if (parts.length < 3) continue;
      const adds = parseInt(parts[0], 10) || 0;
      const dels = parseInt(parts[1], 10) || 0;
      const file = parts[2].trim();
      result[hash].additions += adds;
      result[hash].deletions += dels;
      result[hash].files.push(file);
    }
  }
  return result;
}

// ─── Analysis ─────────────────────────────────────────────────────────────────

function analyzeFrequency(commits) {
  if (!commits.length) return null;

  const byDay = {};
  for (const c of commits) {
    const key = c.date.toISOString().slice(0, 10);
    byDay[key] = (byDay[key] || 0) + 1;
  }

  const sorted = Object.keys(byDay).sort();
  const first = new Date(sorted[0]);
  const last  = new Date(sorted[sorted.length - 1]);
  const totalDays = Math.max(1, Math.ceil((last - first) / 86400000) + 1);
  const avgPerDay = commits.length / totalDays;

  const mostActiveDay = Object.entries(byDay).sort((a,b) => b[1]-a[1])[0];

  // Streak calculation
  const daySet = new Set(sorted);
  let currentStreak = 0, longestStreak = 0, streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Walk backward from today
  let cursor = new Date();
  if (!daySet.has(today) && !daySet.has(yesterday)) {
    currentStreak = 0;
  } else {
    let d = daySet.has(today) ? new Date() : new Date(Date.now() - 86400000);
    while (true) {
      const k = d.toISOString().slice(0, 10);
      if (!daySet.has(k)) break;
      currentStreak++;
      d = new Date(d - 86400000);
    }
  }

  // Longest streak (forward pass)
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) { streak = 1; continue; }
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = Math.round((curr - prev) / 86400000);
    streak = diff === 1 ? streak + 1 : 1;
    if (streak > longestStreak) longestStreak = streak;
  }
  if (streak > longestStreak) longestStreak = streak;

  return { total: commits.length, avgPerDay, mostActiveDay, currentStreak, longestStreak };
}

function analyzeTimeOfDay(commits) {
  const hours = new Array(24).fill(0);
  for (const c of commits) hours[c.date.getHours()]++;
  const peak = hours.indexOf(Math.max(...hours));
  return { hours, peak };
}

function analyzeDayOfWeek(commits) {
  const days = new Array(7).fill(0);
  for (const c of commits) days[c.date.getDay()]++;
  return days;
}

function analyzeAuthors(commits, top) {
  const counts = {};
  for (const c of commits) {
    counts[c.author] = (counts[c.author] || 0) + 1;
  }
  const total = commits.length;
  return Object.entries(counts)
    .sort((a,b) => b[1]-a[1])
    .slice(0, top)
    .map(([name, count]) => ({ name, count, pct: (count / total * 100).toFixed(1) }));
}

function analyzeFileChurn(numstat, top) {
  const counts = {};
  for (const data of Object.values(numstat)) {
    for (const f of data.files) {
      counts[f] = (counts[f] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a,b) => b[1]-a[1])
    .slice(0, top)
    .map(([file, count]) => ({ file, count }));
}

function analyzeMessages(commits) {
  const subjects = commits.map(c => c.subject || '');
  const avgLen = subjects.reduce((s, m) => s + m.length, 0) / Math.max(subjects.length, 1);
  const longest = subjects.reduce((a, b) => a.length >= b.length ? a : b, '');

  const wordCounts = {};
  for (const msg of subjects) {
    for (const w of msg.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)) {
      if (w.length > 2 && !STOPWORDS.has(w)) {
        wordCounts[w] = (wordCounts[w] || 0) + 1;
      }
    }
  }
  const topWords = Object.entries(wordCounts)
    .sort((a,b) => b[1]-a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  return { avgLen: Math.round(avgLen), longest, topWords };
}

function analyzeMonthly(commits) {
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, count: 0, key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` });
  }
  for (const c of commits) {
    const key = `${c.date.getFullYear()}-${String(c.date.getMonth()+1).padStart(2,'0')}`;
    const m = months.find(x => x.key === key);
    if (m) m.count++;
  }
  return months;
}

function analyzeLinesChanged(numstat) {
  let adds = 0, dels = 0;
  for (const d of Object.values(numstat)) {
    adds += d.additions;
    dels += d.deletions;
  }
  return { adds, dels, ratio: dels === 0 ? Infinity : (adds / dels).toFixed(2) };
}

// ─── Rendering ────────────────────────────────────────────────────────────────

function bar(count, max, width = 30) {
  const filled = max === 0 ? 0 : Math.round((count / max) * width);
  return C.cyan + '█'.repeat(filled) + C.gray + '░'.repeat(width - filled) + C.reset;
}

function section(title) {
  console.log(`\n${C.bold}${C.white}── ${title} ${'─'.repeat(Math.max(0, 50 - title.length))}${C.reset}`);
}

function renderFrequency(freq) {
  section('Commit Frequency');
  console.log(`  ${C.bold}Total commits:${C.reset}     ${C.green}${freq.total}${C.reset}`);
  console.log(`  ${C.bold}Avg per day:${C.reset}       ${freq.avgPerDay.toFixed(2)}`);
  console.log(`  ${C.bold}Most active day:${C.reset}   ${freq.mostActiveDay[0]} (${freq.mostActiveDay[1]} commits)`);
  console.log(`  ${C.bold}Current streak:${C.reset}    ${C.yellow}${freq.currentStreak} day(s)${C.reset}`);
  console.log(`  ${C.bold}Longest streak:${C.reset}    ${C.green}${freq.longestStreak} day(s)${C.reset}`);
}

function renderHourHeatmap(tod) {
  section('Time-of-Day Heatmap');
  const max = Math.max(...tod.hours);
  for (let h = 0; h < 24; h++) {
    const label = String(h).padStart(2, '0') + ':00';
    const count = tod.hours[h];
    const isPeak = h === tod.peak ? ` ${C.yellow}◀ peak${C.reset}` : '';
    console.log(`  ${C.dim}${label}${C.reset}  ${bar(count, max, 25)}  ${String(count).padStart(4)}${isPeak}`);
  }
}

function renderDayHeatmap(days) {
  section('Day-of-Week Heatmap');
  const max = Math.max(...days);
  const order = [1,2,3,4,5,6,0]; // Mon-Sun
  for (const i of order) {
    const label = DAYS[i].padEnd(3);
    console.log(`  ${C.dim}${label}${C.reset}  ${bar(days[i], max, 25)}  ${String(days[i]).padStart(4)}`);
  }
}

function renderAuthors(authors) {
  section('Top Authors');
  const maxCount = authors[0]?.count || 0;
  for (let i = 0; i < authors.length; i++) {
    const { name, count, pct } = authors[i];
    const rank = `#${i + 1}`.padEnd(3);
    const nameTrunc = name.length > 25 ? name.slice(0, 22) + '...' : name.padEnd(25);
    console.log(`  ${C.dim}${rank}${C.reset} ${nameTrunc}  ${bar(count, maxCount, 18)}  ${String(count).padStart(4)} (${pct}%)`);
  }
}

function renderFileChurn(churn) {
  section('File Churn (Most Modified)');
  const maxCount = churn[0]?.count || 0;
  for (let i = 0; i < churn.length; i++) {
    const { file, count } = churn[i];
    const f = file.length > 40 ? '...' + file.slice(-37) : file.padEnd(40);
    console.log(`  ${C.dim}${String(i+1).padStart(2)}.${C.reset} ${C.cyan}${f}${C.reset}  ${bar(count, maxCount, 12)}  ${count}`);
  }
}

function renderMessageStats(msgs) {
  section('Commit Message Stats');
  console.log(`  ${C.bold}Avg message length:${C.reset} ${msgs.avgLen} chars`);
  const lng = msgs.longest.length > 70 ? msgs.longest.slice(0, 67) + '...' : msgs.longest;
  console.log(`  ${C.bold}Longest message:${C.reset}    "${C.dim}${lng}${C.reset}" (${msgs.longest.length} chars)`);
  console.log(`  ${C.bold}Top words:${C.reset}`);
  const maxW = msgs.topWords[0]?.count || 0;
  for (const { word, count } of msgs.topWords) {
    console.log(`    ${word.padEnd(18)}  ${bar(count, maxW, 15)}  ${count}`);
  }
}

function renderMonthly(months) {
  section('Month-over-Month Trend (Last 12 Months)');
  const max = Math.max(...months.map(m => m.count));
  const prev = { count: null };
  for (const m of months) {
    const trend = prev.count === null ? '' :
      m.count > prev.count ? ` ${C.green}▲${C.reset}` :
      m.count < prev.count ? ` ${C.red}▼${C.reset}` : ' ─';
    const label = m.label.padEnd(10);
    console.log(`  ${C.dim}${label}${C.reset}  ${bar(m.count, max, 25)}  ${String(m.count).padStart(4)}${trend}`);
    prev.count = m.count;
  }
}

function renderLinesChanged(lines) {
  section('Lines Changed');
  const total = lines.adds + lines.dels;
  const addPct = total === 0 ? 0 : (lines.adds / total * 100).toFixed(1);
  const delPct = total === 0 ? 0 : (lines.dels / total * 100).toFixed(1);
  console.log(`  ${C.green}+${lines.adds.toLocaleString()}${C.reset} additions  ${C.red}-${lines.dels.toLocaleString()}${C.reset} deletions`);
  console.log(`  Add/Del ratio: ${lines.ratio}  (${addPct}% adds, ${delPct}% dels)`);
}

// ─── GitHub Contribution Heatmap ──────────────────────────────────────────────

function renderHeatmap(commits) {
  const BLOCKS = ' ░▒▓█';
  const byDay = {};
  for (const c of commits) {
    const key = c.date.toISOString().slice(0, 10);
    byDay[key] = (byDay[key] || 0) + 1;
  }

  const max = Math.max(1, ...Object.values(byDay));
  const today = new Date();
  // Align to end of current week (Saturday)
  const endDay = new Date(today);
  endDay.setDate(today.getDate() + (6 - today.getDay()));

  // Build 7 rows × 52 cols grid
  const WEEKS = 52;
  const grid = [];
  for (let row = 0; row < 7; row++) grid.push([]);

  for (let w = WEEKS - 1; w >= 0; w--) {
    for (let d = 0; d < 7; d++) {
      const day = new Date(endDay);
      day.setDate(endDay.getDate() - (w * 7) - (6 - d));
      const key = day.toISOString().slice(0, 10);
      const count = byDay[key] || 0;
      const intensity = count === 0 ? 0 : Math.ceil((count / max) * 4);
      grid[d].push(BLOCKS[intensity]);
    }
  }

  console.log(`\n${C.bold}${C.white}── GitHub-Style Contribution Graph ────────────────────${C.reset}`);
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  for (let d = 0; d < 7; d++) {
    const label = d % 2 === 1 ? dayNames[d] : '   ';
    console.log(`  ${C.dim}${label}${C.reset}  ${C.green}${grid[d].join('')}${C.reset}`);
  }
  console.log(`\n  ${C.dim}Less ${BLOCKS.split('').join(' ')} More${C.reset}   (${commits.length} commits in 52 weeks)`);
}

// ─── JSON Output ──────────────────────────────────────────────────────────────

function renderJSON(data) {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}

// ─── Help ─────────────────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
${C.bold}${C.cyan}git-commit-stats${C.reset} v${VERSION}  —  Rich git commit analytics

${C.bold}USAGE${C.reset}
  git-commit-stats [options]
  gcs [options]

${C.bold}OPTIONS${C.reset}
  --since <date>       Filter commits since date (e.g. 2024-01-01 or "3 months ago")
  --author <name>      Filter by author name/email
  --branch <name>      Analyse specific branch (default: current)
  --format <mode>      Output format: default | heatmap | json
  --top <n>            Limit author/file lists (default: 10)
  --version, -v        Print version
  --help, -h           Show this help

${C.bold}EXAMPLES${C.reset}
  git-commit-stats
  git-commit-stats --since "6 months ago" --author "Alice"
  git-commit-stats --format heatmap
  git-commit-stats --format json | jq '.frequency.total'
  git-commit-stats --since 2024-01-01 --branch main --top 5

${C.bold}STATS INCLUDED${C.reset}
  • Commit frequency — total, avg/day, streaks
  • Time-of-day heatmap (24h bar chart)
  • Day-of-week heatmap (Mon–Sun)
  • Top authors with % share
  • File churn (most modified files)
  • Commit message analysis
  • Month-over-month 12-month trend
  • Lines added vs deleted

${C.bold}Zero external dependencies.${C.reset} Uses only Node.js built-ins + git.
`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs(process.argv);

  if (opts.version) { console.log(VERSION); process.exit(0); }
  if (opts.help) { printHelp(); process.exit(0); }

  if (!isGitRepo()) {
    console.error(`${C.red}Error:${C.reset} Not a git repository.`);
    process.exit(1);
  }

  const branch = opts.branch || getCurrentBranch();

  if (opts.format !== 'json') {
    console.log(`\n${C.bold}${C.magenta}git-commit-stats${C.reset} ${C.dim}v${VERSION}${C.reset}`);
    console.log(`${C.dim}Branch: ${branch}${opts.since ? `  Since: ${opts.since}` : ''}${opts.author ? `  Author: ${opts.author}` : ''}${C.reset}`);
  }

  let commits;
  try {
    commits = fetchCommits(opts);
  } catch (e) {
    console.error(`${C.red}Error reading git log:${C.reset} ${e.message}`);
    process.exit(1);
  }

  if (!commits.length) {
    console.log(`\n${C.yellow}No commits found matching the given filters.${C.reset}`);
    process.exit(0);
  }

  // ── Heatmap-only mode
  if (opts.format === 'heatmap') {
    renderHeatmap(commits);
    return;
  }

  // ── Gather stats
  let numstat = {};
  try { numstat = fetchNumstat(opts); } catch { /* optional */ }

  const freq    = analyzeFrequency(commits);
  const tod     = analyzeTimeOfDay(commits);
  const dow     = analyzeDayOfWeek(commits);
  const authors = analyzeAuthors(commits, opts.top);
  const churn   = analyzeFileChurn(numstat, opts.top);
  const msgs    = analyzeMessages(commits);
  const monthly = analyzeMonthly(commits);
  const lines   = analyzeLinesChanged(numstat);

  // ── JSON output
  if (opts.format === 'json') {
    renderJSON({ frequency: freq, timeOfDay: tod, dayOfWeek: dow, authors, fileChurn: churn, messageStats: msgs, monthly, linesChanged: lines });
    return;
  }

  // ── Default rich output
  renderFrequency(freq);
  renderHourHeatmap(tod);
  renderDayHeatmap(dow);
  renderAuthors(authors);
  if (churn.length) renderFileChurn(churn);
  renderMessageStats(msgs);
  renderMonthly(monthly);
  renderLinesChanged(lines);

  console.log(`\n${C.dim}Generated by git-commit-stats v${VERSION}  •  https://github.com/NickCirv/git-commit-stats${C.reset}\n`);
}

main().catch(e => {
  console.error(`${C.red}Fatal:${C.reset}`, e.message);
  process.exit(1);
});
