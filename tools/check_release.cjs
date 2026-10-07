// Executes current source functions without browser globals, boot or network calls.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function section(a,b) { const i=html.indexOf(a),j=html.indexOf(b,i+a.length); assert(i>=0&&j>i,a);return html.slice(i,j); }
let passed=0;
function check(name,fn){fn();passed++;console.log('PASS '+name);}
const ctx={Date,console,performance:{now:()=>0},LOCAL_PREVIEW:false,TEST_MODE:false,G:{gearPrompts:[],mode:'hub'},masteryBonus:()=>0,addMastery(){},refreshPlayerStats(){},checkAchievements(){},ev(){},toast(){},onExpedition:()=>false};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'assets/data/test-mode.js'),'utf8').replace(/export /g,''),ctx);
const collectionModule=fs.readFileSync(path.join(root,'assets/data/loot-collection.js'),'utf8').replace(/export /g,'');
vm.runInContext(collectionModule+'\nthis.collectionDefs=COLLECTION_ITEMS;',ctx);
vm.runInContext(fs.readFileSync(path.join(root,'assets/data/prestige.js'),'utf8').replace(/export /g,''),ctx);
vm.runInContext(fs.readFileSync(path.join(root,'assets/data/companions.js'),'utf8').replace(/export /g,''),ctx);
vm.runInContext(section('const CFG = {','// 2. UTIL')+section('const clamp =','// 3. DATA')+
  section('const P = CFG.progression;','const salvageValue =')+
  section('function itemPower(it) {','function bestBagItem(')+
  section('function defaultProfile() {','const Store =')+
  section('function setBrawler(id) {','function artifactSlotsFor(')+
  section('function salvageItem(id) {','const rerollCost =')+
  section('function buyForge(slot) {','// How good an item')+
  section('const FRAME_MS =','  let dt = (now - lastFrame)')+'\n}\n'+
  '\nthis.config=CFG;this.mxp=mxpFor;this.plan=maxUpgradePlan;this.newProfile=defaultProfile;',ctx);
const make=(id,slot='weapon',rarity='common',ilvl=1,up=0)=>({id,slot,rarity,ilvl,up,name:'Worn Edge',aff:{}});
function fresh(){const p=ctx.newProfile();p.gold=1e7;p.essence=1e5;p.gear.weapon=make('target','weapon','rare',10);ctx.G.profile=p;ctx.G.gearPrompts=[];ctx.G.dirty=false;return p;}
check('named items have unique ids and match existing equipment mesh nouns',()=>{
  const ids=new Set();
  vm.runInContext(section('function itemStyle(it) {','function itemElement(it) {'),ctx);
  for(const d of ctx.collectionDefs){assert(!ids.has(d.id));ids.add(d.id);assert.equal(d.name.endsWith(' '+d.noun),true);assert(ctx.config.gear.slots.includes(d.slot));assert(ctx.config.gear.rarity[d.rarity]);assert.equal(ctx.itemStyle(d),vm.runInContext('ITEM_NAMES',ctx)[d.slot].indexOf(d.noun));}
  assert.equal(ids.size,24);
});
check('fourth eligible drop guarantees a named item and preserves rolled stats',()=>{
  const p=fresh();for(let i=0;i<3;i++){assert.equal(ctx.rollCollectionItem(p,make('miss'+i,'weapon','rare',10),()=>.99),false);assert.equal(p.collectionLuck['weapon|rare'],i+1);}
  const it=make('win','weapon','rare',10,7);it.aff={dmg:12};it.locked=true;
  assert.equal(ctx.rollCollectionItem(p,it,()=>.99),true);assert.equal(it.collectionId,'frostbite');assert.equal(it.id,'win');assert.equal(it.up,7);assert.equal(it.ilvl,10);assert.equal(it.locked,true);assert.equal(it.aff.dmg,12);assert.equal(p.collectionLuck['weapon|rare'],0);
  assert.equal(ctx.rollCollectionItem(p,it,()=>.99),false);
});
check('eligible drop luck is isolated by rarity and slot; low levels do not advance it',()=>{
  const p=fresh();assert.equal(ctx.rollCollectionItem(p,make('low','helmet','rare',9),()=>.99),false);assert.equal(p.collectionLuck['helmet|rare'],undefined);
  ctx.rollCollectionItem(p,make('a','weapon','rare',10),()=>.99);ctx.rollCollectionItem(p,make('b','helmet','rare',10),()=>.99);ctx.rollCollectionItem(p,make('c','weapon','epic',22),()=>.99);
  assert.equal(p.collectionLuck['weapon|rare'],1);assert.equal(p.collectionLuck['helmet|rare'],1);assert.equal(p.collectionLuck['weapon|epic'],1);
  for(const d of ctx.collectionDefs){const it=make(d.id,d.slot,d.rarity,d.minLevel);assert.equal(ctx.rollCollectionItem(p,it,()=>0),true);assert.equal(it.collectionId,d.id);assert(ctx.collectionIcon(it).endsWith('/'+d.id+'.webp'));}
});
check('collection migration is idempotent and discovery survives gear consumption',()=>{
  const p=fresh(),it={...make('named','weapon','rare',10),collectionId:'frostbite',name:'Frostbite Edge'};p.bag=[it];delete p.collection;delete p.collectionLuck;
  ctx.migrateCollection(p);assert.equal(p.collection.frostbite.count,1);ctx.migrateCollection(p);assert.equal(p.collection.frostbite.count,1);
  ctx.recordCollectionItem(p,it,123);assert.equal(p.collection.frostbite.count,2);p.bag=[];ctx.migrateCollection(p);assert.equal(p.collection.frostbite.count,2);
  assert.equal(ctx.collectionIcon({...it,slot:'helmet'}),'');assert.equal(ctx.collectionIcon({...it,rarity:'divine'}),'');
  p.collection={unknown:{count:9},frostbite:{count:Infinity}};p.collectionLuck={'weapon|rare':99,'bogus|rare':3};ctx.migrateCollection(p);assert.deepEqual(Object.keys(p.collection),[]);assert.equal(p.collectionLuck['weapon|rare'],3);assert.equal(p.collectionLuck['bogus|rare'],undefined);
});
ctx.curTier=()=>0;ctx.addEssence=()=>{};ctx.addGold=()=>{};
vm.runInContext(section('CFG.cases = {','// --- Vault:')+section('function highestZone(level) {','// zone odds')+
  section('function grantItem(it, source, context) {','// --- jobs'),ctx);
check('regional boss cases use the killed boss zone and preserve existing rarity odds',()=>{
  const p=fresh();p.level=100;ctx.G.zoneIdx=6;
  for(const [zone,kind] of [[0,'boss'],[2,'frost'],[3,'ember'],[6,'celestial']]){
    ctx.grantItem(make('reward'+zone,'weapon','epic',40),'boss',{zone});const c=p.cases.at(-1);assert.equal(c.k,kind);assert.equal(c.z,zone);assert.equal(c.f,'rare');
    assert.deepEqual(JSON.parse(JSON.stringify(ctx.caseTable(c))),JSON.parse(JSON.stringify(ctx.caseTable({...c,k:'boss'}))));
  }
  assert.equal(ctx.regionBossCase('hunter',2),'hunter');assert.equal(ctx.regionBossCase('rift',6),'rift');assert.equal(Object.keys(p.collection).length,0);
});
check('case conversion and preview rolls cannot create phantom collection discoveries',()=>{
  const p=fresh();p.level=100;ctx.G.zoneIdx=0;ctx.grantItem(make('packed','weapon','legendary',36),'monster');assert.equal(p.cases.length,1);assert.equal(p.cases[0].z,6,'non-boss case scaling stays compatible');assert.equal(Object.keys(p.collectionLuck).length,0);
  for(let i=0;i<60;i++)ctx.makeItem('weapon','legendary',36);assert.equal(Object.keys(p.collection).length,0);assert.equal(Object.keys(p.collectionLuck).length,0);
  p.collectionLuck['weapon|legendary']=3;
  const it=make('opened','weapon','legendary',36);ctx.grantItem(it,'case');assert.equal(it.collectionId,'sunspike');assert.equal(p.collection.sunspike.count,1);assert(p.bag.includes(it));
  p.collectionLuck['weapon|rare']=3;ctx.grantItem(make('debug','weapon','rare',10),'test');assert.equal(p.collectionLuck['weapon|rare'],3);assert.equal(p.collection.frostbite,undefined);
});
check('opening a saved regional case consumes it once and grants the actual named winner',()=>{
  const p=fresh();p.cases=[{id:'saved-regional',k:'frost',l:40,t:0,z:2,f:'rare'}];
  for(const rarity of ['rare','epic','legendary'])for(const slot of ctx.config.gear.slots)p.collectionLuck[slot+'|'+rarity]=3;
  const r=ctx.openCase('saved-regional');assert(r);assert.equal(p.cases.length,0);assert.equal(p.stats.cases,1);assert(ctx.collectionItem(r.item));assert.equal(Object.keys(p.collection).length,1);assert.equal(r.kept,true);assert.equal(ctx.openCase('saved-regional'),null);
});
check('same slot, strictly weaker, unique and unprotected material selection',()=>{
  const p=fresh();p.bag=[make('weak'),make('weak'),make('other','helmet'),Object.assign(make('locked'),{locked:true}),make('strong','weapon','legendary'),make('equal','weapon','rare',10),{...p.gear.weapon},make('second','weapon','uncommon',2)];
  assert.deepEqual(Array.from(ctx.mergeCandidates(p.gear.weapon),m=>m.id),['weak','second']);
});
check('reviewed merge consumes exact materials and currency once',()=>{
  const p=fresh();p.bag=[make('weak'),Object.assign(make('locked'),{locked:true})];ctx.G.gearPrompts=['weak','locked'];
  const plan=ctx.plan(p.gear.weapon,1),gold=p.gold,ess=p.essence;assert.equal(plan.n,1);
  assert.equal(ctx.upgradeItemMax('weapon',plan),1);assert.equal(p.gear.weapon.up,1);
  assert.equal(p.gold,gold-plan.gold);assert.equal(p.essence,ess-plan.ess);assert.equal(p.stats.upgrades,1);
  assert.deepEqual(Array.from(p.bag,m=>m.id),['locked']);assert.deepEqual(Array.from(ctx.G.gearPrompts),['locked']);
  assert.equal(ctx.upgradeItemMax('weapon',plan),0);
});
check('changed/protected materials invalidate confirmation without partial spending',()=>{
  const p=fresh();p.bag=[make('weak')];const plan=ctx.plan(p.gear.weapon,1);p.bag[0].locked=true;const before=JSON.stringify(p);
  assert.equal(ctx.upgradeItemMax('weapon',plan),0);assert.equal(JSON.stringify(p),before);
  p.bag[0].locked=false;const next=ctx.plan(p.gear.weapon,1);p.bag[0].up=1;const changed=JSON.stringify(p);
  assert.equal(ctx.upgradeItemMax('weapon',next),0);assert.equal(JSON.stringify(p),changed);
});
check('no materials, no gold, no gems and no unreviewed merge',()=>{
  const p=fresh();assert.equal(ctx.plan(p.gear.weapon,1).n,0);p.bag=[make('weak')];p.gold=0;assert.equal(ctx.plan(p.gear.weapon,1).n,0);
  p.gold=1e7;p.essence=0;p.gear.weapon.up=ctx.config.gear.essenceFrom;assert.equal(ctx.plan(p.gear.weapon,1).n,0);
  p.essence=1e5;assert.equal(ctx.upgradeItemMax('weapon'),0);
});
check('max merge accounts for increased material requirements at level 10',()=>{
  const p=fresh();p.gear.weapon.up=9;p.bag=[make('a'),make('b'),make('c'),make('d')];const plan=ctx.plan(p.gear.weapon);
  assert.equal(plan.n,2);assert.equal(plan.materials.length,3);assert.equal(ctx.upgradeItemMax('weapon',plan),2);assert.equal(p.gear.weapon.up,11);assert.equal(p.bag.length,1);
});
check('protected salvage leaves inventory and currencies unchanged',()=>{
  const p=fresh();p.bag=[Object.assign(make('locked'),{locked:true})];const before=JSON.stringify(p);assert.equal(ctx.salvageItem('locked'),false);assert.equal(JSON.stringify(p),before);
});
check('a full inventory prevents forging from discarding equipped gear',()=>{
  const p=fresh();p.gear.weapon.locked=true;p.bag=Array.from({length:ctx.config.gear.bagMax},(_,i)=>make('bag'+i));ctx.forgeOffer=()=>({price:30});const before=JSON.stringify(p);
  assert.equal(ctx.buyForge('weapon'),false);assert.equal(JSON.stringify(p),before);
});
check('mastery 79 locks switching; mastery 80 permits owned brawlers only',()=>{
  const p=fresh();p.unlocked.attacks=['wave'];ctx.ownedBrawlers=p=>['bolt',...p.unlocked.attacks];p.mastery['w:bolt']=ctx.mxp(80)-1;
  assert.equal(ctx.masteryLevel(p.mastery['w:bolt']),79);assert.equal(ctx.setBrawler('wave'),false);assert.equal(p.cls,'bolt');
  p.mastery['w:bolt']=ctx.mxp(80);assert.equal(ctx.setBrawler('wave'),true);assert.equal(p.cls,'wave');assert.equal(ctx.setBrawler('rail'),false);
  ctx.G.mode='arena';assert.equal(ctx.setBrawler('bolt'),false);ctx.G.mode='hub';ctx.onExpedition=()=>true;assert.equal(ctx.setBrawler('bolt'),false);ctx.onExpedition=()=>false;
});
check('old saves retain current hero and inventory; auto salvage migration happens once',()=>{
  const old=fresh();old.cls='wave';delete old.starterBrawler;delete old.mergeVersion;old.brawlers.wave=ctx.newBrawlerState();old.settings.autoSalvage=2;old.bag=[Object.assign(make('locked'),{locked:true})];
  const p=ctx.sanitizeProfile(old);assert.equal(p.starterBrawler,'wave');assert.equal(p.cls,'wave');assert.equal(p.settings.autoSalvage,0);assert.equal(p.bag[0].locked,true);
  p.settings.autoSalvage=2;assert.equal(ctx.sanitizeProfile(p).settings.autoSalvage,2);
  assert.doesNotThrow(()=>ctx.sanitizeProfile({v:2,gear:null,brawlers:{wave:null}}));
});
check('60 Hz scheduler preserves cadence on 60/90/120/144/165 Hz displays',()=>{
  const prefix=section('  if (now < nextFrameAt','  let dt =');
  for(const hz of [60,90,120,144,165]){const c={FRAME_MS:1000/60,nextFrameAt:0,count:0};vm.createContext(c);vm.runInContext('function tick(now){'+prefix+'count++;}',c);for(let i=0;i<hz*10;i++)c.tick(i*1000/hz);assert(Math.abs(c.count-600)<=1,`${hz} Hz: ${c.count}`);}
});
check('instance disposal frees owned materials once and retains shared resources',()=>{
  const code=section('  disposeInstance(model) {','  // tint a model');const c={};vm.createContext(c);vm.runInContext('const lib={'+code+'};this.dispose=lib.disposeInstance;',c);
  let disposed=0;const mat={dispose(){disposed++;}},model={userData:{mats:[mat,mat]},geometry:{dispose(){throw Error('shared geometry disposed');}}};c.dispose(model);c.dispose(model);assert.equal(disposed,1);
});
check('adaptive quality reduces the actual pixel target on high-DPR screens',()=>{
  const c={window:{devicePixelRatio:3},Showcase:{on:false},Q:{dpr:1},renderer:{setPixelRatio(){},setSize(){},domElement:{style:{}}}};vm.createContext(c);
  vm.runInContext('this.pixel={init(){},rt:{setSize(){}},mat:{uniforms:{texel:{value:{set(){}}}}},'+section('  resize(w, h) {','  off() {')+'};',c);
  c.pixel.resize(390,844);const full=c.pixel.w*c.pixel.h;c.Showcase.on=true;c.pixel.resize(390,844);assert(c.pixel.w*c.pixel.h>full);c.Showcase.on=false;c.pixel.resize(390,844);assert.equal(c.pixel.w*c.pixel.h,full);c.Q.dpr=.6;c.pixel.resize(390,844);assert(c.pixel.w*c.pixel.h<full);
});
check('all equipment shapes and rarities use shipped static art without thumbnail rendering',()=>{
  const c={};vm.createContext(c);
  const module=fs.readFileSync(path.join(root,'assets/art/premium-icons.js'),'utf8').replace(/export /g,'');
  vm.runInContext(collectionModule+'\n'+module+'\n'+section('const ITEM_NAMES =','const RARITIES =')+
    section('function itemStyle(it) {','function itemElement(it) {')+
    section('function thumbFor(it) {','const bodyGearCache =')+
    '\nthis.names=ITEM_NAMES;',c);
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/ui/premium-v2/manifest.json'),'utf8'));
  const registered=new Set(manifest.assets.map(a=>'assets/ui/premium-v2/'+a.file));
  const expanded=JSON.parse(fs.readFileSync(path.join(root,'assets/ui/collection-v1/manifest.json'),'utf8'));
  expanded.assets.forEach(a=>registered.add('assets/ui/collection-v1/'+a.file));
  for(const [slot,nouns] of Object.entries(c.names))for(const noun of nouns)for(const rarity of ['common','uncommon','rare','epic','legendary','mythic','ancient','divine']){
    const src=c.thumbFor({slot,name:'Test '+noun,rarity,up:30});
    assert(registered.has(src),src);assert(fs.existsSync(path.join(root,src)),src);
  }
  c.CFG={};vm.runInContext(section('CFG.cases = {','const CASE_MAX ='),c);
  for(const key of c.CFG.caseOrder){const src=c.caseIcon(key);assert(registered.has(src));assert(fs.existsSync(path.join(root,src)));}
  for(const d of ctx.collectionDefs){const src=c.thumbFor({...d,collectionId:d.id});assert(registered.has(src));assert(fs.existsSync(path.join(root,src)));}
  assert.equal(c.thumbFor(null),'');assert.equal(c.equipmentIcon('weapon','unknown'),'');assert.equal(c.caseIcon('unknown'),'');
  assert.equal(registered.size,47);assert(manifest.totalBytes+expanded.totalBytes<3_200_000,'menu icon transfer budget');
});
// Parse all inline JS as modules without resolving or executing CDN imports.
const {spawnSync}=require('node:child_process');
check('inline scripts and premium art modules parse',()=>{
  for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
    if(/importmap|src\s*=/.test(match[1]))continue;
    const r=spawnSync(process.execPath,['--input-type=module','--check'],{input:match[2],encoding:'utf8'});assert.equal(r.status,0,r.stderr);
  }
  for(const file of ['premium-models.js','premium-icons.js','crystal-dragon.js','pet-companions.js','combat-feedback.js']){
    const r=spawnSync(process.execPath,['--input-type=module','--check'],{input:fs.readFileSync(path.join(root,'assets/art',file),'utf8'),encoding:'utf8'});assert.equal(r.status,0,r.stderr);
  }
  const r=spawnSync(process.execPath,['--input-type=module','--check'],{input:collectionModule,encoding:'utf8'});assert.equal(r.status,0,r.stderr);
});
console.log(`${passed} release checks passed.`);
