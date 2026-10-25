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
vm.runInContext(fs.readFileSync(path.join(root,'assets/data/heroes-v6.js'),'utf8').replace(/export /g,''),ctx);
vm.runInContext(section('const CFG = {','// 2. UTIL')+section('const clamp =','// 3. DATA')+
  section('const P = CFG.progression;','const salvageValue =')+
  section('function itemPower(it) {','function bestBagItem(')+
  section('function defaultProfile() {','const Store =')+
  section('function setBrawler(id) {','function artifactSlotsFor(')+
  section('function salvageItem(id) {','const rerollCost =')+
  section('function buyForge(slot) {','// How good an item')+
  section('const FRAME_MS =','  let dt = (now - lastFrame)')+'\n}\n'+
  '\nthis.config=CFG;this.zoneIndex=zoneIndex;this.lootTier=lootTier;this.mxp=mxpFor;this.plan=maxUpgradePlan;this.newProfile=defaultProfile;',ctx);
const make=(id,slot='weapon',rarity='common',ilvl=1,up=0)=>({id,slot,rarity,ilvl,up,name:'Worn Edge',aff:{}});
vm.runInContext(html.split('\n').filter(l=>l.startsWith('const salvageValue =')||l.startsWith('const salvageEssence =')).join('\n'),ctx);
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
ctx.curTier=()=>0;ctx.addEssence=()=>{};ctx.addGold=()=>{};let savedRewardProfile=null;
ctx.saveNow=()=>{savedRewardProfile=JSON.parse(JSON.stringify(ctx.G.profile));};
vm.runInContext(section('CFG.cases = {','// --- Vault:')+section('function highestZone(level) {','// zone odds')+
  section('function grantItem(it, source, context) {','// --- jobs'),ctx);
check('regional boss cases use the killed boss zone and preserve existing rarity odds',()=>{
  const p=fresh();p.level=100;ctx.G.zoneIdx=6;
  for(const [name,kind] of [['Sunny Meadow','boss'],['Frost Peaks','frost'],['Ember Wastes','ember'],['Starfall Ruins','boss'],['Celestial Spire','celestial']]){
    const zone=ctx.zoneIndex(name);assert(zone>0,name);
    ctx.grantItem(make('reward'+zone,'weapon','epic',40),'boss',{zone});const c=p.cases.at(-1);assert.equal(c.k,kind);assert.equal(c.z,ctx.lootTier(zone));assert.equal(c.f,'rare');
    assert.deepEqual(JSON.parse(JSON.stringify(ctx.caseTable(c))),JSON.parse(JSON.stringify(ctx.caseTable({...c,k:'boss'}))));
  }
  assert.equal(ctx.regionBossCase('hunter',2),'hunter');assert.equal(ctx.regionBossCase('rift',6),'rift');assert.equal(Object.keys(p.collection).length,0);
});
check('every earned chest is persisted immediately, including beyond the old 60-chest limit',()=>{
 const p=fresh(),ess=p.essence;const ids=[];
 for(let i=0;i<75;i++){const c=ctx.addCase(i%2?'milestone':'treasure',{l:20,src:'regression'});assert(c);ids.push(c.id);assert(savedRewardProfile.cases.some(x=>x.id===c.id));}
 assert.equal(new Set(ids).size,75);assert.equal(p.essence,ess);assert.equal(ctx.sanitizeProfile(savedRewardProfile).cases.length,75);
});
check('case conversion and preview rolls cannot create phantom collection discoveries',()=>{
  const p=fresh();p.level=100;ctx.G.zoneIdx=0;ctx.grantItem(make('packed','weapon','legendary',36),'monster');assert.equal(p.cases.length,1);assert.equal(p.cases[0].z,ctx.lootTier(ctx.highestZone(100)),'non-boss case scaling follows the best open area');assert.equal(Object.keys(p.collectionLuck).length,0);
  for(let i=0;i<60;i++)ctx.makeItem('weapon','legendary',36);assert.equal(Object.keys(p.collection).length,0);assert.equal(Object.keys(p.collectionLuck).length,0);
  p.collectionLuck['weapon|legendary']=3;
  const it=make('opened','weapon','legendary',36);ctx.grantItem(it,'case');assert.equal(it.collectionId,'sunspike');assert.equal(p.collection.sunspike.count,1);assert(p.bag.includes(it));
  p.collectionLuck['weapon|rare']=3;ctx.grantItem(make('debug','weapon','rare',10),'test');assert.equal(p.collectionLuck['weapon|rare'],3);assert.equal(p.collection.frostbite,undefined);
});
check('opening a saved regional case consumes it once and grants the actual named winner',()=>{
  const p=fresh();p.cases=[{id:'saved-regional',k:'frost',l:40,t:0,z:2,f:'rare'}];
  for(const rarity of ['rare','epic','legendary'])for(const slot of ctx.config.gear.slots)p.collectionLuck[slot+'|'+rarity]=3;
  const r=ctx.openCase('saved-regional','gear');assert(r);assert.equal(p.cases.length,0);assert.equal(p.stats.cases,1);assert(ctx.collectionItem(r.item));assert.equal(Object.keys(p.collection).length,1);assert.equal(r.kept,true);assert.equal(ctx.openCase('saved-regional'),null);
});
check('chests can land on gear, a gold hoard, a resource haul or a hero; geodes are far better than hunter chests',()=>{
  const p=fresh();const seen={gear:0,gold:0,res:0,hero:0};const g0=p.gold;
  for(let i=0;i<400;i++){p.cases=[{id:'pz'+i,k:'boss',l:60,t:0,z:2}];const r=ctx.openCase('pz'+i);assert(r);const k=r.item?'gear':r.prize.prize;seen[k]++;
    if(k==='hero')assert(p.unlocked.attacks.includes(r.prize.id));if(k==='res')assert(r.prize.gems>0);if(k==='gold')assert(r.prize.gold>0);}
  assert(seen.gear>0&&seen.gold>0&&seen.res>0,JSON.stringify(seen));
  const avg=(k)=>{const w=ctx.caseTable({k,l:60,t:0,z:2});let t=0,s=0;for(const r in w){t+=w[r];s+=w[r]*['common','uncommon','rare','epic','legendary','mythic','ancient','divine'].indexOf(r);}return s/t;};
  assert(avg('geode')>avg('hunter')+1,'geode should roll well above a hunter chest');
});
check('full bag still opens a case and keeps the reward (overflow, nothing lost)',()=>{
  const p=fresh();p.bag=Array.from({length:ctx.config.gear.bagMax},(_,i)=>make('full'+i));const ids=p.bag.map(i=>i.id);
  p.cases=[{id:'full-case',k:'treasure',l:40,t:0,z:2,f:'rare'}];savedRewardProfile=null;
  const r=ctx.openCase('full-case','gear');assert(r&&r.kept);assert.equal(p.cases.length,0);assert.equal(p.bag.length,ctx.config.gear.bagMax+1);
  assert(ids.every(id=>p.bag.some(i=>i.id===id)));assert(savedRewardProfile);
});
check('case reward and consumption survive an immediate save reload',()=>{
  const p=fresh();p.settings.autoSalvage=3;p.cases=[{id:'reload-case',k:'treasure',l:40,t:0,z:2,f:'rare'}];
  const result=ctx.openCase('reload-case','gear');assert(result.kept);assert(savedRewardProfile);
  const reloaded=ctx.sanitizeProfile(savedRewardProfile);
  assert.equal(reloaded.cases.length,0);assert(reloaded.bag.some(i=>i.id===result.item.id));assert.equal(reloaded.stats.cases,1);
  ctx.G.profile=reloaded;assert.equal(ctx.openCase('reload-case'),null);
});
check('fast opening never stops on a full bag and later drops cannot evict its rewards',()=>{
  const p=fresh();p.bag=Array.from({length:ctx.config.gear.bagMax-1},(_,i)=>make('existing'+i));
  p.cases=['one','two','three'].map(id=>({id,k:'treasure',l:10,t:0,z:0}));
  const a=ctx.openCase('one','gear'),b=ctx.openCase('two','gear'),c=ctx.openCase('three','gear');assert(a.kept&&b.kept&&c.kept);assert.equal(p.cases.length,0);
  const ids=p.bag.map(i=>i.id);ctx.grantItem(make('powerful','weapon','divine',300),'test');
  assert.deepEqual(p.bag.map(i=>i.id),ids);
});
check('v8 saves move onto the 29-area map: open gates, remapped jobs, no lost progress',()=>{
  const old={...ctx.newProfile(),level:60,savedAt:Date.now()-1000,waypoints:[0,1,2,3],job:{npc:'mira',type:'kill',target:'imp',count:15,progress:4},stats:{...ctx.newProfile().stats,zone:4,kills:999}};delete old.worldVersion;
  const p=ctx.sanitizeProfile(JSON.parse(JSON.stringify(old)));const Z=ctx.config.world.zones;
  assert.equal(p.worldVersion,11);assert.equal(Object.keys(p.secrets).length,0);assert.equal(p.level,60);assert.equal(p.stats.kills,999);
  assert.deepEqual(Array.from(p.waypoints),[0].concat(Array.from(Z.map((z,i)=>i).filter(i=>i>0&&Z[i].minLevel<=60))));
  assert.equal(Z[p.stats.zone].name,'Grumbling Descent');assert.equal(p.job.target,'craggoat');assert.equal(p.job.progress,4);
  const again=ctx.sanitizeProfile(JSON.parse(JSON.stringify(p)));assert.deepEqual(Array.from(again.waypoints),Array.from(p.waypoints));
  const fresh2=ctx.sanitizeProfile(JSON.parse(JSON.stringify(ctx.newProfile())));assert.deepEqual(Array.from(fresh2.waypoints),[0]);
  assert.equal(Z.length,30);assert(Z.every((z,i)=>!i||Math.abs(z.col-Z[i-1].col)+Math.abs(z.row-Z[i-1].row)===1),'the main path walks area to neighbouring area');
  // v11 open world: the Main Path starts at the highest area your level reaches; gates up to your level are open
  assert.equal(Z[p.quest.ch].name,'Grumbling Descent');assert.equal(p.quest.step,0);
  for(const e of ctx.config.world.edges)if(e.warden)assert.equal(!!p.gates[e.id],e.lvl<=60,e.id);
  assert(p.visited.includes(4)&&p.visited.includes(0));assert.equal(fresh2.quest.ch,1);assert.equal(Object.keys(fresh2.gates).length,0);assert.equal(Z.at(-1).lvl[1],210);
  for(const z of Z.slice(1)){assert(ctx.config.enemies[z.enemy]&&ctx.config.enemies[z.alt],z.name);}
});
check('Bastion Siege fort saves: old pads move onto the grid, known types, levels 1-15, whole stones, a builder hut',()=>{
  const p=ctx.sanitizeProfile(JSON.parse(JSON.stringify(ctx.newProfile())));assert.equal(p.fort.b.map(b=>b.t).join(),'hut');assert.equal(p.fort.stones,0);assert.equal(p.fort.wave,1);
  const bad=ctx.sanitizeProfile(JSON.parse(JSON.stringify({...ctx.newProfile(),records:{bestSiege:6},fort:{stones:-5.5,pads:[{t:'archer',l:3},{t:'laser',l:2},{t:'cannon',l:99},null,{t:'warrior',l:0},'x',{t:'ballista',l:1},{t:'archer',l:2},{t:'archer',l:4}]}})));
  assert.equal(bad.fort.stones,0);assert.equal(bad.fort.b.map(b=>b.t+b.l).join(),'archer3,cannon15,ballista1,archer2,hut1');assert.equal(bad.fort.wave,7,'restart one past the best wave');
  assert.equal(ctx.sanitizeProfile(JSON.parse(JSON.stringify(bad))).fort.b.map(b=>b.t+b.l+':'+b.x+','+b.z).join(),bad.fort.b.map(b=>b.t+b.l+':'+b.x+','+b.z).join(),'stable on the next load');
  assert.equal(ctx.sanitizeProfile(JSON.parse(JSON.stringify({...ctx.newProfile(),fort:[1,2]}))).fort.b.map(b=>b.t).join(),'hut');
});
check('v9 saves move onto the widened v10 map: indices kept, secrets/POIs/dungeons added, found secrets survive',()=>{
  const old={...ctx.newProfile(),level:80,savedAt:Date.now()-1000,worldVersion:9,waypoints:[0,3,7],stats:{...ctx.newProfile().stats,zone:7,kills:5}};delete old.secrets;delete old.pois;delete old.dungeons;
  const p=ctx.sanitizeProfile(JSON.parse(JSON.stringify(old)));
  assert.equal(p.worldVersion,11);assert.deepEqual(Array.from(p.waypoints),[0,3,7]);assert.equal(p.stats.zone,7);
  for(const k of ['secrets','pois','dungeons'])assert(p[k]&&typeof p[k]==='object'&&!Array.isArray(p[k]),k);
  p.secrets['a01:secret:0']=123;const again=ctx.sanitizeProfile(JSON.parse(JSON.stringify(p)));assert.equal(again.secrets['a01:secret:0'],123);assert.equal(again.worldVersion,11);
  const bad=ctx.sanitizeProfile(JSON.parse(JSON.stringify({...p,secrets:[1],dungeons:null})));assert.equal(Object.keys(bad.secrets).length,0);assert.equal(Object.keys(bad.dungeons).length,0);
  assert.equal(ctx.newProfile().worldVersion,11);
});
check('one skill tree per hero: 9 branches, no overlapping nodes, v8 hero tree merges into every hero',()=>{
  const C=ctx.config;assert.equal(C.heroTree,undefined);
  for(const id in C.brawlerTrees){const N=C.brawlerTrees[id],ids=Object.keys(N);
    for(const b of ['pow','might','carn','rhy','swift','storm','uti','fort','sorc'])assert(N[b+'_c0'],id+' '+b);
    for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const a=N[ids[i]],c=N[ids[j]];assert(Math.hypot(a.x-c.x,a.y-c.y)>1.2,id+' '+ids[i]+'~'+ids[j]);}
    for(const n of Object.values(N))for(const l of n.links)assert(N[l]&&N[l].links.includes(n.id));}
  const old={...ctx.newProfile(),level:40,mastery:{'w:wrenna':1e9},cls:'wrenna',brawlers:{wrenna:{tree:{active:0,sets:[{core:2,pow_c0:3},{},{}]},artifacts:[]},hob:{tree:{active:1,sets:[{},{rhy_c0:1},{}]},artifacts:[]}},
    heroTree:{active:0,sets:[{core:5,might_c0:5,r0:2},{fort_c0:1},{}]}};delete old.treeVersion;
  const p=ctx.sanitizeProfile(JSON.parse(JSON.stringify(old)));
  assert.equal(p.heroTree,undefined);assert.equal(p.treeVersion,9);
  assert.deepEqual({...p.brawlers.wrenna.tree.sets[0]},{core:7,pow_c0:3,might_c0:5,r0:2});assert.deepEqual({...p.brawlers.hob.tree.sets[1]},{rhy_c0:1,fort_c0:1});
  const again=ctx.sanitizeProfile(JSON.parse(JSON.stringify(p)));assert.deepEqual({...again.brawlers.wrenna.tree.sets[0]},{core:7,pow_c0:3,might_c0:5,r0:2});
  vm.runInContext(section('const levelPointsTotal =','function nodeOpen(')+'\nthis.treeOf=treeOf;this.treeFree=treeFree;',ctx);
  ctx.G.profile=p;const T=ctx.treeOf(p,'wrenna');assert.equal(T.total,T.level+T.mastery);assert.equal(T.level,2*40+5*4);assert(ctx.treeFree(p,'wrenna')>=0);
  assert.equal(ctx.treeOf(p,'hob').level,T.level);
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
  const p=fresh();p.unlocked.attacks=['hob'];ctx.ownedBrawlers=p=>['wrenna',...p.unlocked.attacks];p.mastery['w:wrenna']=ctx.mxp(80)-1;
  assert.equal(ctx.masteryLevel(p.mastery['w:wrenna']),79);assert.equal(ctx.setBrawler('hob'),false);assert.equal(p.cls,'wrenna');
  p.mastery['w:wrenna']=ctx.mxp(80);assert.equal(ctx.setBrawler('hob'),true);assert.equal(p.cls,'hob');assert.equal(ctx.setBrawler('corrin'),false);
  ctx.G.mode='arena';assert.equal(ctx.setBrawler('wrenna'),false);ctx.G.mode='hub';ctx.onExpedition=()=>true;assert.equal(ctx.setBrawler('wrenna'),false);ctx.onExpedition=()=>false;
});
check('retired adventurers hand over to the starter hero with their mastery',()=>{
  const old=fresh();old.cls='smg';old.starterBrawler='bolt';old.mastery={'w:bolt':ctx.mxp(85)};old.brawlers={smg:ctx.newBrawlerState()};
  const p=ctx.sanitizeProfile(old);assert.equal(p.cls,'wrenna');assert.equal(p.starterBrawler,'wrenna');assert.equal(p.mastery['w:wrenna'],ctx.mxp(85));
  assert(!ctx.config.brawlerOrder.includes('bolt'));assert.equal(ctx.config.brawlerOrder.length,27);
});
check('old saves retain current hero and inventory; auto salvage migration happens once',()=>{
  const old=fresh();old.cls='hob';delete old.starterBrawler;delete old.mergeVersion;old.brawlers.hob=ctx.newBrawlerState();old.settings.autoSalvage=2;old.bag=[Object.assign(make('locked'),{locked:true})];
  const p=ctx.sanitizeProfile(old);assert.equal(p.starterBrawler,'hob');assert.equal(p.cls,'hob');assert.equal(p.settings.autoSalvage,0);assert.equal(p.bag[0].locked,true);
  p.settings.autoSalvage=2;assert.equal(ctx.sanitizeProfile(p).settings.autoSalvage,2);
  assert.doesNotThrow(()=>ctx.sanitizeProfile({v:2,gear:null,brawlers:{hob:null}}));
});
check('120 Hz is standard; the 60 FPS switch keeps a player\'s earlier choice',()=>{
  const n=ctx.sanitizeProfile(fresh());assert.equal(n.settings.fps60,false);assert(!('hz120' in n.settings));
  const pre=fresh();pre.settings.hz120=false;delete pre.hzVersion;assert.equal(ctx.sanitizeProfile(pre).settings.fps60,false); // off from before 120 Hz was the default: now 120
  const chose=fresh();chose.settings.hz120=false;chose.hzVersion=1;assert.equal(ctx.sanitizeProfile(chose).settings.fps60,true); // turned 120 Hz off on purpose: keeps 60
  const p=ctx.sanitizeProfile(fresh());p.settings.fps60=true;assert.equal(ctx.sanitizeProfile(JSON.parse(JSON.stringify(p))).settings.fps60,true);
  const d=ctx.defaultProfile();d.settings.fps60=true;assert.equal(ctx.sanitizeProfile(JSON.parse(JSON.stringify(d))).settings.fps60,true); // a brand-new save (never sanitized) keeps 60 FPS too
});
check('60 Hz and 120 Hz schedulers preserve cadence on 60/90/120/144/165 Hz displays',()=>{
  const prefix=section('  if (now < nextFrameAt','  let dt =');
  { // a 120 Hz screen whose timestamps jitter by up to 0.8 ms keeps every frame at the 120 cap
    const c={ms:1000/120,hz120:true,nextFrameAt:0,count:0};vm.createContext(c);vm.runInContext('function tick(now){'+prefix+'count++;}',c);
    for(let i=0;i<1200;i++)c.tick(i*1000/120+(i%2?0.8:-0.8)+0.8);assert(c.count>=1195,`jittery 120 Hz: ${c.count}`);}
  for(const cap of [60,120])for(const hz of [60,90,120,144,165]){const c={ms:1000/cap,hz120:cap===120,nextFrameAt:0,count:0};vm.createContext(c);vm.runInContext('function tick(now){'+prefix+'count++;}',c);for(let i=0;i<hz*10;i++)c.tick(i*1000/hz);const want=Math.min(cap,hz)*10;assert(Math.abs(c.count-want)<=1,`${cap} cap, ${hz} Hz: ${c.count}`);}
});
check('instance disposal frees owned materials once and retains shared resources',()=>{
  const code=section('  disposeInstance(model) {','  // tint a model');const c={};vm.createContext(c);vm.runInContext('const lib={'+code+'};this.dispose=lib.disposeInstance;',c);
  let disposed=0,boneTextures=0;const mat={dispose(){disposed++;}},skeleton={texture:true,dispose(){if(this.texture){boneTextures++;this.texture=false;}}},model={userData:{mats:[mat,mat]},geometry:{dispose(){throw Error('shared geometry disposed');}},traverse(fn){fn({isSkinnedMesh:true,skeleton});fn({isSkinnedMesh:true,skeleton});}};c.dispose(model);c.dispose(model);assert.equal(disposed,1);assert.equal(boneTextures,1);
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
    section('function thumbFor(it) {','function flashMaterial()')+
    '\nthis.names=ITEM_NAMES;',c);
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/ui/premium-v2/manifest.json'),'utf8'));
  const registered=new Set(manifest.assets.map(a=>'assets/ui/premium-v2/'+a.file));
  const expanded=JSON.parse(fs.readFileSync(path.join(root,'assets/ui/collection-v1/manifest.json'),'utf8'));
  expanded.assets.forEach(a=>registered.add('assets/ui/collection-v1/'+a.file));
  for(const [slot,nouns] of Object.entries(c.names))for(const noun of nouns)for(const rarity of ['common','uncommon','rare','epic','legendary','mythic','ancient','divine']){
    const src=c.thumbFor({slot,name:'Test '+noun,rarity,up:30});
    assert(registered.has(src),src);assert(fs.existsSync(path.join(root,src)),src);
  }
  c.CFG={};vm.runInContext(section('CFG.cases = {','const CASE_LUCK ='),c);
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
check('index.html is built from the current src/',()=>{
  const r=require('node:child_process').spawnSync(process.execPath,[path.join(__dirname,'build.cjs'),'--check'],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);
});
console.log(`${passed} release checks passed.`);
