const {chromium}=(()=>{try{return require('playwright')}catch{return require('./node_modules/playwright-core')}})(),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
(async()=>{
 // PW_CHROMIUM=/path/to/chromium runs without Edge; LOCAL_THREE=1 serves three.js from tools/node_modules (offline sandboxes)
 const browser=await chromium.launch(Object.assign(process.env.PW_CHROMIUM?{executablePath:process.env.PW_CHROMIUM}:{channel:'msedge'},{headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader','--enable-unsafe-swiftshader']}));
 const page=await browser.newPage({viewport:{width:1280,height:850}}),errors=[];
 if(process.env.LOCAL_THREE)await page.route('https://cdn.jsdelivr.net/npm/three@0.186.1/**',r=>{const f=path.join(__dirname,'node_modules/three',r.request().url().split('three@0.186.1/')[1]);r.fulfill({status:fs.existsSync(f)?200:404,contentType:'application/javascript',body:fs.existsSync(f)?fs.readFileSync(f):''})});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='warning'&&/PropertyBinding|not loaded/.test(m.text()))errors.push(m.text())});
 await page.goto('http://127.0.0.1:8766/');await page.waitForFunction(()=>window.__gameBooted,null,{timeout:60000});
 await page.locator('#playBtn').click();await page.waitForFunction(()=>window.__assets.status('hero.bolt')==='ready',null,{timeout:30000});
 const reward=await page.evaluate(()=>{const g=__game,s=__sim;p=g.profile;p.settings.autoSalvage=3;s.addCase('treasure',{src:'test'});const c=p.cases.at(-1),r=s.openCase(c.id);const saved=JSON.parse(localStorage.getItem('ascendant-arena-v1'));return {id:r.item.id,caseId:c.id,present:saved.bag.some(i=>i.id===r.item.id),consumed:!saved.cases.some(i=>i.id===c.id)}});
 assert(reward.present&&reward.consumed);await page.reload();await page.waitForFunction(()=>window.__gameBooted);assert(await page.evaluate(id=>__game.profile.bag.some(i=>i.id===id),reward.id));
 const full=await page.evaluate(()=>{const p=__game.profile,s=__sim;while(p.bag.length<s.CFG.gear.bagMax)p.bag.push(s.makeItem('weapon','common',1));s.addCase('treasure',{src:'test'});const c=p.cases.at(-1),n=p.bag.length,count=p.stats.cases,r=s.openCase(c.id);__dbg.saveNow(true);return {opened:!!r&&r.kept,consumed:!p.cases.some(i=>i.id===c.id),overflow:p.bag.length===n+1,count:count+1===p.stats.cases}});assert(Object.values(full).every(Boolean));
 console.log('PASS browser case save/reload and full bag',reward,full);
 await page.locator('#playBtn').click();await page.waitForTimeout(1000);
 const roster=await page.evaluate(async()=>{const ids=Object.keys(__manifest).filter(id=>id.startsWith('hero.'));ids.forEach(id=>__assets.request(id));while(ids.some(id=>['loading','queued'].includes(__assets.status(id))))await new Promise(r=>setTimeout(r,50));return ids.map(id=>({id,state:__assets.status(id),v4:!!__manifest[id].v4,original:__manifest[id].original,clips:__assets.entries.get(id)?.model?.animations.length,weapon:!!__assets.entries.get(id)?.model?.getObjectByName('v4Grip')}))});
 assert.equal(roster.length,16);assert(roster.every(r=>r.state==='ready'&&(r.v4?r.clips===17&&r.weapon:r.original&&r.clips===15)),JSON.stringify(roster));console.log('PASS all hero assets',roster.length,'v4:',roster.filter(r=>r.v4).length);
 const motion=await page.evaluate(async()=>{
  const {createKayKitMotion}=await import('./assets/data/kaykit-motion.js'),T=__THREE,a=__assets.instance('hero.bolt'),b=__assets.instance('hero.bolt'),controller=createKayKitMotion(T,a,a.animations,__manifest['hero.bolt']);
  const other=b.getObjectByName('upperarmr').quaternion.clone(),e={x:0,z:0,facing:0,moveAmt:1,alive:true,lastAttack:-99,lastHurt:-99,dashT:0,attackAnim:0};
  for(let i=0;i<180;i++){e.x+=i<90?.1:-.1;e.lastAttack=Math.floor(i/6)*.1;e.attackAnim=1;e.dashT=i>60&&i<73?.2:0;e.alive=!(i>130&&i<160);controller.update(e,1/60);a.updateMatrixWorld(true);a.traverse(n=>{if(n.isBone&&!n.quaternion.toArray().every(Number.isFinite))throw Error('Invalid animation transform')})}
  const isolated=other.angleTo(b.getObjectByName('upperarmr').quaternion)<.0001,alive=a.getObjectByName('upperarmr').quaternion.angleTo(new T.Quaternion())>.01;
  controller.dispose();__assets.disposeInstance(a);__assets.disposeInstance(b);
  const live=__dbg.views.get(__game.player).root.getObjectByName('upperarmr');return {isolated,alive,liveRig:!!live};
 });assert(Object.values(motion).every(Boolean));console.log('PASS independent skeletons, rapid fire, dodge and respawn',motion);
 await page.keyboard.down('w');await page.waitForTimeout(1300);await page.keyboard.up('w');
 await page.screenshot({path:'audit/evidence/game-town.png'});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);await page.screenshot({path:'audit/evidence/game-mobile.png'});
 const state=await page.evaluate(()=>({x:__game.player.x,z:__game.player.z,pixel:__game.profile.settings.pixel,views:__dbg.views.size,errors:document.querySelector('#bootErr')?.textContent}));console.log('Game state',state);
 assert.equal(state.pixel,false);assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
