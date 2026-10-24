# Run node tools/export_enemy_rigs.mjs, then blender --background --python tools/build_enemy_skins.py
# Optional ids after -- select a subset. Blender 5.2; original meshes/textures are never overwritten.
import bpy, json, struct, base64, sys, os, math, hashlib
from mathutils import Vector, kdtree
root=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
catalog=json.load(open(os.path.join(os.path.dirname(__file__),'.gen','rig-catalog.json')))
targets=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else list(catalog)
def accessor(doc,bin_,index):
 a=doc['accessors'][index];v=doc['bufferViews'][a['bufferView']];fmt={5122:'h',5123:'H',5125:'I',5126:'f'}[a['componentType']];n={'VEC3':3,'SCALAR':1}[a['type']];size=struct.calcsize(fmt);stride=v.get('byteStride',n*size);off=v.get('byteOffset',0)+a.get('byteOffset',0)
 return [struct.unpack_from('<'+fmt*n,bin_,off+i*stride) for i in range(a['count'])]
failed=[]
for ident in targets:
 try:
  bpy.ops.wm.read_factory_settings(use_empty=True)
  spec=catalog[ident]['spec'];joints=catalog[ident]['joints'];folder=os.path.join(root,'assets',ident.replace('.','/'));packed=json.load(open(os.path.join(folder,'model.json')));blob=base64.b64decode(packed['glb']);length=struct.unpack_from('<I',blob,12)[0];doc=json.loads(blob[20:20+length]);raw=blob[28+length:];prim=doc['meshes'][0]['primitives'][0];points=accessor(doc,raw,prim['attributes']['POSITION']);lo=[min(p[k]for p in points)for k in range(3)];hi=[max(p[k]for p in points)for k in range(3)];h=hi[1]-lo[1];cx=(hi[0]+lo[0])/2;cz=(hi[2]+lo[2])/2
  normalized=[((p[0]-cx)/h,(p[1]-lo[1])/h,(p[2]-cz)/h)for p in points]
  tmp=os.path.join(os.path.dirname(__file__),'.gen','enemy-input.glb');open(tmp,'wb').write(blob);bpy.ops.import_scene.gltf(filepath=tmp)
  meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
  for o in meshes:o.select_set(True)
  bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.join();mesh=bpy.context.object
  bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
  verts=[v.co for v in mesh.data.vertices];mins=[min(v[k]for v in verts)for k in range(3)];maxs=[max(v[k]for v in verts)for k in range(3)];bh=maxs[2]-mins[2];bcx=(maxs[0]+mins[0])/2;bcy=(maxs[1]+mins[1])/2
  for v in mesh.data.vertices:v.co=Vector(((v.co.x-bcx)/bh,(v.co.y-bcy)/bh,(v.co.z-mins[2])/bh))
  # Merge close UV-shell duplicates for the heat solve, then transfer back to the original accessor order.
  bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.remove_doubles(threshold=.0005);bpy.ops.object.mode_set(mode='OBJECT')
  mesh.data.remesh_voxel_size=.012;mesh.data.use_remesh_preserve_volume=True;bpy.ops.object.voxel_remesh()
  arm=bpy.data.armatures.new('EnemyRig');obj=bpy.data.objects.new('EnemyRig',arm);bpy.context.collection.objects.link(obj);bpy.context.view_layer.objects.active=obj;mesh.select_set(False);obj.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
  bones=[]
  convert=lambda p:Vector((p[0],-p[2],p[1]))
  for i,j in enumerate(joints):
   bone=arm.edit_bones.new('enemy_'+j['name']);p=j['p'];bone.head=convert(p)
   children=[q for q in joints if q['parent']==i]
   if j['name']=='root':
    hy=spec.get('hip',[0,.25,0])[1];bone.head=convert([0,hy+.03,0]);bone.tail=convert([0,hy+.14,0])
   elif children:bone.tail=convert(children[0]['p'])
   elif j['name'].startswith('elbow'):bone.tail=convert([p[0]+(.02 if p[0]>0 else -.02),max(.10,p[1]-.24),p[2]+.06])
   elif j['name'].startswith('knee'):bone.tail=convert([p[0],.025,p[2]+.03])
   elif j['name'].startswith('wingTip'):bone.tail=convert([p[0]*1.5,p[1]+.05,p[2]])
   elif j['name'].startswith('tendril'):bone.tail=convert([p[0]*1.4,.08,p[2]*1.4])
   else:bone.tail=bone.head+Vector((0,0,.10))
   if(bone.tail-bone.head).length<.015:bone.tail=bone.head+Vector((0,0,.03))
   if j['parent']>=0:bone.parent=bones[j['parent']]
   bones.append(bone)
  bpy.ops.object.mode_set(mode='OBJECT');bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True);obj.select_set(True);bpy.context.view_layer.objects.active=obj;bpy.ops.object.parent_set(type='ARMATURE_AUTO')
  names={g.index:g.name for g in mesh.vertex_groups};joint_ids={'enemy_'+j['name']:i for i,j in enumerate(joints)}
  valid=[v for v in mesh.data.vertices if any(names[g.group] in joint_ids and g.weight>1e-5 for g in v.groups)]
  if not valid:raise Exception('Heat solver produced no weights')
  kd=kdtree.KDTree(len(valid))
  for v in valid:kd.insert(v.co,v.index)
  kd.balance();names={g.index:g.name for g in mesh.vertex_groups};joint_ids={'enemy_'+j['name']:i for i,j in enumerate(joints)};indices=[];weights=[];counts=[0]*len(joints);worst=0
  for p in normalized:
   _,index,dist=kd.find(convert(p));worst=max(worst,dist);v=mesh.data.vertices[index];row=sorted([(joint_ids[names[g.group]],g.weight)for g in v.groups if names[g.group]in joint_ids and g.weight>1e-5],key=lambda q:-q[1])[:4]
   if not row:raise Exception('Unweighted vertex')
   total=sum(w for _,w in row);row=[(j,w/total)for j,w in row]
   # The wolf's hanging fists touch the feet in the source mesh: keep heat
   # weights from welding the inner feet to the opposite forearm.
   if ident=='enemy.wolf':
    alpha=max(0,min(1,(.22-p[1])/.10))*max(0,min(1,(.28-abs(p[0]))/.08))
    if alpha>0:
     values={j:w*(1-alpha) for j,w in row};leg=joint_ids['enemy_leg'+('R' if p[0]>0 else 'L')];knee=joint_ids['enemy_knee'+('R' if p[0]>0 else 'L')]
     values[leg]=values.get(leg,0)+alpha*.25;values[knee]=values.get(knee,0)+alpha*.75
     row=sorted(values.items(),key=lambda q:-q[1])[:4];total=sum(w for _,w in row);row=[(j,w/total)for j,w in row]
   if ident=='world.boss_golem' and p[1]<.07 and abs(p[0])>.31:row=[(0,1)]
   for j,w in row:
    if w>.25:counts[j]+=1
   indices.extend([j for j,w in row]+[0]*(4-len(row)));weights.extend([round(w*65535)for j,w in row]+[0]*(4-len(row)))
  if worst>.30:raise Exception('Vertex mapping error '+str(worst))
  out=os.path.join(root,'assets','animation','enemy-rigs',ident.replace('.','-')+'.json');os.makedirs(os.path.dirname(out),exist_ok=True)
  result={'version':1,'id':ident,'modelSha256':hashlib.sha256(open(os.path.join(folder,'model.json'),'rb').read()).hexdigest(),'vertices':len(points),'joints':[j['name']for j in joints],'jointPositions':[j['p']for j in joints],'indices':base64.b64encode(struct.pack('<'+'H'*len(indices),*indices)).decode(),'weights':base64.b64encode(struct.pack('<'+'H'*len(weights),*weights)).decode(),'counts':counts,'method':'Blender 5.2 bone heat; UV seam weld; original accessor order','mappingError':worst}
  json.dump(result,open(out,'w'),separators=(',',':'));print('SKIN_OK',ident,len(points),counts,flush=True)
 except Exception as ex:failed.append(ident);print('SKIN_FAILED',ident,str(ex),flush=True)
if failed:raise RuntimeError('Skin bake failed: '+', '.join(failed))
