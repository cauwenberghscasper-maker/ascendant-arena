// --- top-level sim step --------------------------------------------------------------
function simStep(dt) {
  G.time += dt;
  if (G.started && G.profile) { const R = G.profile.records; R.time = (R.time || 0) + dt; if (G.profile.gemBuys > 0) G.profile.gemBuys = Math.max(0, G.profile.gemBuys - dt / 600); }
  if (G.mode === 'hub') stepHub(dt);
  else if (G.mode === 'arena' && G.arena) stepArena(dt);
  stepPendingAoE(dt);
  stepClouds(dt);
  HeroSupers.step(dt);
  stepPetCombat(dt);
  stepProjectiles(dt);
}

// Companion attacks run on the fixed simulation clock, independently of mesh loading.
const PetCombat = { pet:null, cooldown:0, scan:0, target:null, pose:0, facing:0 };
function petMayFight() {
  return petCombatAllowed({started:G.started,mode:G.mode,alive:G.player?.alive,modal:G.modal,paused:G.paused,safe:G.menuSafe>0,inTown:inTown()});
}
function petOrigin() {
  const p=G.player,f=p.facing;
  return {x:p.x-Math.sin(f)*1.3+Math.cos(f)*.85,z:p.z-Math.cos(f)*1.3-Math.sin(f)*.85};
}
function petClearShot(a,b) {
  const d=Math.hypot(b.x-a.x,b.z-a.z);
  return rayLen(a.x,a.z,Math.atan2(b.x-a.x,b.z-a.z),d).d>=d-(b.r||.3);
}
function awardPetCombatXp(amount) {
  if(G.mode!=='hub' || !G.started || !G.player.alive || G.modal || !equippedPet(G.profile))return;
  const reward=grantPetXp(G.profile,Math.round(amount),TEST_MODE ? 100 : 1);G.dirty=true;
  if(reward.levels){refreshPlayerStats(false);ev({t:'petLevel',id:reward.id,level:G.profile.pets[reward.id].level});}
}
function stepPetCombat(dt) {
  const id=equippedPet(G.profile);
  if(id!==PetCombat.pet){Object.assign(PetCombat,{pet:id,cooldown:.4,scan:0,target:null,pose:0});}
  PetCombat.pose=Math.max(0,PetCombat.pose-dt);
  if(!id || !petMayFight()){PetCombat.target=null;PetCombat.scan=0;PetCombat.cooldown=Math.max(.2,PetCombat.cooldown);return;}
  const attack=petAttackSpec(G.profile), origin=petOrigin();
  PetCombat.cooldown=Math.max(0,PetCombat.cooldown-dt);PetCombat.scan-=dt;
  if(PetCombat.scan<=0){PetCombat.scan=.15;PetCombat.target=findPetTarget(G.enemies,G.boss,G.player,origin,attack.range,petClearShot);}
  const t=PetCombat.target;
  if(!t || !t.alive || t.hp<=0 || t.retreat!=null || t.state==='return' || Math.hypot(t.x-origin.x,t.z-origin.z)>attack.range || PetCombat.cooldown>0)return;
  if(!petClearShot(origin,t))return;
  const angle=Math.atan2(t.x-origin.x,t.z-origin.z), dmg=G.player.dmg*attack.mult;
  let fired=false;
  if(attack.kind==='slam') {
    let n=0;
    const hit=enemy=>{
      if(n>=attack.targets || !enemy || !enemy.alive || enemy.hp<=0 || enemy.retreat!=null || Math.hypot(enemy.x-origin.x,enemy.z-origin.z)>attack.range || Math.hypot(enemy.x-t.x,enemy.z-t.z)>2.2 || !petClearShot(origin,enemy))return;
      if(dealDamage(enemy,dmg,G.player.id,{pet:true,proc:true,canCrit:false,charge:0,pk:'shard',pc:attack.color})>0)n++;
    };
    hit(t);for(const enemy of G.enemies){if(n>=attack.targets)break;if(enemy!==t)hit(enemy);}if(G.boss!==t)hit(G.boss);fired=n>0;
  } else {
    const speed=18;
    fired=!!spawnProjectile({x:origin.x,z:origin.z,vx:Math.sin(angle)*speed,vz:Math.cos(angle)*speed,life:attack.range/speed,r:.28,dmg,team:G.player.team,owner:G.player.id,pet:true,kind:attack.kind,color:attack.color,slow:attack.slow,charge:0,y:.75});
  }
  // Full projectile pools delay a shot; they never overwrite existing effects.
  PetCombat.cooldown=fired?attack.cooldown:.2;
  if(fired){PetCombat.pose=.24;PetCombat.facing=angle;ev({t:'petAttack',id,x:origin.x,z:origin.z,kind:attack.kind,color:attack.color});}
}

// --- testing tools (Settings > Testing) ---
const TestTools = {
  levelUp() { const p = G.profile; if (p.level >= P.cap) return; p.xp = xpToNext(p.level) - 1; addXp(1 / progressionXpMultiplier(p) / (1 + ((G.player && G.player.mods && G.player.mods.xpFind) || 0)), 'test'); },
  levels5() { for (let i = 0; i < 5; i++) this.levelUp(); },
  levels100() { for (let i = 0; i < 100; i++) this.levelUp(); },
  gold() { const n = Math.round(1000 * Math.pow(CFG.enemies.goldGrowth, G.profile.level - 1)); G.profile.gold += n; G.dirty = true; ev({ t: 'gold', amt: n }); },
  essence() { addEssence(50); },
  boss() { if (G.boss || G.mode !== 'hub') return; G.bossWarned = false; G.bossTimer = Math.min(G.bossTimer, CFG.boss.warn + 1); },
  unlockAll() {
    const p = G.profile;
    for (const id of CFG.brawlerOrder) if (!p.unlocked.attacks.includes(id)) { p.unlocked.attacks.push(id); p.newUnlocks.push('a:' + id); }
    for (const id in CFG.artifacts) if (!p.unlocked.artifacts.includes(id)) { p.unlocked.artifacts.push(id); p.newUnlocks.push('r:' + id); }
    G.dirty = true; toast('All attacks and artifacts unlocked', 'good');
  },
  legendary() { grantItem(makeItem(pick(CFG.gear.slots), 'legendary', G.profile.level), 'test'); },
  // preview of the first generated 3D model (shows in the hand of staff brawlers)
  dragonsoulFocus() { grantItem(makeItem('weapon', 'legendary', G.profile.level, 'Dragonsoul Focus', { noun: 'Focus' }), 'test'); },
};


