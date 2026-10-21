// Who is working on what right now: open pull requests (drafts = work in progress), the files each one changes,
// and which of them touch the same files as your branch.
//   node tools/team.cjs        (or: npm run team)
// Uses `gh api` (REST) when the GitHub CLI works, else the public GitHub API (no token needed, 60 calls an hour).
const { execSync } = require('node:child_process');
const REPO = 'cauwenberghscasper-maker/ascendant-arena';
const sh = (c) => { try { return execSync(c, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return null; } };
const SKIP = new Set(['index.html', 'audit/regression-evidence.json']); // generated: overlapping there is expected

async function openPrs() {
  // REST through the GitHub CLI (works in Claude Code sessions, which have no GraphQL), else the public API
  const ghApi = (u) => { const o = sh(`gh api "repos/${REPO}${u}"`); if (o == null) throw new Error('gh'); return JSON.parse(o); };
  const web = async (u) => { const r = await fetch('https://api.github.com/repos/' + REPO + u, { headers: { 'user-agent': 'team.cjs', accept: 'application/vnd.github+json' } }); if (!r.ok) throw new Error(r.status + ' ' + u); return r.json(); };
  let get = async (u) => ghApi(u);
  try { await get('/pulls?state=open&per_page=1'); } catch { get = web; }
  const list = await get('/pulls?state=open&per_page=50');
  return Promise.all(list.map(async (p) => ({ n: p.number, title: p.title, branch: p.head.ref, draft: p.draft, who: p.user && p.user.login, at: p.updated_at, body: p.body || '',
    files: (await Promise.resolve(get(`/pulls/${p.number}/files?per_page=100`)).catch(() => [])).map((f) => f.filename) })));
}
const ago = (t) => { const h = (Date.now() - new Date(t)) / 36e5; return h < 1 ? Math.round(h * 60) + ' min' : h < 48 ? Math.round(h) + ' h' : Math.round(h / 24) + ' days'; };
const short = (files) => { const by = {}; for (const f of files) if (!SKIP.has(f)) { const k = f.startsWith('src/game/') ? f.slice(9) : f.split('/').slice(0, 2).join('/'); by[k] = 1; } const k = Object.keys(by); return k.slice(0, 8).join(', ') + (k.length > 8 ? ` +${k.length - 8}` : ''); };

(async () => {
  sh('git fetch -q origin main');
  const branch = sh('git rev-parse --abbrev-ref HEAD') || '?';
  const mine = new Set(((sh('git diff --name-only origin/main...HEAD') || '') + '\n' + (sh('git diff --name-only HEAD') || '')).split('\n').filter((f) => f && !SKIP.has(f)));
  let prs;
  try { prs = await openPrs(); } catch (e) { console.log('Could not reach GitHub (' + e.message + '). Open PRs: https://github.com/' + REPO + '/pulls'); return; }
  console.log(`You: ${branch} (${mine.size} changed files vs main)\n`);
  if (!prs.length) console.log('No open pull requests: nobody else has claimed work.');
  const count = {};
  for (const p of prs) for (const f of p.files) if (!SKIP.has(f)) count[f] = (count[f] || 0) + 1;
  for (const p of prs.sort((a, b) => new Date(b.at) - new Date(a.at))) {
    const clash = p.branch !== branch ? p.files.filter((f) => mine.has(f)) : [];
    const stale = (Date.now() - new Date(p.at)) / 864e5 > 3 ? '  (no activity for days: ask before taking it over)' : '';
    console.log(`#${p.n} ${p.draft ? '[working] ' : '[ready]   '}${p.title}\n    ${p.branch} · ${p.who || '?'} · updated ${ago(p.at)} ago${stale}\n    touches: ${short(p.files) || '(nothing yet)'}`);
    if (clash.length) console.log(`    !! also changed on your branch: ${clash.join(', ')}  -> keep your edits small there, sync often (npm run sync)`);
  }
  const hot = Object.entries(count).filter(([, n]) => n > 1).map(([f, n]) => `${f} (${n})`);
  if (hot.length) console.log(`\nFiles several open PRs change: ${hot.join(', ')}`);
  console.log('\nClaim new work: push your branch and open a draft PR first (docs/TEAMWORK.md).');
})();
