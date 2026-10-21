# Teamwork setup, smoke test in CI, TIDE wave fix (21 Oct 2026, on `main`)

Casper: several Claude agents work in the repo now, optimize it for teamwork; make sure basic things don't break again
(after bosses drifted away from their bodies, fixed the same evening in `43-enemies-view.js`).

**For agents** ([`docs/TEAMWORK.md`](../TEAMWORK.md)):
- `npm run team` (`tools/team.cjs`): open PRs = work in progress, the files each changes, and clashes with your branch
  (REST via `gh api`, works in Claude Code sessions; falls back to the public API).
- Claim work with a draft PR as the first push; one topic per branch.
- `npm run sync` (`tools/sync.sh`): rebase on main, `index.html` rebuilt instead of hand-merged (`.gitattributes`
  `merge=rebuild`, also hides it from diffs).
- Handovers are one file each in `docs/log/` (no more conflicts at the top of `UNFINISHED.md`, which is now history);
  the backlog is [`docs/OPEN.md`](../OPEN.md), gathered from the whole old log.
- PR template; README 1.4/1.5/5, CLAUDE/AGENTS/GEMINI/Copilot files point at all this.

**Checks on every push and PR** (`.github/workflows/checks.yml`, there was no CI before): `build --check`,
`npm run check`, and the new smoke test `npm run smoke` (`tools/check_smoke.cjs`, ~3-4 min headless): boots, Play,
walks, aimed shots, casts the super while scanning every effect for broken (NaN) coordinates, every view on its
entity, all 24 monster bodies through every strike kind and all 6 world bosses through every cast end where they
started (catches the boss drift bug), the hero after attacks, and 22 menu pages/tabs at 390 px with no errors or
sideways scrolling. Phone screenshots are uploaded as a CI artifact. `__dbg` gained `AssetSlots`, `enemyBase`
(local preview only).

**Bug the smoke test found:** every TIDE cast (Wrenna, the starter) built its wave with 17 broken vertices along the
bottom edge (`Math.pow` of a value rounded a hair below 0 = NaN), which can flash black or drop the wave on phones.
Clamped in `assets/data/hero-fx-v6.js`.

Open: run every hero's super in the smoke test; prune the ~50 merged branches (ask Casper); PR #25 (menu sounds,
nickcaels) has waited since 18 Oct.
