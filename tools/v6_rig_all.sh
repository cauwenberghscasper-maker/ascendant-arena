#!/bin/bash
# Rig every staged TRELLIS hero (tools/.gen/<id>_t1.glb) with the v4 pipeline and run the motion check.
# Usage: tools/v6_rig_all.sh id1 id2 ...   (skips heroes already rigged)
cd "$(dirname "$0")/.." || exit 1
G=tools/.gen
export POSE_MODEL=$G/pose_landmark_heavy.tflite
for N in "$@"; do
  [ -f $G/${N}_t1.glb ] || { echo "$N: no source"; continue; }
  [ -f $G/${N}_poses.json ] && { echo "$N: done"; continue; }
  {
    { [ -f $G/${N}_clean.glb ] || { node tools/v4_clean.cjs $G/${N}_t1.glb $G/${N}_raw.glb 15000 >/dev/null && node tools/v6_islands.cjs $G/${N}_raw.glb $G/${N}_clean.glb >/dev/null; }; } &&
    python3 tools/v4_pose.py $G/${N}_clean.glb $G/${N}_clean.joints.json $G/${N}_joints.png 2>&1 | grep -v INFO | tail -1 &&
    python3 tools/v4_heat.py $G/${N}_clean.glb $G/${N}_clean.joints.json $G/${N}_heat.json >/dev/null &&
    node tools/v4_assemble.cjs $G/${N}_clean.glb $G/${N}_clean.joints.json $G/${N}_heat.json $G/${N}_rigged.glb >/dev/null &&
    node tools/v6_posecheck.mjs $G/${N}_rigged.glb $G/${N}_poses.png $G/${N}_poses.json >/dev/null &&
    echo "$N: rigged $(python3 -c "import json;d=json.load(open('$G/${N}_poses.json'));print('maxStretch',max(p['maxStretch'] for p in d),'bad%',max(p['badEdgePct'] for p in d))")"
  } || echo "$N: FAILED"
done
