#!/bin/sh
# Bring your branch up to date with main without hand-merging index.html:
#   sh tools/sync.sh          (or: npm run sync)
# 1. registers the "rebuild" merge driver for index.html (.gitattributes): a conflict there keeps your copy
# 2. fetches and rebases onto origin/main (stops on a real conflict in src/ or docs: fix it, git rebase --continue,
#    then run this again)
# 3. rebuilds index.html from the merged src/ and commits it if it changed
set -e
cd "$(dirname "$0")/.."
git config merge.rebuild.name "keep ours, rebuilt from src/ by tools/sync.sh"
git config merge.rebuild.driver true
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "You have uncommitted changes: commit them first (a WIP commit is fine)."; exit 1
fi
git fetch -q origin main
if ! git rebase -q origin/main; then
  echo "Conflict in your files (not index.html): fix them, git add, git rebase --continue, then run sh tools/sync.sh again."
  exit 1
fi
node tools/build.cjs >/dev/null
if [ -n "$(git status --porcelain index.html)" ]; then
  git add index.html && git commit -qm "Rebuild index.html after syncing with main" && echo "index.html rebuilt and committed."
fi
node tools/build.cjs --check
echo "Up to date with origin/main ($(git rev-parse --short origin/main)). Push with: git push --force-with-lease origin HEAD"
