const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const dir='audit/evidence/character-integration';fs.mkdirSync(dir,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1100,height:850}}),errors=[],report=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8766/audit/original-adventurers.html');await page.waitForFunction(()=>window.review?.ready,null,{timeout:60000});
 const ids=Object.keys(require('../audit/original-heroes.json')).map(id=>id.slice(5)),images=[];
 for(const id of ids){
  await page.evaluate(async id=>{review.paused=true;await review.choose(id)},id);
  for(const mode of ['idle','runAttack']){
   const result=await page.evaluate(mode=>{const r=review,T=r.THREE,e=r.entity;r.setMode(mode);e.alive=true;e.moveAmt=mode==='idle'?0:1;e.facing=0;e.lastAttack=-99;
    for(let i=0;i<45;i++){e.z+=e.moveAmt*.1;if(mode==='runAttack'&&i===38){e.lastAttack=10;e.attackAnim=1}r.motion.update(e,1/60)}
    r.model.updateMatrixWorld(true);r.renderer.render(r.scene,r.camera);
    const grip=r.model.getObjectByName('fantasyGrip'),hand=r.model.getObjectByName('handr');
    return {image:r.renderer.domElement.toDataURL(),gripDistance:grip.getWorldPosition(new T.Vector3()).distanceTo(hand.getWorldPosition(new T.Vector3())),bones: r.model.getObjectByName('heroCrownSocket')?.parent.name};
   },mode);assert(result.gripDistance<1e-6);assert.equal(result.bones,'head');images.push({id,mode,src:result.image});
  }
 }
 await page.evaluate(images=>{review.paused=true;document.body.innerHTML='<main style="max-width:none;margin:0;padding:16px"><h1>Original heroes · idle and moving attack</h1><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">'+images.map(x=>'<figure style="margin:0;background:#1b3438"><img style="width:100%;height:260px;object-fit:cover" src="'+x.src+'"><figcaption>'+x.id+' · '+x.mode+'</figcaption></figure>').join('')+'</div></main>';},images);
 await page.setViewportSize({width:1400,height:1100});await page.screenshot({path:dir+'/roster.png',fullPage:true});
 await page.goto('http://127.0.0.1:8766/');await page.waitForFunction(()=>window.__gameBooted,null,{timeout:60000});await page.locator('#playBtn').click();
 await page.evaluate(async()=>{const ids=Object.keys(__manifest).filter(k=>k.startsWith('hero.'));ids.forEach(id=>__assets.request(id));while(ids.some(id=>__assets.status(id)==='loading'))await new Promise(r=>setTimeout(r,30))});
 for(const id of ids)for(const rarity of ['legendary','rare',null]){
  const result=await page.evaluate(({id,rarity})=>{
   const T=__THREE,gear=Object.fromEntries(__sim.CFG.gear.slots.map(s=>[s,rarity?__sim.makeItem(s,rarity,40):null]));
   const v=__lab.slots.create('character',{cls:id,body:0x456755,accent:0xffaa44,gear,asc:3});
   const entity={x:0,z:0,facing:0,moveAmt:0,alive:true,lastAttack:-99,lastHurt:-99,dashT:0,attackAnim:0},samples=[];
   for(const mode of ['idle','run','attack','runAttack','dash','hurt','death','respawn']){
    entity.moveAmt=/run/.test(mode)?1:0;entity.alive=mode!=='death';entity.dashT=mode==='dash'?.2:0;if(/attack/i.test(mode))entity.lastAttack+=100;if(mode==='hurt')entity.lastHurt=4;
    for(let i=0;i<30;i++){entity.z+=entity.moveAmt*.1;v.update(entity,1/60,i/60);v.root.updateMatrixWorld(true)}
    const crown=v.root.getObjectByName('heroCrownSocket'),back=v.root.getObjectByName('heroBackSocket'),grip=v.root.getObjectByName('v4Grip') || v.root.getObjectByName('fantasyGrip');
    if(crown.children.length!==1||back.children.length!==2)throw Error('Unbound ascension '+id);
    if(grip.parent.name!=='handr')throw Error('Unbound grip');
    const expected=rarity?{chest:'chest',helmet:'head',boots:['footl','footr'],accessory:'chest'}:{};
    for(const [slot,parent] of Object.entries(expected)){
     const mesh=v.root.getObjectByName('equipped-'+slot);if(!mesh||!(Array.isArray(parent)?parent.includes(mesh.parent.name):mesh.parent.name===parent))throw Error('Unbound armor '+id+' '+slot);
    }
    v.root.traverse(n=>{if(!n.matrixWorld.elements.every(Number.isFinite))throw Error('Nonfinite matrix '+id)});
    if(!rarity&&(grip.visible||v.root.getObjectByName('equipped-chest')))throw Error('Unequipped gear remains visible');
    samples.push({mode,crownParent:crown.parent.name,wingsParent:back.parent.name});
   }
   v.dispose();return {id,rarity,samples};
  },{id,rarity});report.push(result);
 }
 await page.evaluate(()=>{const p=__game.profile;p.level=200;p.gear=Object.fromEntries(__sim.CFG.gear.slots.map(slot=>[slot,__sim.makeItem(slot,'legendary',200)]));__sim.refreshPlayerStats(true);__dbg.heroTab('Gear')});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(2500);await page.screenshot({path:dir+'/ascended-equipment.png'});
 const currentImages=[];
 for(const id of ids){
  await page.evaluate(id=>{__game.profile.cls=id;__sim.refreshPlayerStats(false);__dbg.heroTab('Gear')},id);
  await page.waitForTimeout(400);
  const bytes=await page.screenshot({clip:{x:140,y:0,width:250,height:464}}); // the hero fills the area above the 45% sheet
  currentImages.push({id,src:'data:image/png;base64,'+bytes.toString('base64')});
 }
 const gallery=await browser.newPage({viewport:{width:1200,height:1000}});
 await gallery.setContent('<body style="background:#14202c;color:white;font:16px sans-serif"><h1>Current v4 heroes · integrated equipment and ascension</h1><main style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">'+currentImages.map(x=>'<figure style="margin:0"><img style="width:100%" src="'+x.src+'"><figcaption>'+x.id+'</figcaption></figure>').join('')+'</main></body>');
 await gallery.screenshot({path:dir+'/current-roster.png',fullPage:true});await gallery.close();
 assert.deepEqual(errors,[]);fs.writeFileSync(dir+'/results.json',JSON.stringify({report,errors},null,2));console.log('PASS all 16 characters: grips, crown/back attachments and eight animation states');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
