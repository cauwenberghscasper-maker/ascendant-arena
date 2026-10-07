// Persistent pet training and combat rules; rendering and profile resets stay separate.
export const PET_MAX_LEVEL = 99;
export const PET_DEFS = Object.freeze({
  crystal: { name:'Crystal Dragon', unlock:1, attack:'Crystal Bolt', kind:'bolt', color:0x70d6ed, range:10, cooldown:1.4, damage:.24, gain:.22, slow:0 },
  bull: { name:'Ember Bull', unlock:2, attack:'Horn Slam', kind:'slam', color:0xffaa67, range:3.5, cooldown:2, damage:.45, gain:.35, slow:0 },
  sprout: { name:'Stone Sprout', unlock:3, attack:'Thorn Dart', kind:'shard', color:0x9bd582, range:9, cooldown:1.7, damage:.19, gain:.18, slow:.6 },
  slime: { name:'Jade Slime', unlock:4, attack:'Bubble Bolt', kind:'orb', color:0x7de7b0, range:8, cooldown:1.5, damage:.22, gain:.2, slow:0 },
});
const prestige = p => Number.isSafeInteger(p.prestige) ? Math.max(0,Math.min(9999,p.prestige)) : 0;
const integer = (n, fallback, max) => Number.isSafeInteger(n) && n>=0 ? Math.min(n,max) : fallback;
export function petXpToNext(level) { return level>=PET_MAX_LEVEL ? 0 : 40+8*level+2*level*level; }
export function migratePets(p) {
  const old=p.pets && typeof p.pets==='object' && !Array.isArray(p.pets) ? p.pets : {}, pets={};
  for(const [id,d] of Object.entries(PET_DEFS)) if(prestige(p)>=d.unlock) {
    const s=old[id] || {}, level=Math.max(1,integer(s.level,1,PET_MAX_LEVEL));
    pets[id]={level,xp:level===PET_MAX_LEVEL?0:integer(s.xp,0,petXpToNext(level)-1),kills:integer(s.kills,0,Number.MAX_SAFE_INTEGER)};
  }
  p.pets=pets;
  p.activePet=Object.hasOwn(pets,p.activePet) ? p.activePet : Object.keys(pets)[0] || null;
}
export function equippedPet(p) { const d=Object.hasOwn(PET_DEFS,p.activePet) && PET_DEFS[p.activePet];return d && prestige(p)>=d.unlock && p.pets && Object.hasOwn(p.pets,p.activePet) ? p.activePet : null; }
export function petProgress(p) {
  const id=equippedPet(p), d=id && PET_DEFS[id], s=id && p.pets[id];
  const stage=id ? Math.min(5,prestige(p)-d.unlock+1) : 0;
  return {id,level:s?.level || 0,xp:s?.xp || 0,nextXp:s?petXpToNext(s.level):0,stage,name:d?.name || 'Locked',
    size:.72+.11*stage,attack:d?.attack || '',kills:s?.kills || 0};
}
export function petBonuses(p,mode='hub') {
  const pet=petProgress(p);if(mode!=='hub' || !pet.id)return {damage:0,hp:0};
  const power=prestige(p)+(pet.level-1)*.015;
  return {damage:.1*power/(power+4),hp:.2*power/(power+4)};
}
export function petAttackSpec(p) {
  const pet=petProgress(p);if(!pet.id)return null;
  const d=PET_DEFS[pet.id], trained=(pet.level-1)/(PET_MAX_LEVEL-1);
  return {...d,id:pet.id,mult:d.damage+d.gain*trained,cooldown:d.cooldown*(1-.2*trained),targets:d.kind==='slam'?3:1};
}
export function choosePet(p,id) {
  if(!Object.hasOwn(PET_DEFS,id) || prestige(p)<PET_DEFS[id].unlock || !p.pets || !Object.hasOwn(p.pets,id))return false;
  p.activePet=id;return true;
}
export function grantPetXp(p,amount,multiplier=1) {
  const id=equippedPet(p), s=id && p.pets[id];
  if(!s || !Number.isSafeInteger(amount) || amount<=0)return {id,levels:0,gained:0};
  const from=s.level;s.kills=Math.min(Number.MAX_SAFE_INTEGER,s.kills+1);
  if(s.level>=PET_MAX_LEVEL)return {id,levels:0,gained:0};
  const gained=Math.min(amount,10000)*(multiplier===100 ? 100 : 1);s.xp+=gained;
  while(s.level<PET_MAX_LEVEL && s.xp>=petXpToNext(s.level)){s.xp-=petXpToNext(s.level);s.level++;}
  if(s.level===PET_MAX_LEVEL)s.xp=0;
  return {id,levels:s.level-from,gained};
}
export function petCombatAllowed(context) {
  return context.started && context.mode==='hub' && context.alive && !context.modal && !context.paused && !context.safe && !context.inTown;
}
export function findPetTarget(enemies,boss,player,origin,range,clear) {
  let best=null, distance=range;
  const consider=t=>{
    if(!t || !t.alive || t.hp<=0 || t.retreat!=null || t.state==='return' || (t.kind!=='enemy' && t.kind!=='boss'))return;
    // Do not pull idle monsters while travelling. Assist fights the hero has engaged.
    if(!t.tagged && !(t.kind==='boss' && (t.dmgBy?.[player.id]>0)) && !(t.state==='chase' || t.state==='attack'))return;
    if(Math.hypot(t.x-player.x,t.z-player.z)>range)return;
    const d=Math.hypot(t.x-origin.x,t.z-origin.z);
    if(d<distance && clear(origin,t)){distance=d;best=t;}
  };
  for(const t of enemies)consider(t);consider(boss);return best;
}
