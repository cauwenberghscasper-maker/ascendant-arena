// Browser integration evidence. Run with Playwright on NODE_PATH, local server on 8766.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
  const page=await browser.newPage({viewport:{width:1100,height:850}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='warning'&&/PropertyBinding|not loaded/.test(m.text()))errors.push(m.text());});
  await page.goto('http://127.0.0.1:8766/audit/original-adventurers.html');
  await page.waitForFunction(()=>window.review?.ready,{},{timeout:45000});
  fs.mkdirSync('assets/ui/portraits/adventurers',{recursive:true});fs.mkdirSync('audit/evidence',{recursive:true});
  for(const [id,family] of Object.keys(require('../audit/original-heroes.json')).map(k=>[k.slice(5),k.slice(5)])){
    await page.evaluate(async id=>{window.review.paused=true;await window.review.choose(id)},id);
    const result=await page.evaluate(()=>{
      const r=window.review,T=r.THREE,e={x:0,z:0,moveAmt:0,alive:true,lastAttack:-99,lastHurt:-99,attackAnim:0,dashT:0};
      for(let i=0;i<30;i++)r.motion.update(e,1/60);
      const arm=r.model.getObjectByName('upperarmr')||r.model.getObjectByName('upperarm.r');
      const hand=r.model.getObjectByName('handr')||r.model.getObjectByName('hand.r');
      if(!arm||!hand)throw Error('Missing arm bones: '+r.model.children.map(o=>o.name));
      const before=arm.quaternion.clone();e.lastAttack=1;e.attackAnim=1;
      for(let i=0;i<8;i++)r.motion.update(e,1/60);
      const armAngle=before.angleTo(arm.quaternion);
      const geometries=[];r.model.traverse(o=>{if(o.isSkinnedMesh){geometries.push({name:o.name,weights:o.geometry.attributes.skinWeight.count});}});
      const handAngle=hand.quaternion.angleTo(new T.Quaternion());r.model.updateMatrixWorld(true);const grip=r.model.getObjectByName('fantasyGrip');if(grip.parent!==hand)throw Error('Weapon detached from wrist');
      for(const mesh of r.model.children.filter(o=>o.isSkinnedMesh)){const w=mesh.geometry.attributes.skinWeight;for(let i=0;i<w.count;i++){if(Math.abs(w.getX(i)+w.getY(i)+w.getZ(i)+w.getW(i)-1)>.0001)throw Error('Invalid skin weights')}}
      return {armAngle,handAngle,meshes:geometries.length,nodes:r.model.children.map(o=>o.name),clips:r.clips.map(c=>c.name)};
    });
    assert(result.armAngle>.01,family+' arm must animate');assert(result.meshes>0);
    const data=await page.evaluate(()=>window.review.portrait());fs.writeFileSync(path.join('assets/ui/portraits/adventurers',family+'.png'),Buffer.from(data.split(',')[1],'base64'));
    await page.evaluate(()=>{const r=window.review,e=r.entity;r.setMode('runAttack');e.moveAmt=1;e.alive=true;e.lastAttack=2;for(let i=0;i<8;i++){e.z+=.1;r.motion.update(e,1/60)}});await page.waitForTimeout(70);
    await page.screenshot({path:'audit/evidence/original-'+family+'.png'});console.log('PASS',family,JSON.stringify(result));
  }
  assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
