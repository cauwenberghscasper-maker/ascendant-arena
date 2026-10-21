# Working in parallel (people and AI agents)

Several Claude sessions, Codex, Copilot and people change this repo at the same time. These five habits keep us from
redoing or overwriting each other's work. The rules and style are in the [README](../README.md); this page is only
about working side by side.

## 1. Look before you start
```
git fetch origin && git checkout -B claude/<topic> origin/main
npm run team          # open PRs = work in progress, the files each one changes, clashes with yours
```
Also skim [`docs/OPEN.md`](OPEN.md) (the backlog) and the newest files in [`docs/log/`](log/) (what just happened).
If an open PR already covers your task, build on that branch or leave a comment on it instead of starting over. A PR
with no activity for 3+ days may be picked up, but say so in a comment on it first.

## 2. Claim it: a draft PR as your first push
Your first push opens a **draft pull request** (even with an empty commit), so everyone running `npm run team` sees it:
```
git commit --allow-empty -m "Start: <what the player will get>"
git push -u origin HEAD
gh api repos/cauwenberghscasper-maker/ascendant-arena/pulls -f head=claude/<topic> -f base=main -F draft=true \
  -f title="<what the player will get>" -f body="Plan: ... Files: ..."
```
(`gh pr create --draft` works where GraphQL is allowed; Claude Code sessions need the REST call above.) Name the
files or systems you expect to touch in the body. Mark the PR ready when it is done; Casper merges big work.
Small requested fixes can still go straight to `main` once the checks pass (README 1.4).

## 3. Stay small and in sync
- One topic per branch. Edit only the part of a shared file you need (`61-panels.js`, `63-menus.js`, `ui-v2.css`,
  `44-world-view.js`, `README.md` are the hot spots). No reformatting, renaming or "tidying" of other code.
- `npm run sync` rebases onto `main` and rebuilds `index.html` for you (its conflicts are resolved by rebuilding;
  never by hand). Run it before you push and before you mark a PR ready.
- A new top-level name in `src/game/` must be unique across all files (one shared scope): `grep -rn "name" src/game`.

## 4. Checks run on every push and PR
GitHub Actions (`.github/workflows/checks.yml`) runs `node tools/build.cjs --check`, `npm run check` and the smoke
test (`npm run smoke`: the real game in headless Chromium: boot, Play, walk, shoot, super, every monster body and
world boss through every attack, no page errors). Run them yourself before pushing; a red check on a PR is yours to
fix before merging. Found a bug that a check could have caught? Add the check in the same PR.

## 5. Hand over in your own file
Write your handover as **one new file** `docs/log/YYYY-MM-DD-<topic>.md` (what Casper asked, what changed for the
player, how it was tested, what is still open). New files never conflict, unlike everyone prepending to the same
file. Then update the matching lines of `docs/OPEN.md` (tick off what you finished, add what you found) and of the
README if you added a system, rule or file. `docs/UNFINISHED.md` is the history before 21 Oct 2026: read it, don't
add to it.
