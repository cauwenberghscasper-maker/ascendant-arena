const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const moduleText=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/export /g,'');
function section(a,b){const i=html.indexOf(a),j=html.indexOf(b,i+a.length);assert(i>=0&&j>i,a);return html.slice(i,j);}
let passed=0;function check(name,test){test();passed++;console.log('PASS '+name);}
const c={console,Math,Number,JSON};vm.createContext(c);
vm.runInContext(moduleText('assets/data/companions.js')+'\n'+moduleText('assets/data/prestige.js')+'\nthis.defs=PET_DEFS;',c);
function profile(prestige=4){const p={prestige,level:200,xp:20,heroTree:{active:0,sets:[{a:4},{},{}]},road:200,worldTier:3,waypoints:[0,1,2],job:{id:3},jobCycle:{a:1},gear:{weapon:{id:'kept'}},bag:[{id:'locked',locked:true}],mastery:{bolt:100},gold:99};c.migratePets(p);return p;}
check('legacy and malformed saves migrate safely without unlocking unearned pets',()=>{
  const old={prestige:0,pets:{crystal:{level:99,xp:10}},activePet:'crystal'};c.migratePets(old);assert.equal(old.activePet,null);assert.equal(Object.keys(old.pets).length,0);
  const p={prestige:4,pets:{crystal:{level:Infinity,xp:NaN,kills:-1},bull:{level:5,xp:999999},slime:{level:99,xp:999},unknown:{level:99}},activePet:'unknown'};
  c.migratePets(p);assert.equal(p.pets.crystal.level,1);assert.equal(p.pets.crystal.xp,0);assert.equal(p.pets.bull.xp,c.petXpToNext(5)-1);assert.equal(p.pets.slime.xp,0);assert.equal(Object.keys(p.pets).length,4);const saved=JSON.stringify(p);c.migratePets(p);assert.equal(JSON.stringify(p),saved);
  assert.equal(c.choosePet(profile(1),'bull'),false);assert.equal(c.choosePet(p,'__proto__'),false);
});
check('pet XP levels only the equipped pet and survives switching and a save round trip',()=>{
  const p=profile();const need=c.petXpToNext(1);assert.equal(c.grantPetXp(p,need+7).levels,1);assert.equal(p.pets.crystal.level,2);assert.equal(p.pets.crystal.xp,7);assert.equal(p.pets.bull.level,1);
  c.choosePet(p,'bull');c.grantPetXp(p,need);assert.equal(p.pets.bull.level,2);c.choosePet(p,'crystal');assert.equal(c.petProgress(p).level,2);
  const restored=JSON.parse(JSON.stringify(p));c.migratePets(restored);assert.equal(JSON.stringify(restored),JSON.stringify(p));
  const snap=JSON.stringify(p);for(const bad of [NaN,Infinity,-1,1.2,'100'])c.grantPetXp(p,bad);assert.equal(JSON.stringify(p),snap);
});
check('level 99 caps XP and prestige preserves training, gear and currency atomically',()=>{
  const p=profile();p.pets.crystal={level:98,xp:c.petXpToNext(98)-1,kills:10};c.grantPetXp(p,10000);assert.equal(p.pets.crystal.level,99);assert.equal(p.pets.crystal.xp,0);
  const pets=JSON.stringify(p.pets),gear=JSON.stringify(p.gear),bag=JSON.stringify(p.bag),plan=c.prestigePlan(p);
  p.xp++;assert.equal(c.applyPrestige(p,plan),false);assert.equal(p.level,200);p.xp--;
  assert.equal(c.applyPrestige(p,plan),true);c.migratePets(p);assert.equal(p.level,1);assert.equal(p.prestige,5);assert.equal(JSON.stringify(p.pets),pets);assert.equal(JSON.stringify(p.gear),gear);assert.equal(JSON.stringify(p.bag),bag);assert.equal(p.gold,99);assert.equal(c.applyPrestige(p,plan),false);
});
check('prestige requires level 200, town and a safe world session',()=>{
  const p=profile(),context={mode:'hub',alive:true,inTown:true};assert.equal(c.prestigeBlock(p,context),'');
  for(const change of [{mode:'arena'},{rift:true},{shrine:true},{alive:false},{inCombat:true},{inTown:false}])assert(c.prestigeBlock(p,{...context,...change}));p.level=199;assert(c.prestigeBlock(p,context));
});
check('training improves bounded attacks and bonuses; arena and locked profiles get none',()=>{
  for(const id of Object.keys(c.defs)){const p=profile();c.choosePet(p,id);const a=c.petAttackSpec(p),b=c.petBonuses(p);p.pets[id].level=99;const strong=c.petAttackSpec(p),trained=c.petBonuses(p);assert(strong.mult>a.mult);assert(strong.cooldown<a.cooldown);assert(strong.targets<=3);assert(strong.cooldown>=1);assert(trained.damage>b.damage);assert(trained.damage<.1);assert(trained.hp<.2);assert.equal(c.petBonuses(p,'arena').damage,0);assert.equal(c.petBonuses(p,'arena').hp,0);}
  assert.equal(c.petAttackSpec(profile(0)),null);
});
const player={id:1,x:0,z:0,facing:0,team:'hero',kind:'fighter',alive:true,isPlayer:true,dmg:100,hp:50,maxHp:100,keys:{storm:true},ks:{},arts:{reaper:1},lifesteal:1};
const enemy=(id,x=.85,z=1)=>({id,x,z,kind:'enemy',alive:true,hp:1000,maxHp:1000,team:'mob',r:.5,state:'chase',type:'slime',tagged:false});
check('targets skip idle, dead, returning, retreating, distant and obstructed enemies',()=>{
  const origin={x:0,z:0},valid=enemy(9,2,1),list=[{...enemy(2),state:'idle'}, {...enemy(3),alive:false}, {...enemy(4),state:'return',tagged:true},{...enemy(5),retreat:0},{...enemy(6),x:20}];
  assert.equal(c.findPetTarget([...list,valid],null,player,origin,10,()=>true),valid);assert.equal(c.findPetTarget([valid],null,player,origin,10,()=>false),null);
  const boss={...enemy(7),kind:'boss',state:undefined,dmgBy:{1:1}};assert.equal(c.findPetTarget([],boss,player,origin,10,()=>true),boss);
});
let rewards=0,ended=0,blocked=false,town=false,refreshes=0,events=[];
Object.assign(c,{TEST_MODE:false,G:{profile:profile(1),player,mode:'hub',started:true,modal:false,paused:false,menuSafe:0,time:0,enemies:[],boss:null,ents:new Map([[1,player]])},
  CFG:{combat:{variance:0,hitFlash:.1,critChance:1,critMult:99},world:{enemyRespawn:5,eliteRespawn:5,denRespawn:5}},
  inTown:()=>town,rayLen:(x,z,a,d)=>({d:blocked?0:d}),ev:e=>events.push(e),markCombat(){},refreshPlayerStats(){refreshes++;},
  rewardEnemyKill(){rewards++;c.awardPetCombatXp(50);},endBoss(){ended++;c.G.boss=null;},angDiff:(a,b)=>b-a,clamp:(n,a,b)=>Math.min(b,Math.max(a,n)),
  obstacleAt:()=>null,AC:{x:0,z:0},onHitProcs(){throw Error('Pet triggered hero gear procs');},artVal(){throw Error('Pet triggered hero artifacts');},slayerBonus(){throw Error('Pet triggered hero mastery');}});
vm.runInContext(section('const PROJ_MAX =','function obstacleAt(')+section('function forEachTarget(fn) {','function projColor(')+
  section('function stepProjectiles(dt) {','function chainFrom(')+section('function expireProjectile(p,','function aoeDamage(')+
  section('function dealDamage(t,','// keystone and artifact')+section('function killEntity(t,','// --- fighter step')+
  section('const PetCombat =','// --- testing tools')+'\nthis.pool=projectiles;this.petRuntime=PetCombat;',c);
check('ranged pet fires on cooldown and hits using the real projectile pool',()=>{
  const t=enemy(2);c.G.enemies=[t];c.G.ents.set(2,t);for(let i=0;i<180;i++){c.G.time+=1/60;c.stepPetCombat(1/60);c.stepProjectiles(1/60);}assert(t.hp<1000);const shots=events.filter(e=>e.t==='petAttack');assert(shots.length>=2&&shots.length<=3);assert(c.pool.filter(p=>p.active&&p.pet).length<=1);assert.equal(player.hp,50,'pet must not grant hero lifesteal');
});
check('pet kill is rewarded once; boss damage is credited to the hero without gear procs',()=>{
  const t=enemy(3);t.hp=1;c.dealDamage(t,30,1,{pet:true,proc:true,canCrit:false});c.dealDamage(t,30,1,{pet:true,proc:true,canCrit:false});assert.equal(rewards,1);assert.equal(t.alive,false);assert.equal(c.G.profile.pets.crystal.level,2);assert.equal(refreshes,1);
  const boss={...enemy(4),kind:'boss',hp:1000,total:0,dmgBy:{}};c.G.boss=boss;c.dealDamage(boss,30,1,{pet:true,proc:true,canCrit:false});assert.equal(boss.dmgBy[1],30);assert.equal(boss.total,30);assert.equal(ended,0);assert.equal(events.filter(e=>e.t==='hit').at(-1).crit,false);
});
check('menus, town, death, pause and Showdown stop shots and cancel in-flight pet bolts',()=>{
  for(const change of [{modal:true},{mode:'arena'},{paused:true},{menuSafe:1}]){Object.assign(c.G,change);c.spawnProjectile({x:0,z:0,vx:0,vz:1,life:1,r:.2,dmg:1,pet:true});const before=events.length;c.stepPetCombat(1/60);c.stepProjectiles(1/60);assert.equal(c.pool.filter(p=>p.active&&p.pet).length,0);assert.equal(events.length,before);Object.assign(c.G,{mode:'hub',modal:false,paused:false,menuSafe:0});}
  town=true;assert.equal(c.petMayFight(),false);town=false;player.alive=false;assert.equal(c.petMayFight(),false);player.alive=true;
});
check('bull slam caps splash at three and respects walls and full pools',()=>{
  c.G.profile=profile(2);c.choosePet(c.G.profile,'bull');const targets=Array.from({length:7},(_,i)=>enemy(10+i,.85+i*.05,1));c.G.enemies=targets;c.G.boss=null;c.stepPetCombat(.5);assert.equal(targets.filter(t=>t.hp<1000).length,3);
  blocked=true;const before=targets.reduce((sum,t)=>sum+t.hp,0);for(let i=0;i<5;i++)c.stepPetCombat(1);assert.equal(targets.reduce((sum,t)=>sum+t.hp,0),before);blocked=false;
  c.choosePet(c.G.profile,'crystal');for(const p of c.pool){p.active=true;p.pet=false;}const attacks=events.filter(e=>e.t==='petAttack').length;c.stepPetCombat(.5);assert.equal(events.filter(e=>e.t==='petAttack').length,attacks);assert.equal(c.pool.length,520);
  c.pool[0].active=false;c.spawnProjectile({x:0,z:0,vx:0,vz:0,life:1,r:.2,dmg:1,pet:true});c.pool[0].active=false;for(const p of c.pool)p.active=true;c.pool[0].active=false;const reused=c.spawnProjectile({x:0,z:0,vx:0,vz:0,life:1,r:.2,dmg:1});assert.equal(reused.pet,false);
});
check('animated numbers respect reduced motion and a bounded priority pool',()=>{
  const d={Math,G:{profile:{settings:{calm:false}}},fmtK:n=>String(n),project:()=>[100,100],dmgPool:Array.from({length:44},()=>({el:{style:{}},life:0}))};vm.createContext(d);
  vm.runInContext(moduleText('assets/art/combat-feedback.js')+'\n'+section('function dmgNumber(','function updateTags()'),d);
  for(let i=0;i<44;i++)d.dmgNumber(0,1,0,100+i,'crit');d.dmgNumber(0,1,0,999,'pet mine');assert.equal(d.dmgPool.length,44);assert(!d.dmgPool.some(n=>n.el.textContent==='999'));
  d.updateDmgNumbers(2);assert(d.dmgPool.every(n=>n.el.hidden));d.G.profile.settings.calm=true;d.dmgNumber(0,1,0,12.8,'pet mine');d.updateDmgNumbers(.1);assert.equal(d.dmgPool[0].el.textContent,'13');assert(d.dmgPool[0].el.style.transform.includes('scale(1.000)'));
  assert.equal(d.damageMotion(1,1,true,true).opacity,0);assert.equal(d.damageMotion(1,1,true,true).rise,12);
});
console.log(`${passed} companion checks passed.`);
