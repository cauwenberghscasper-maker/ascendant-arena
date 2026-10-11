// Relative desktop/headless sample, not a physical-device performance guarantee.
const {chromium}=require('playwright'),fs=require('node:fs'),cp=require('node:child_process');
(async()=>{
 const temp='.performance-baseline.html';
 if(fs.existsSync(temp))throw Error('Refusing to overwrite existing baseline file');
 fs.writeFileSync(temp,cp.execFileSync('git',['show','origin/main:index.html']));
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});const report=[];
 try{for(const file of [temp,'']){
  const context=await browser.newContext({viewport:{width:1280,height:850}});const page=await context.newPage();
  await page.addInitScript(()=>{let seed=42;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}});
  await page.goto('http://127.0.0.1:8766/'+file);await page.waitForFunction(()=>window.__gameBooted,null,{timeout:60000});await page.locator('#playBtn').click();
  await page.evaluate(()=>{__game.player.x=0;__game.player.z=40;__game.player.invulnT=100});await page.waitForTimeout(1800);
  const result=await page.evaluate(async()=>{const times=[];let last=performance.now();await new Promise(resolve=>{function frame(now){times.push(now-last);last=now;if(times.length<180)requestAnimationFrame(frame);else resolve()}requestAnimationFrame(frame)});times.sort((a,b)=>a-b);let sum=0;for(let i=0;i<120;i++){const t=performance.now();__sim.simStep(1/60);sum+=performance.now()-t}return{medianMs:times[90],p95Ms:times[171],averageSimulationMs:sum/120,visibleViews:[...__dbg.views.values()].filter(v=>v.root.visible).length,enemies:__game.enemies.length}});
  report.push({version:file?'previous':'updated',...result});await context.close();
 }}finally{await browser.close();fs.unlinkSync(temp)}
 fs.writeFileSync('audit/evidence/world-integration/performance-comparison.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exit(1)});
