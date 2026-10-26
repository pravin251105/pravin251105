// Generates assets/stats.svg (terminal-style GitHub stats card) from the GitHub API.
// Usage: GITHUB_TOKEN=xxx node scripts/stats.mjs      (token optional locally, automatic in Actions)
//        STATS_FIXTURE=path.json node scripts/stats.mjs  (render from a saved JSON, no network)
// If the API can't be reached, an existing assets/stats.svg is kept; otherwise a placeholder is written.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSession, applyTheme } from './lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'profile.config.json'), 'utf8'));
const out = path.join(root, 'assets', 'stats.svg');
fs.mkdirSync(path.dirname(out), { recursive: true });

applyTheme(cfg.theme);
const user = cfg.github;
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const headers = {
  'User-Agent': 'profile-readme-builder',
  Accept: 'application/vnd.github+json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};
const host = cfg.host || 'github';
const prompt = `${cfg.handle}@${host}:~$ `;
const built = `synced ${new Date().toISOString().slice(0, 10)}`;

async function api(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

async function collect() {
  const profile = await api(`https://api.github.com/users/${user}`);
  const repos = [];
  for (let page = 1; page <= 5; page++) {
    const batch = await api(`https://api.github.com/users/${user}/repos?per_page=100&sort=pushed&page=${page}`);
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  const own = repos.filter((r) => !r.fork);
  const stars = own.reduce((n, r) => n + r.stargazers_count, 0);
  const forks = own.reduce((n, r) => n + r.forks_count, 0);

  // language bytes across the 30 most recently pushed non-fork repos
  const langs = {};
  for (const r of own.slice(0, 30)) {
    try {
      const l = await api(`https://api.github.com/repos/${r.full_name}/languages`);
      for (const [k, v] of Object.entries(l)) langs[k] = (langs[k] || 0) + v;
    } catch {
      /* skip repo */
    }
  }

  // contributions in the last year (needs a token for GraphQL)
  let contributions = null;
  if (token) {
    try {
      const res = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions}}}}`,
          variables: { login: user },
        }),
      });
      const j = await res.json();
      contributions = j?.data?.user?.contributionsCollection?.contributionCalendar?.totalContributions ?? null;
    } catch {
      /* optional */
    }
  }

  return {
    repos: profile.public_repos,
    followers: profile.followers,
    following: profile.following,
    stars,
    forks,
    contributions,
    since: (profile.created_at || '').slice(0, 4),
    langs,
  };
}

const dots = (label, value) => {
  const width = 26;
  const l = label.length;
  return [[label + ' ', 'purple'], ['.'.repeat(Math.max(2, width - l)) + ' ', 'dim'], [String(value), 'green']];
};

function render(d) {
  const items = [{ k: 'cmd', text: `gh profile stats ${user}` }];
  if (!d) {
    items.push({ k: 'out', runs: [['waiting for the first sync ...', 'dim']] });
    items.push({ k: 'out', runs: [['run the "build-profile" workflow (Actions tab) to fill this card in', 'fg']] });
  } else {
    items.push({ k: 'out', runs: dots('public repos', d.repos) });
    items.push({ k: 'out', runs: dots('stars earned', d.stars) });
    items.push({ k: 'out', runs: dots('forks', d.forks) });
    items.push({ k: 'out', runs: dots('followers', d.followers) });
    if (d.contributions != null) items.push({ k: 'out', runs: dots('contributions (1y)', d.contributions) });
    if (d.since) items.push({ k: 'out', runs: dots('on github since', d.since) });

    const total = Object.values(d.langs).reduce((a, b) => a + b, 0);
    const top = Object.entries(d.langs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    if (top.length && total) {
      items.push({ k: 'cmd', text: 'gh repo languages --top 5' });
      for (const [name, bytes] of top) {
        const p = (bytes / total) * 100;
        items.push({ k: 'bar', label: name, pct: p, value: `${p.toFixed(1)}%` });
      }
    }
  }
  items.push({ k: 'cmd', text: '' });
  return renderSession({
    title: `${cfg.handle}@${host}: ~/stats`,
    prompt,
    items,
    label: 'stats',
    built: d ? built : 'pending first sync',
    hold: 7,
  }).svg;
}

let data = null;
try {
  if (process.env.STATS_FIXTURE) {
    data = JSON.parse(fs.readFileSync(process.env.STATS_FIXTURE, 'utf8'));
    console.log('Using fixture', process.env.STATS_FIXTURE);
  } else {
    data = await collect();
    fs.writeFileSync(path.join(root, 'assets', 'stats.json'), JSON.stringify(data, null, 2));
  }
} catch (err) {
  console.warn(`Could not fetch GitHub stats: ${err.message}`);
  if (fs.existsSync(out)) {
    console.warn('Keeping the existing assets/stats.svg');
    process.exit(0);
  }
}

fs.writeFileSync(out, render(data));
console.log(`wrote assets/stats.svg ${data ? '(live data)' : '(placeholder)'}`);
