#!/bin/bash
# Re-run the motion check (with natural arm hang) for every hero: tools/v6_posecheck_all.sh id...
cd "$(dirname "$0")/.." || exit 1
for N in "$@"; do node tools/v6_posecheck.mjs tools/.gen/${N}_rigged.glb tools/.gen/${N}_poses.png tools/.gen/${N}_poses.json 2>&1 >/dev/null | sed "s/^/$N /"; done
