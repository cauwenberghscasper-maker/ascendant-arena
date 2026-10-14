#!/usr/bin/env bash
# Process a generated world batch: clean each TRELLIS mesh (tools/v10_prop.cjs), pack it into assets/world/<name>/
# and, for trees, also a light far-LOD copy (<name>_lod). Then regenerate WORLD_MODEL_BOX.
# tools/v10_world_batch.sh DROP_DIR   (DROP_DIR holds <name>_t1.glb files from the generator)
set -euo pipefail
DROP=$1; OUT=${OUT:-/tmp/v10w}; mkdir -p "$OUT"
cd "$(dirname "$0")/.."
# name tris texture [extra env]
spec() {
  case $1 in
    tree_*) echo "1500 1024 PERM=1";;
    bush_*|berry_bush|mushrooms) echo "500 512 PERM=1";;
    tuft) echo "150 256 PERM=1";;
    rock_*|ruin_block|rift_shard|arena_crate|standing_stone|stump|log) echo "700 512 PERM=1";;
    ore_pile|bone_pile|signpost|lantern_post|fence|banner_pole|ruin_pillar|pond|dungeon_tile) echo "1500 512";;
    mountain|snow_mountain|volcano|floating_isle|sea_stack|sky_temple) echo "3500 1024 PERM=1";;
    rift_floor|arena_floor) echo "7000 1024";;
    *) echo "6000 1024";;
  esac
}
for f in "$DROP"/*_t1.glb; do
  n=$(basename "$f" _t1.glb); read -r tris tex extra <<<"$(spec "$n")"
  env ${extra:-} node tools/v10_prop.cjs "$f" "$OUT/$n.glb" "$tris" 2>/dev/null || { echo "FAIL $n"; continue; }
  if [[ $n == tree_* ]]; then env PERM=1 SERR=0.2 node tools/v10_prop.cjs "$f" "$OUT/${n}_lod.glb" 260 2>/dev/null || true; fi
done
ls "$OUT"/*.glb | wc -l
