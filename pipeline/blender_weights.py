# Blender (headless) automatic bone-heat weights for a measured A-pose character.
# blender -b -P pipeline/blender_weights.py -- clean.glb joints.json weights.json
import bpy, json, sys, mathutils
src, joints_path, out_path = sys.argv[sys.argv.index('--') + 1:]
JOINTS = ['heroRoot', 'chest', 'head', 'upperarml', 'lowerarml', 'handl', 'upperarmr', 'lowerarmr', 'handr',
          'upperlegl', 'lowerlegl', 'footl', 'upperlegr', 'lowerlegr', 'footr']
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in meshes: o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1: bpy.ops.object.join()
mesh = bpy.context.view_layer.objects.active
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
J = {k: v for k, v in json.load(open(joints_path))['joints'].items()}
g2b = lambda p: mathutils.Vector((p[0], -p[2], p[1]))
zc = J['chest'][2]
bones = {
  'heroRoot': ([0, J['upperlegl'][1] - 0.05, zc], J['chest'], None),
  'chest': (J['chest'], J['head'], 'heroRoot'),
  'head': (J['head'], J['head_top'], 'chest'),
}
for s in 'lr':
  bones['upperarm' + s] = (J['upperarm' + s], J['lowerarm' + s], 'chest')
  bones['lowerarm' + s] = (J['lowerarm' + s], J['hand' + s], 'upperarm' + s)
  bones['hand' + s] = (J['hand' + s], J['hand_tip' + s], 'lowerarm' + s)
  bones['upperleg' + s] = (J['upperleg' + s], J['lowerleg' + s], 'heroRoot')
  bones['lowerleg' + s] = (J['lowerleg' + s], J['foot' + s], 'upperleg' + s)
  bones['foot' + s] = (J['foot' + s], J['toe' + s], 'lowerleg' + s)
arm_data = bpy.data.armatures.new('rig'); arm = bpy.data.objects.new('rig', arm_data); bpy.context.scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
for name in JOINTS:
  h, t, parent = bones[name]
  b = arm_data.edit_bones.new(name); b.head = g2b(h); b.tail = g2b(t)
  if (b.tail - b.head).length < 1e-3: b.tail = b.head + mathutils.Vector((0, 0, 0.02))
for name in JOINTS:
  p = bones[name][2]
  if p: arm_data.edit_bones[name].parent = arm_data.edit_bones[p]
bpy.ops.object.mode_set(mode='OBJECT')
# watertight proxy for a stable heat solve
proxy = mesh.copy(); proxy.data = mesh.data.copy(); proxy.name = 'proxy'; bpy.context.scene.collection.objects.link(proxy)
rm = proxy.modifiers.new('remesh', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = 0.005
bpy.context.view_layer.objects.active = proxy; bpy.ops.object.modifier_apply(modifier='remesh')
if len(proxy.data.polygons) > 60000:
  dm = proxy.modifiers.new('dec', 'DECIMATE'); dm.ratio = 60000 / len(proxy.data.polygons); bpy.ops.object.modifier_apply(modifier='dec')
bpy.ops.object.select_all(action='DESELECT'); proxy.select_set(True); arm.select_set(True); bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
empty = [n for n in JOINTS if n not in proxy.vertex_groups]
print('proxy faces', len(proxy.data.polygons), 'groups', len(proxy.vertex_groups), 'missing', empty)
# export the weighted proxy; the transfer to the real mesh happens offline (KD-tree + smoothing)
gi = {g.index: g.name for g in proxy.vertex_groups}
out, zero = [], 0
for v in proxy.data.vertices:
  ws = sorted(((g.weight, JOINTS.index(gi[g.group])) for g in v.groups if gi[g.group] in JOINTS and g.weight > 1e-4), reverse=True)[:4]
  tot = sum(w for w, _ in ws)
  if tot <= 0: zero += 1
  co = v.co
  out.append([round(co.x, 5), round(co.z, 5), round(-co.y, 5)] + [[j, round(w / tot, 4)] for w, j in ws] if tot > 0 else [round(co.x, 5), round(co.z, 5), round(-co.y, 5)])
json.dump({'joints': JOINTS, 'zero': zero, 'missing_groups': empty, 'proxy_faces': len(proxy.data.polygons), 'verts': out}, open(out_path, 'w'), separators=(',', ':'))
print('wrote', out_path, len(out), 'zero-weight proxy verts', zero)
