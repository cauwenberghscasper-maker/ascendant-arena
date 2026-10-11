// Real-browser equipment and touch-scroll regression. Local fixtures never use cloud saves.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const out='audit/evidence/mobile-integration';
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const page=await context.newPage(), errors=[],results=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8766/');
 await page.waitForFunction(()=>window.__gameBooted,null,{timeout:60000});
 await page.locator('#playBtn').click();
 await page.waitForFunction(()=>window.__assets.status('hero.bolt')==='ready',null,{timeout:30000});
 await page.evaluate(()=>{
  const p=__game.profile,s=__sim;p.gold=1000000;p.essence=10000;p.bag=[];
  p.gear.chest=s.makeItem('chest','epic',15);p.gear.chest.id='review-equipped';
  const replacement=s.makeItem('chest','legendary',18);replacement.id='review-replacement';p.bag.push(replacement);
  for(let i=0;i<16;i++){const it=s.makeItem('chest','common',1);it.id='review-material-'+i;p.bag.push(it);}
  s.refreshPlayerStats(true);__dbg.UI.gearSlot='chest';__dbg.heroTab('Gear');
 });
 await page.waitForTimeout(700);
 const state=()=>page.evaluate(()=>({gear:__game.profile.gear.chest,bag:__game.profile.bag.map(i=>i.id),hp:__game.player.maxHp,atk:__game.player.atk,gold:__game.profile.gold}));
 const initial=await state();
 assert.equal(await page.locator('[data-act="gpick"][data-id="review-equipped"]').count(),0);
 await page.locator('[data-act="gpick"][data-id="review-replacement"]').click();
 await page.locator('[data-act="equip"][data-id="review-replacement"]').click();
 const replaced=await state();assert.equal(replaced.gear.id,'review-replacement');assert(replaced.bag.includes('review-equipped'));assert(!replaced.bag.includes('review-replacement'));assert(replaced.hp>initial.hp);
 await page.locator('[data-act="unequip"][data-slot="chest"]').click();
 const removed=await state();assert.equal(removed.gear,null);assert(removed.bag.includes('review-replacement'));assert(removed.hp<replaced.hp);
 await page.locator('[data-act="gpick"][data-id="review-replacement"]').click();
 await page.locator('[data-act="equip"][data-id="review-replacement"]').click();
 await page.locator('[data-act="upgradeHere"][data-slot="chest"]').click();
 await page.locator('[data-act="mergeConfirm"]').click();
 const upgraded=await state();assert.equal(upgraded.gear.up,1);assert(upgraded.hp>replaced.hp);assert.equal(upgraded.bag.length,replaced.bag.length-1);assert(upgraded.gold<replaced.gold);
 assert.equal(new Set(upgraded.bag).size,upgraded.bag.length);assert(!upgraded.bag.includes(upgraded.gear.id));
 results.push({flow:'equip / replace / unequip / reviewed merge',initialHp:initial.hp,replacedHp:replaced.hp,emptyHp:removed.hp,upgradedHp:upgraded.hp});
 const cdp=await context.newCDPSession(page);
 async function swipe(selector){
  const el=page.locator(selector);await el.evaluate(e=>e.scrollTop=0);
  const box=await el.boundingBox();assert(box&&box.height>40,selector+' is visible');
  const x=Math.round(box.x+box.width*.65),start=Math.round(box.y+box.height*.85),end=Math.round(box.y+box.height*.2);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:start}]});
  for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:Math.round(start+(end-start)*i/12)}]});await page.waitForTimeout(18);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(150);
  return el.evaluate(e=>({top:e.scrollTop,height:e.clientHeight,content:e.scrollHeight,width:e.clientWidth,scrollWidth:e.scrollWidth}));
 }
 for(const viewport of [{width:320,height:568},{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(viewport);
  for(const tab of ['Stats','Gear']){
   await page.evaluate(tab=>__dbg.heroTab(tab),tab);await page.waitForTimeout(450);
   const scroll=await swipe(await page.locator('#panel > .pBody').count() ? '#panel > .pBody' : '#panel');assert(scroll.content>scroll.height,tab+' fixture should overflow');assert(scroll.top>20,tab+' touch swipe scrolls '+JSON.stringify({viewport,scroll}));assert(scroll.scrollWidth<=scroll.width+1,tab+' has no horizontal clipping');
   const rect=await page.locator('#panel').boundingBox();assert(rect.x>=-1&&rect.y>=-1&&rect.x+rect.width<=viewport.width+1&&rect.y+rect.height<=viewport.height+1);
   const clipped=await page.locator('#panel .pBtns > button').evaluateAll(els=>els.filter(e=>e.scrollWidth>e.clientWidth+2||e.getBoundingClientRect().bottom>innerHeight).map(e=>e.textContent));assert.deepEqual(clipped,[],'action buttons remain readable and on screen');
   results.push({viewport,tab,scroll});
   await page.locator('#panel > .pBody').evaluate(e=>e.scrollTop=0);await page.waitForTimeout(100);
   await page.screenshot({path:`${out}/${tab.toLowerCase()}-${viewport.width}x${viewport.height}.png`});
   if(tab==='Gear'){
    const doll=await swipe('#doll');if(doll.content>doll.height+1)assert(doll.top>0,'equipped slots touch scroll');
    await page.locator('#doll .dchip[data-slot="boots"]').click();assert.equal(await page.evaluate(()=>__dbg.UI.gearSlot),'boots');
    await page.locator('#doll .dchip[data-slot="chest"]').click();assert.equal(await page.evaluate(()=>__dbg.UI.gearSlot),'chest');
   }
  }
  await page.evaluate(()=>__dbg.openMenu('upgrades'));await page.waitForTimeout(150);
  assert.equal(await page.locator('.menuSections').count(),1);assert.equal(await page.locator('.mtiles .mtile').count(),6);
  const menu=await swipe('#panel');if(menu.content>menu.height+1)assert(menu.top>0,'menu scrolls when needed');
  await page.locator('[data-section="adventure"]').click();assert.equal(await page.locator('.mtiles .mtile').count(),6);
  results.push({viewport,menu});
  await page.evaluate(()=>{const p=__game.profile;p.unlocked.artifacts=Object.keys(__sim.CFG.artifacts);p.level=150;__dbg.refresh();});
  for(const tab of ['Equip','Upgrade']) {
   await page.evaluate(tab=>__dbg.openArtifacts(tab),tab);await page.waitForTimeout(150);
   const scroll=await swipe(await page.locator('#panel > .pBody').count() ? '#panel > .pBody' : '#panel');await page.screenshot({path:`${out}/relics-${tab.toLowerCase()}-${viewport.width}x${viewport.height}.png`});assert(scroll.top>20,'relics '+tab+' touch scrolling');assert(scroll.scrollWidth<=scroll.width+1,'relics '+tab+' no horizontal clipping '+JSON.stringify(scroll));
   const overflow=await page.locator(tab==='Equip'?'.acard, .aslot2':'.aurow').evaluateAll(els=>els.filter(e=>e.scrollWidth>e.clientWidth+2).map(e=>e.textContent));assert.deepEqual(overflow,[],'all relic cards contain their text');
   await page.locator('#panel').evaluate(e=>e.scrollTop=e.scrollHeight);await page.waitForTimeout(80);
   const last=page.locator(tab==='Equip'?'.acard':'.aurow').last();const box=await last.boundingBox();assert(box.y+box.height<=viewport.height+1,'last relic is reachable');
   await page.screenshot({path:`${out}/relics-${tab.toLowerCase()}-${viewport.width}x${viewport.height}.png`});results.push({viewport,relicTab:tab,scroll});
  }
 }
 const beforeSave=await state();await page.evaluate(()=>__dbg.saveNow(true));await page.reload();await page.waitForFunction(()=>window.__gameBooted);
 const saved=await state();assert.equal(saved.gear.id,upgraded.gear.id);assert.equal(saved.gear.up,1);assert.deepEqual(saved.bag,beforeSave.bag);
 await page.locator('#playBtn').click();await page.evaluate(()=>{__dbg.UI.gearSlot='chest';__dbg.heroTab('Gear')});
 await page.locator('[data-act="unequip"][data-slot="chest"]').click();await page.evaluate(()=>__dbg.saveNow(true));await page.reload();await page.waitForFunction(()=>window.__gameBooted);assert.equal((await state()).gear,null);
 const chestIds=await page.evaluate(()=>{__game.profile.cases=[];return Array.from({length:75},(_,i)=>__sim.addCase(i%2?'milestone':'treasure',{l:20,src:'review',f:i%2?'rare':null}).id)});
 // No explicit save: the award itself must persist before any frame/autosave runs.
 assert(await page.evaluate(ids=>{const p=JSON.parse(localStorage.getItem('ascendant-arena-v1'));return ids.every(id=>p.cases.some(c=>c.id===id))},chestIds));
 await page.reload();await page.waitForFunction(()=>window.__gameBooted);assert.deepEqual(await page.evaluate(()=>__game.profile.cases.map(c=>c.id)),chestIds);
 assert.deepEqual(errors,[]);fs.writeFileSync(`${out}/results.json`,JSON.stringify({results,errors,saveReload:true},null,2));
 console.log('PASS mobile equipment, stats, actual touch swipes, menu sections, save/reload',JSON.stringify(results));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
