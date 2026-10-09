// Run the real persistence/progression code in isolated normal and test sessions.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const section=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b,i+a.length);assert(i>=0&&j>i,a);return html.slice(i,j);};
const moduleText=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/export /g,'');
let passed=0;async function check(name,fn){await fn();passed++;console.log('PASS '+name);}
function session(test,storage=new Map()){
  const events=[],c={TEST_MODE:test,LOCAL_PREVIEW:false,Date,console,URL,URLSearchParams,
    btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary'),escape,unescape,
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    G:{profile:null,player:{mods:{},alive:true},mode:'hub',started:true,modal:false,levelRewards:[]},Cloud:{doc:null,state:'off',lastPush:0,pushing:false},
    MP:{roomState:'connecting',dbState:'connecting'},window:{},refreshPlayerStats(){},powerOf:()=>1,ev:e=>events.push(e),
    milestoneAt:()=>null,rollRarity:()=> 'common',grantItem(){},addEssence(){},dropShards(){},addCase(){},checkAchievements(){},masteryBonus:()=>0};
  vm.createContext(c);
  for(const file of ['test-mode','loot-collection','prestige','companions'])vm.runInContext(moduleText('assets/data/'+file+'.js'),c);
  vm.runInContext(section('const CFG = {','// 2. UTIL')+section('const clamp =','// 3. DATA')+
    section('const P = CFG.progression;','const salvageValue =')+
    section('const SAVE_KEY =','// --- skill trees')+
    section('function progressionXpMultiplier(','// --- loot')+
    section('function saveCodeOf(','function openSaveCode()')+
    section('function saveNow(force)','function applyProfile(')+
    section('async function cloudInit()','function startGame()')+
    section('async function mpInit()','function mpClear()')+
    section('function awardPetCombatXp(','function stepPetCombat(')+
    section('const TestTools =','// 6. RENDER')+'\nthis.store=Store;this.tools=TestTools;this.cap=P.cap;this.events=events;',Object.assign(c,{events}));
  c.G.profile=c.store.load()||c.defaultProfile();return c;
}
(async()=>{
  await check('only explicit test=100 enables the mode and return URLs preserve other parameters',()=>{
    const c=session(false);for(const q of ['', '?test=1','?test=1000','?test=true'])assert.equal(c.isTestMode(q),false);
    assert.equal(c.isTestMode('?v=abc&test=100'),true);
    const url=c.testModeUrl('https://example.com/game/?v=abc',true);assert.equal(new URL(url).searchParams.get('test'),'100');
    const back=c.testModeUrl(url,false);assert.equal(new URL(back).searchParams.has('test'),false);assert.equal(new URL(back).searchParams.get('v'),'abc');
  });
  await check('first test run copies the normal hero without changing its stored bytes',()=>{
    const storage=new Map(),normal=session(false,storage);normal.G.profile.level=22;normal.G.profile.gold=8470;normal.G.profile.bag=[{id:'kept',locked:true}];normal.store.save(normal.G.profile);
    const bytes=storage.get(normal.profileSaveKey(false)),test=session(true,storage);assert.equal(test.G.profile.level,22);assert.equal(test.G.profile.gold,8470);assert.equal(test.G.profile.bag[0].locked,true);assert.equal(test.G.profile.settings.autoHunt,false);assert(test.isTestProfile(test.G.profile));
    test.G.profile.level=200;test.store.save(test.G.profile);assert.equal(storage.get(normal.profileSaveKey(false)),bytes);
    assert.equal(session(true,storage).G.profile.level,200);assert.equal(session(false,storage).G.profile.level,22);
    test.store.clear();assert.equal(storage.get(normal.profileSaveKey(false)),bytes);
  });
  await check('real hero and mastery XP are exactly 100x; normal gold and level caps remain intact',()=>{
    for(const mode of [false,true]){const c=session(mode),p=c.G.profile;c.addXp(3,'combat');assert.equal(c.events.find(e=>e.t==='xp').amt,mode?300:3);
      c.addMastery('w:bolt',7);assert.equal(p.mastery['w:bolt'],mode?700:7);c.addGold(10,true);assert.equal(p.gold,10);
      p.level=c.cap;p.xp=0;c.addXp(1e15,'combat');assert.equal(p.level,c.cap);assert.equal(p.xp,0);}
  });
  await check('real equipped-pet reward gets 100x without truncating a multiplied boss reward',()=>{
    for(const mode of [false,true]){const c=session(mode),p=c.G.profile;p.prestige=4;c.migratePets(p);c.awardPetCombatXp(550);let xp=p.pets.crystal.xp;
      for(let level=1;level<p.pets.crystal.level;level++)xp+=c.petXpToNext(level);assert.equal(xp,mode?55000:550);assert.equal(p.pets.bull.level,1);assert.equal(p.pets.crystal.kills,1);}
  });
  await check('test saves stay local and cannot initialize cloud or multiplayer services',async()=>{
    const c=session(true);let calls=0;c.Cloud.doc={set(){calls++;return Promise.resolve();}};c.window.claude={use(){calls++;throw Error('Network requested');}};
    c.saveNow(true);await c.cloudInit();await c.mpInit();assert.equal(calls,0);assert.equal(c.Cloud.state,'off');assert.equal(c.MP.roomState,'off');assert.equal(c.MP.dbState,'off');
    assert(c.isTestProfile(JSON.parse(c.localStorage.getItem(c.profileSaveKey(true)))));
  });
  await check('normal saves still synchronize and test backups are rejected in normal play',async()=>{
    const normal=session(false),test=session(true);let calls=0;normal.Cloud.doc={set(){calls++;return Promise.resolve();}};
    normal.saveNow(true);await Promise.resolve();assert.equal(calls,1);
    const code=test.saveCodeOf(test.G.profile);assert.equal(normal.parseSaveCode(code),null);assert(test.parseSaveCode(code));
    assert(test.isTestProfile(test.parseSaveCode(normal.saveCodeOf(normal.G.profile))));
    const before=normal.localStorage.getItem(normal.profileSaveKey(false));normal.store.save(test.G.profile);assert.equal(normal.localStorage.getItem(normal.profileSaveKey(false)),before);
    normal.G.profile=test.G.profile;normal.saveNow(true);assert.equal(calls,1);
  });
  await check('testing shortcuts grant one, five or 100 levels through the actual level reward path',()=>{
    const c=session(true);c.G.player.mods.xpFind=.25;c.tools.levelUp();assert.equal(c.G.profile.level,2);c.tools.levels5();assert.equal(c.G.profile.level,7);c.tools.levels100();assert.equal(c.G.profile.level,107);
  });
  await check('overlapping forced cloud saves serialize and send the latest reward snapshot',async()=>{
    const c=session(false),sent=[],resolves=[];
    c.Cloud.doc={set(data){sent.push(JSON.parse(data.profile));return new Promise(resolve=>resolves.push(resolve));}};
    c.saveNow(true);c.G.profile.bag.push({id:'reward-one'});c.saveNow(true);c.G.profile.bag.push({id:'reward-two'});c.saveNow(true);
    assert.equal(sent.length,1);assert.equal(c.Cloud.pending,true);
    assert.equal(JSON.parse(c.localStorage.getItem(c.profileSaveKey(false))).bag.length,2);
    resolves.shift()();await new Promise(r=>setImmediate(r));assert.equal(sent.length,2);assert.equal(sent[1].bag.length,2);
    resolves.shift()();await new Promise(r=>setImmediate(r));assert.equal(c.Cloud.pushing,false);assert.equal(c.Cloud.pending,false);
  });
  await check('a delayed cloud load cannot replace a newly earned local reward',async()=>{
    const c=session(false);let finish;const old=JSON.parse(JSON.stringify(c.G.profile));old.savedAt=1;
    c.window.claude={use:async name=>name==='user'?{id:async()=> 'test'}:{doc:()=>({get:()=>new Promise(r=>finish=r),set:()=>Promise.resolve()})}};
    const load=c.cloudInit();await new Promise(r=>setImmediate(r));c.G.profile.bag.push({id:'fresh-reward'});c.saveNow(true);
    finish({exists:true,data:()=>({profile:JSON.stringify(old)})});await load;assert.equal(c.G.profile.bag[0].id,'fresh-reward');
  });
  console.log(`${passed} test-mode checks passed.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
