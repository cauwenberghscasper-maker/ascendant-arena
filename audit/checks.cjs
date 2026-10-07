// Read-only audit of the checked-out game; does not execute boot or call the network.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const baseline = process.argv.includes('--baseline');
const html = baseline ? require('node:child_process').execFileSync('git', ['show', '88a87d7:index.html'], {cwd:root, encoding:'utf8', maxBuffer:4e6}) : fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function section(start, end) {
  const a = html.indexOf(start), b = html.indexOf(end, a + start.length);
  assert(a >= 0 && b > a, `Missing source anchors ${start}`);
  return html.slice(a, b);
}
// Run the real boss builder and syncViews with render-only Three.js doubles.
// The doubles record visibility/transform state; this is not a GPU test.
class Obj {
  constructor() {
    this.visible = true; this.children = []; this.userData = {};
    this.rotation = {x:0,y:0,z:0};
    this.position = {x:0,y:0,z:0,set(x,y,z){Object.assign(this,{x,y,z});}};
    this.scale = {x:1,y:1,z:1,setScalar(s){this.x=this.y=this.z=s;}};
  }
  add(...items){this.children.push(...items);}
}
class Geo { rotateX(){return this;} dispose(){} }
class Material {
  constructor(o={}){Object.assign(this,o);this.color={setHex(){return this;},multiplyScalar(){return this;}};this.emissive={setRGB(){}};}
  dispose(){}
}
class Mesh extends Obj {constructor(g,m){super();this.geometry=g;this.material=m;}}
const results = [];
for (const proposed of [false,true]) {
  for (const zone of [0,1,2,3,4,5,6]) {
    const views = new Map(); const factories = new Map();
    const player = {kind:'fighter',alive:true,x:0,z:0};
    const boss = {kind:'boss',zone,x:4,z:4,facing:0,moveAmt:0,attackAnim:0,flashT:0,alive:true,hp:100};
    const G={mode:'hub',player,hubFighters:[],enemies:[],boss};
    const Showcase={on:false};
    const ctx={THREE:{Group:Obj,Mesh,MeshBasicMaterial:Material,RingGeometry:Geo},CFG:{world:{zones:Array.from({length:7},()=>({coreColor:0xff00ff}))}},
      golemGeos:()=>({body:new Geo(),arm:new Geo(),glow:new Geo()}),geoShadow:new Geo(),matShadow:new Material(),
      flashMaterial:()=>new Material(),addOutline:()=>{},matOutlineBoss:new Material(),angDiff:(a,b)=>b-a,clamp:(x,a,b)=>Math.min(b,Math.max(a,x)),
      AssetSlots:{register:(k,f)=>factories.set(k,f)},views,G,Showcase,Q:{cull:60},camera:{position:{x:0,z:0}},seen:new Set(),
      dynGroup:{remove(){}},mpVisible:()=>[],shownNpcs:()=>[],growthScale:()=>1,playerViewSig:()=>''};
    ctx.viewFor=e=>{if(!views.has(e))views.set(e,factories.get('boss')({zone:e.zone}));return views.get(e);};
    vm.createContext(ctx);
    let builder=section("AssetSlots.register('boss',", "AssetSlots.register('npc',");
    // Candidate fix in memory only: boss view owns its own visibility, like fighters/enemies.
    if(proposed) builder=builder.replace('update(b, dt, t) {','update(b, dt, t) { root.visible = b.alive !== false;');
    vm.runInContext(builder + '\n' + section('function syncViews(dt, t) {','// heroes grow a little'),ctx);
    ctx.syncViews(1/60,0); const view=views.get(boss);
    assert.equal(view.root.visible,true);
    Showcase.on=true;ctx.syncViews(1/60,1);assert.equal(view.root.visible,false);
    Showcase.on=false;ctx.syncViews(1/60,2);
    assert.equal(view.root.visible,proposed || !baseline);
    assert.equal(boss.alive,true);assert.equal(boss.hp,100);
    for(let i=0;i<120;i++)ctx.syncViews(1/60,3+i/60);
    assert(Math.abs(view.root.position.y)<1e-9,'spawn rise must complete');
    boss.retreat=0;ctx.syncViews(1/60,6);assert.equal(view.root.position.y,-4.5,'retreat still sinks');
    G.boss=null;ctx.syncViews(1/60,7);assert.equal(views.size,0,'ended boss view removed');
    if(!baseline) {
      G.boss=boss;delete boss.retreat;boss.spawnT=0;G.time=10;
      Showcase.on=true;ctx.syncViews(1/60,8);assert.equal(views.size,0,'showcase defers first view');
      Showcase.on=false;ctx.syncViews(1/60,9);assert(Math.abs(views.get(boss).root.position.y)<1e-9,'late-created boss view uses simulation age');
      assert.equal(views.get(boss).root.visible,true);
      G.boss=null;ctx.syncViews(1/60,10);assert.equal(views.size,0);
    }
    results.push({proposed,zone,visibleAfterMenu:view.root.visible});
  }
}
// Asset inventory from every actual GLB, rather than manifest estimates.
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const files=walk(path.join(root,'assets')).filter(f=>!baseline || !path.relative(root,f).replaceAll('\\','/').startsWith('assets/art/'));
const assets=files.filter(f=>path.basename(f)==='model.json').map(f=>{
  const pack=JSON.parse(fs.readFileSync(f,'utf8'));const glb=Buffer.from(pack.glb,'base64');
  assert.equal(glb.readUInt32LE(0),0x46546c67);assert.equal(glb.readUInt32LE(8),glb.length);
  const jsonLength=glb.readUInt32LE(12),g=JSON.parse(glb.subarray(20,20+jsonLength).toString('utf8'));
  let triangles=0,vertices=0;
  for(const m of g.meshes||[])for(const p of m.primitives){
    const pos=g.accessors[p.attributes.POSITION];vertices+=pos.count;
    if((p.mode??4)===4)triangles+=(p.indices==null?pos.count:g.accessors[p.indices].count)/3;
  }
  const dir=path.dirname(f);const textureBytes=fs.readdirSync(dir).filter(n=>/\.webp$/.test(n)).reduce((s,n)=>s+fs.statSync(path.join(dir,n)).size,0);
  return {path:path.relative(root,f).replaceAll('\\','/'),jsonBytes:fs.statSync(f).size,glbBytes:glb.length,textureBytes,
    triangles,vertices,meshes:g.meshes?.length||0,materials:g.materials?.length||0,animations:g.animations?.length||0,skins:g.skins?.length||0,
    images:(g.images||[]).map(i=>i.uri||i.mimeType),nodeNames:(g.nodes||[]).map(n=>n.name).filter(Boolean)};
});
const totals={models:assets.length,triangles:assets.reduce((s,a)=>s+a.triangles,0),modelJsonBytes:assets.reduce((s,a)=>s+a.jsonBytes,0),glbBytes:assets.reduce((s,a)=>s+a.glbBytes,0),
  textureBytes:assets.reduce((s,a)=>s+a.textureBytes,0),assetBytes:files.reduce((s,f)=>s+fs.statSync(f).size,0),byKind:{}};
for(const a of assets){const kind=a.path.split('/')[1];totals.byKind[kind]=(totals.byKind[kind]||0)+1;}
// Two confirmed data-corruption paths in the real sanitizer, using its default factory dependency as a fixture.
const fixture=()=>({v:2,level:1,cls:'bolt',gear:{weapon:{id:'default'}},stats:{},settings:{},brawlers:{bolt:{tree:{sets:[]},artifacts:[]}},unlocked:{attacks:[],artifacts:[]}});
const sc={LOCAL_PREVIEW:false,TEST_MODE:false,defaultProfile:fixture,CFG:{progression:{cap:1000},brawlers:{bolt:{}},gear:{slots:['weapon']}},clamp:(x,a,b)=>Math.min(b,Math.max(a,x)),newTreeState:()=>({sets:[]}),newBrawlerState:()=>({tree:{sets:[]},artifacts:[]}),Date};
vm.createContext(sc);
if(!baseline)vm.runInContext(fs.readFileSync(path.join(root,'assets/data/test-mode.js'),'utf8').replace(/export /g,''),sc);
if(!baseline)vm.runInContext(fs.readFileSync(path.join(root,'assets/data/loot-collection.js'),'utf8').replace(/export /g,''),sc);
if(!baseline)vm.runInContext(fs.readFileSync(path.join(root,'assets/data/prestige.js'),'utf8').replace(/export /g,''),sc);
if(!baseline)vm.runInContext(fs.readFileSync(path.join(root,'assets/data/companions.js'),'utf8').replace(/export /g,''),sc);
vm.runInContext(section('function sanitizeProfile(p) {','const Store ='),sc);
const malformed=[];
for(const bad of [{v:2,gear:null},{v:2,brawlers:{other:null}}]){try{sc.sanitizeProfile(bad);malformed.push({input:bad,throws:false});}catch(e){malformed.push({input:bad,throws:true,error:e.message});}}
assert(malformed.every(r=>r.throws === baseline));
// Touch cancellation should clear an aim gesture without firing it.
const cancelledShots=[];
for(const proposed of [false,true]) {
  const ic={Input:{atk:{id:7,aiming:true,dx:32,dy:0},oneShot:{}},STICK_R:50,
    Coach:{note(){}},atkKnob:{style:{}},clamp:(x,a,b)=>Math.min(b,Math.max(a,x)),performance:{now:()=>100}};
  vm.createContext(ic);
  let handler=section('  const endAtk = (e) => {',"  atk.addEventListener('pointerup', endAtk);");
  if(proposed) handler=handler.replace('if (Input.atk.aiming)',"if (e.type !== 'pointercancel' && Input.atk.aiming)").replace('else if (performance.now()',"else if (e.type !== 'pointercancel' && performance.now()");
  vm.runInContext(handler+"\nendAtk({pointerId:7,type:'pointercancel'});",ic);
  assert.equal(!!ic.Input.oneShot.fire,baseline && !proposed);assert.equal(ic.Input.atk.id,null);
  cancelledShots.push({proposed,firedOnCancel:!!ic.Input.oneShot.fire});
}
const output={commit:'88a87d726bca422f4742535ee6c639eff237c00c',bossChecks:results,malformedSaves:malformed,cancelledShots,totals,assets};
fs.writeFileSync(path.join(__dirname,baseline?'evidence.json':'regression-evidence.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({bossChecks:results.length,source:baseline?'original commit':'working source',result:'all lifecycle assertions passed',malformedSaves:malformed,totals},null,2));
