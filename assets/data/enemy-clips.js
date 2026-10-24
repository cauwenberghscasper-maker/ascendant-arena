import * as T from '../../vendor/three/build/three.module.js';
const clamp=x=>Math.max(0,Math.min(1,x)),clipCache=new Map();
export const ENEMY_ANIMATION_STATES=['idle','walk','wind_slam','wind_swing','wind_lunge','wind_recoil','wind_pulse','wind_breath','strike_slam','strike_swing','strike_swing_alt','strike_lunge','strike_recoil','strike_pulse','strike_breath','hit','death'];

// Keyed shoulder/elbow/hip/knee channels. Strike clips begin at contact: wind-up
// is sampled separately from the real warning timer, never a free-running loop.
function pose(name,u,spec,joints){
  const out=Object.fromEntries(joints.map(j=>[j.name,[0,0,0]])),set=(k,x=0,y=0,z=0)=>{if(out[k])out[k]=[x,y,z];};
  const alt=name.endsWith('_alt'),wave=Math.sin(u*Math.PI*2),wind=name.startsWith('wind_')?u:0,release=name.startsWith('strike_')?Math.pow(1-u,2):0,kind=name.replace(/^(wind|strike)_/,'').replace('_alt',''),active=wind||release;
  const walk=name==='walk',idle=name==='idle',hit=name==='hit',death=name==='death';
  for(const side of ['L','R']){
    const right=(side==='R')!==alt,sign=side==='R'?1:-1;let shoulder=0,twist=0,roll=.04,elbow=-.13;
    if(walk){shoulder=(right?1:-1)*wave*.65;elbow=-.30-Math.max(0,-shoulder)*.9;twist=sign*.15;}
    if(idle){shoulder=wave*.035;elbow=-.15-wave*.045;roll+=wave*.025;}
    if(active){
      if(kind==='slam'){shoulder=-2.15*wind-.60*release;elbow=-.75*wind-.25*release;roll+=.16*active;}
      else if(kind==='swing'){shoulder=(right?-1.0:-.45)*wind+(right?-1.25:-.65)*release;twist=sign*(wind*.65-release*.80);roll+=(right?.45:.12)*wind-.15*release;elbow=-.9*wind-.45*release;}
      else if(kind==='lunge'){shoulder=-.75*wind-1.15*release;elbow=-1.05*wind-.12*release;roll+=.16*wind;}
      else if(kind==='pulse'){shoulder=-1.35*wind-.95*release;roll+=.65*active;elbow=-.65*active;}
      else{shoulder=-1.05*wind-.8*release;twist=sign*.18*active;elbow=-.8*wind-.45*release;}
    }
    if(hit){shoulder=.5*(1-u);elbow=-.6*(1-u);roll+=.20*(1-u);}
    if(death){shoulder=.6*u;elbow=-.1;roll=.5*u;}
    set('arm'+side,shoulder,twist,sign*roll);set('elbow'+side,elbow,0,sign*.12*active);
    const stride=walk?(right?-1:1)*wave:0;if(!spec.noFeet){set('leg'+side,stride*.60,0,walk?sign*.03:0);set('knee'+side,Math.max(0,-stride)*.95,0,0);}
  }
  set('chest',idle?wave*.025:walk?Math.abs(wave)*.05:kind==='slam'?-wind*.08+release*.14:kind==='swing'?0:wind*.05,kind==='swing'?-wind*.16+release*.22:walk?wave*.08:0,hit?(1-u)*.10:0);
  set('head',idle?-wave*.035:hit?-.2*(1-u):active?-wind*.08:0,walk?-wave*.05:0,0);
  if(spec.family==='arthropod'||spec.family==='quadruped')for(let i=0;i<(spec.pairs||2);i++)for(const[side,sign]of[['L',-1],['R',1]]){
    const phase=Math.sin(u*Math.PI*2+i*Math.PI*.85+(side==='L'?0:Math.PI));set('leg'+side+i,walk?phase*.48:-wind*.2,walk?sign*phase*.24:sign*release*.16,sign*(walk?Math.max(0,phase)*.18:wind*.15));set('knee'+side+i,0,0,sign*(walk?Math.max(0,-phase)*.65:wind*.35));set('claw'+side,-wind*.8-release*.9,sign*(wind*.5-release*.55),sign*.1);
  }
  set('tail',idle?wave*.09:walk?wave*.15:wind*.65-release*.8,0,0);set('tailTip',wind*.55-release*.7,0,idle?wave*.08:0);
  for(const[side,sign]of[['L',-1],['R',1]]){const flap=(idle||walk)?Math.sin(u*Math.PI*2)*(spec.insect?.75:.5):wind*.5-release*.7;set('wing'+side,0,sign*.12,sign*flap);set('wingTip'+side,0,0,sign*(flap*.6+.12));}
  for(let i=0;i<6;i++)set('tendril'+i,(idle||walk)?Math.sin(u*Math.PI*2+i)*.18:wind*.3-release*.45,0,(idle||walk)?Math.cos(u*Math.PI*2+i)*.16:Math.sin(i)*active*.35);
  for(let i=0;i<3;i++)set('neck'+i,kind==='lunge'?-wind*.2+release*.3:0,(idle||walk)?Math.sin(u*Math.PI*2+i*.8)*.12:wind*.18-release*.2,0);
  if(death)set('chest',u*.7,0,u*.12);
  if(spec.strength)for(const[name,angles]of Object.entries(out))if(!name.startsWith('wing'))for(let i=0;i<3;i++)angles[i]*=spec.strength;
  return out;
}
function clipsFor(id,spec,bones){
  if(clipCache.has(id))return clipCache.get(id);const joints=bones.map(b=>({name:b.name.slice(6)})),euler=new T.Euler(),q=new T.Quaternion(),clips=[];
  for(const name of ENEMY_ANIMATION_STATES){const times=[0,.15,.35,.5,.7,.85,1],poses=times.map(u=>pose(name,u,spec,joints)),tracks=joints.map(j=>{const values=[];for(const p of poses){euler.set(...p[j.name]);q.setFromEuler(euler).toArray(values,values.length);}return new T.QuaternionKeyframeTrack('enemy_'+j.name+'.quaternion',times,values);});clips.push(new T.AnimationClip(name,1,tracks));}
  clipCache.set(id,clips);return clips;
}
export function createEnemyAnimator(model,rigs){
  const meshes=[];model.traverse(o=>{if(o.isSkinnedMesh&&o.userData.enemyRig)meshes.push(o);});if(!meshes.length)return null;
  const id=meshes[0].userData.enemyRig,spec=rigs[id],clips=clipsFor(id,spec,meshes[0].skeleton.bones),mixer=new T.AnimationMixer(model),actions=new Map();
  for(const c of clips){const a=mixer.clipAction(c);a.play();a.setLoop(T.LoopOnce,1);a.clampWhenFinished=true;a.paused=true;a.setEffectiveWeight(0);actions.set(c.name,a);}
  let previousAttack=0,lastMove=null,pendingMove=null,lastKind='lunge',attackAge=99,attackDuration=.35,repeatInterval=0,locomotion=0,hitAge=99,previousFlash=0,deathAge=0;const state={name:'idle',time:0,move:null};
  const sample=(name,u,weight)=>{const a=actions.get(name);if(!a)return;a.enabled=true;a.time=Math.min(.999999,clamp(u));a.setEffectiveWeight(weight);};
  return{mixer,clips,state,family:spec.family,floating:spec.floating||spec.flying||spec.family==='winged'||spec.family==='jelly',update(e,dt,t,phase,kind='lunge',wind=0,strike=0,moveKey=null,moveSpec=null){
    dt=Math.max(0,Math.min(.1,dt));const alive=e.alive!==false&&!e.hidden;for(const a of actions.values())a.setEffectiveWeight(0);
    const walking=alive&&!(e.windT>0)&&wind<=0&&(e.moveAmt||0)>.05;locomotion+=((walking?Math.min(1,e.moveAmt||0):0)-locomotion)*(1-Math.exp(-dt*14));
    if(wind>0||e.windT>0){pendingMove=moveKey||kind;attackAge=99;}
    if(strike>previousAttack+.15&&wind<=0){
      attackAge=-dt;lastMove=moveKey||pendingMove||kind;pendingMove=null;lastKind=kind;
      const repeated=['flurry','sweep','rain'].includes(lastMove);
      repeatInterval=e.animHits>1?e.animInterval:repeated?moveSpec?.step||(lastMove==='flurry'?.32:.17):0;
      const hits=e.animHits>1?e.animHits:repeated?moveSpec?.n||(lastMove==='flurry'?3:5):1;
      attackDuration=repeatInterval>0?(hits-1)*repeatInterval+.35:lastMove==='spiral'?2.2:.35;
    }
    previousAttack=strike;attackAge+=dt;hitAge+=dt;if((e.flashT||0)>previousFlash+.01)hitAge=0;previousFlash=e.flashT||0;
    let name='idle',u=(t*.45)%1,overlay=0;
    if(!alive){deathAge+=dt;name='death';u=clamp(deathAge/.5);overlay=1;}else{deathAge=0;if(wind>0||e.windT>0){name='wind_'+kind;u=wind;overlay=1;}else if(attackAge<attackDuration){name='strike_'+lastKind+(lastKind==='swing'&&repeatInterval>0&&Math.floor(attackAge/repeatInterval)%2?'_alt':'');state.move=lastMove;overlay=1;const age=repeatInterval>0?attackAge%repeatInterval:attackAge;u=clamp(age/(repeatInterval>0?Math.min(.35,repeatInterval):attackDuration));}else if(hitAge<.20){name='hit';u=hitAge/.20;overlay=Math.sin(u*Math.PI);}}
    sample('idle',spec.insect?(t*13)%1:spec.wings?(t*2.5)%1:(t*.45)%1,(1-overlay)*(1-locomotion));sample('walk',((phase/(Math.PI*2))%1+1)%1,(1-overlay)*locomotion);if(overlay>0)sample(name,u,overlay);
    mixer.update(0);state.name=overlay>0?name:locomotion>.4?'walk':'idle';state.time=u;
  },dispose(){mixer.stopAllAction();mixer.uncacheRoot(model);}};
}
