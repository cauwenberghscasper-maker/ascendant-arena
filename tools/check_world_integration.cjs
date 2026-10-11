const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1280,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8766/');await page.waitForFunction(()=>window.__gameBooted,null,{timeout:60000});await page.locator('#playBtn').click();
 const coverage=await page.evaluate(()=>{
  const g=__game,w=__sim.CFG.world,step=1.5,pad=.6,nx=Math.floor((w.maxX-w.minX)/step)+1,nz=Math.floor((w.maxZ-w.minZ)/step)+1;
  const blocked=new Uint8Array(nx*nz),visited=new Uint8Array(nx*nz),queue=new Int32Array(nx*nz);
  // Conservative cell clearance leaves room for the player's collision body along edges.
  for(const o of g.hubObstacles.list){const r=o.r+pad+step*.5;
   for(let z=Math.max(0,Math.floor((o.z-r-w.minZ)/step));z<=Math.min(nz-1,Math.ceil((o.z+r-w.minZ)/step));z++)
    for(let x=Math.max(0,Math.floor((o.x-r-w.minX)/step));x<=Math.min(nx-1,Math.ceil((o.x+r-w.minX)/step));x++)
     if(Math.hypot(w.minX+x*step-o.x,w.minZ+z*step-o.z)<r)blocked[z*nx+x]=1;
  }
  const cell=(x,z)=>Math.round((z-w.minZ)/step)*nx+Math.round((x-w.minX)/step);
  let begin=0,end=0;const start=cell(w.spawn.x,w.spawn.z);queue[end++]=start;visited[start]=1;
  while(begin<end){const i=queue[begin++],x=i%nx,z=Math.floor(i/nx);for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,zz=z+dz,n=zz*nx+xx;if(xx<0||zz<0||xx>=nx||zz>=nz||visited[n]||blocked[n])continue;visited[n]=1;queue[end++]=n}}
  const unreachable=[],invalid=[];
  for(const e of g.enemies){if(!__sim.enemySpawnClear(e,e.hx,e.hz,false))invalid.push(e.id);let reachable=false;
   for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const x=e.hx+dx*step,z=e.hz+dz*step;if(visited[cell(x,z)]&&g.hubObstacles.list.every(o=>Math.hypot(e.hx-o.x,e.hz-o.z)>o.r+pad))reachable=true}
   if(!reachable)unreachable.push({id:e.id,x:e.hx,z:e.hz});
  }
  const zones=w.zones.map((_,i)=>({zone:i,patrols:g.enemies.filter(e=>e.zone===i&&e.patrol!=null).length,total:g.enemies.filter(e=>e.zone===i).length}));
  return {population:g.enemies.length,obstacles:g.hubObstacles.list.length,reachableCells:end,zones,unreachable,invalid};
 });assert.deepEqual(coverage.invalid,[]);assert.deepEqual(coverage.unreachable,[]);assert(coverage.zones.every(z=>z.patrols===48));
 const combat=await page.evaluate(()=>{
  const g=__game,s=__sim,p=g.profile,pl=g.player,result=[];p.settings.autoHunt=false;p.settings.bots=false;p.settings.fastXp=false;g.modal=false;g.bossTimer=1e9;g.boss=null;g.shrines=[];g.hubFighters=[pl];
  for(const level of [1,5,10,25,50,100,200]){
   p.level=level;p.xp=0;p.gear=Object.fromEntries(s.CFG.gear.slots.map(slot=>{const it=s.makeItem(slot,'uncommon',level);it.aff={};return [slot,it]}));s.refreshPlayerStats(true);s.initHubWorld();g.pellets=[];g.events=[];
   const e=g.enemies.find(e=>e.zone===0&&e.patrol===26);e.type='slime';e.r=s.CFG.enemies.slime.r;s.setEnemyLevel(e,Math.max(1,level-4));
   const x=e.hx,z=e.hz;Object.assign(pl,{x:x+1.4,z,alive:true,hp:pl.maxHp,invulnT:0,lastHurt:g.time});Object.assign(e,{x,z,state:'chase',atkCd:0});g.enemies=[e];g.modal=false;g.menuSafe=0;pl.intent.mx=pl.intent.mz=0;pl.intent.fire=false;
   let frames=0;const start=performance.now();while(pl.alive&&frames<60*90){s.simStep(1/60);frames++}
   result.push({level,hp:pl.maxHp,enemyLevel:e.lvl,enemyDamage:e.atk,death:!pl.alive,seconds:frames/60,simulationMs:performance.now()-start});
   if(!pl.alive){for(let i=0;i<60*8;i++)s.simStep(1/60);if(!pl.alive||Math.hypot(pl.x-s.CFG.world.spawn.x,pl.z-s.CFG.world.spawn.z)>1)throw Error('respawn failed')}
  }
  p.level=1;p.xp=0;s.refreshPlayerStats(true);const before=p.cases.length;s.addXp(s.xpToNext(1)+s.xpToNext(2)+s.xpToNext(3)+s.xpToNext(4),'review');
  result.push({levelReward:p.level>=5&&p.cases.length>before});g.events=[];g.enemies=[];return result;
 });assert(combat.slice(0,-1).every(c=>c.death),'stationary geared hero must remain vulnerable');assert(combat.at(-1).levelReward);
 await page.reload();await page.waitForFunction(()=>window.__gameBooted);await page.locator('#playBtn').click();
 await page.evaluate(()=>{__game.player.x=0;__game.player.z=40;__game.player.invulnT=100;});await page.waitForTimeout(1500);
 const perf=await page.evaluate(async()=>{const times=[];let last=performance.now();await new Promise(resolve=>{function frame(now){times.push(now-last);last=now;if(times.length<180)requestAnimationFrame(frame);else resolve()}requestAnimationFrame(frame)});times.sort((a,b)=>a-b);return {medianMs:times[90],p95Ms:times[171],visibleViews:[...__dbg.views.values()].filter(v=>v.root.visible).length,enemies:__game.enemies.length}});
 fs.mkdirSync('audit/evidence/world-integration',{recursive:true});await page.screenshot({path:'audit/evidence/world-integration/field.png'});
 assert.deepEqual(errors,[]);fs.writeFileSync('audit/evidence/world-integration/results.json',JSON.stringify({coverage,combat,perf,errors},null,2));console.log('PASS map reachability, geared combat/death/respawn and leveling',JSON.stringify({coverage,combat,perf}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
