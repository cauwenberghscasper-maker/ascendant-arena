#!/bin/bash
# Full v4 rig pipeline for one hero: tools/v4_run.sh NAME BATCH [landmark overrides...]
# Reads drop/<BATCH>/<NAME>_t1.glb from the asset-drop branch and writes tools/.gen/<NAME>_*.
set -e
N=$1; B=$2; shift 2
G=tools/.gen
[ -f $G/${N}_t1.glb ] || git show origin/asset-drop:drop/$B/${N}_t1.glb > $G/${N}_t1.glb
[ -f $G/${N}_concept.webp ] || git show origin/asset-drop:drop/$B/${N}_concept.webp > $G/${N}_concept.webp
[ -f $G/${N}_clean.glb ] || node tools/v4_clean.cjs $G/${N}_t1.glb $G/${N}_clean.glb 15000 >/dev/null
OV=""; [ $# -gt 0 ] && OV="--override $*"
python3 tools/v4_pose.py $G/${N}_clean.glb $G/${N}_clean.joints.json $G/${N}_joints.png $OV 2>&1 | grep -v INFO
python3 tools/v4_heat.py $G/${N}_clean.glb $G/${N}_clean.joints.json $G/${N}_heat.json
node tools/v4_assemble.cjs $G/${N}_clean.glb $G/${N}_clean.joints.json $G/${N}_heat.json $G/${N}_rigged.glb | cut -c1-200
