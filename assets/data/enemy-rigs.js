// Reviewed anatomy in body-height units; x is half-width, feet are y=0, forward is +z.
const humanoid = (shoulder, elbow, hip, cut, extra = {}) => ({ family: 'humanoid', shoulder, elbow, hip, cut, ...extra });
const E = 'enemy.', W = 'world.boss_';
export const ENEMY_RIGS = {
  [E+'wolf']: humanoid([.255,.60,.10],[.34,.37,.13],[.15,.22,.14],.40,{tail:true,head:[0,.76,.28]}),
  [E+'boar']: humanoid([.25,.48,-.02],[.32,.31,.005],[.15,.18,0],.27,{head:[0,.66,.28],strength:.55}),
  [E+'myconid']: humanoid([.145,.405,0],[.205,.29,.01],[.095,.17,0],.30),
  [E+'yeti']: humanoid([.25,.61,.01],[.32,.40,.05],[.14,.25,.03],.44),
  [E+'warden']: humanoid([.24,.65,0],[.31,.44,.03],[.13,.28,.02],.48),
  [E+'imp']: humanoid([.14,.48,0],[.19,.34,.04],[.09,.20,0],.33,{ wings: [.14,.63,-.04], wingStart: .22, flying: true }),
  [E+'fireimp']: humanoid([.23,.57,.01],[.30,.37,.03],[.13,.23,0],.39,{ wings: [.20,.61,-.06], wingStart: .32 }),
  [E+'wraith']: humanoid([.18,.59,0],[.26,.49,.02],[.09,.24,0],.50,{ floating: true, noFeet: true }),
  [E+'drowned']: humanoid([.14,.60,0],[.19,.43,.03],[.09,.24,0],.45,{ floating: true, noFeet: true }),
  [E+'seraph']: humanoid([.13,.57,0],[.17,.42,.02],[.08,.29,0],.42,{ wings: [.12,.64,-.03], wingStart: .22, flying: true }),
  [E+'sentinel']: humanoid([.26,.48,0],[.33,.32,.01],[.10,.19,0],.34,{ floating: true, noFeet: true }),
  [E+'siegelord']: humanoid([.24,.67,0],[.32,.46,.04],[.13,.28,0],.47,{strength:.45}),
  [E+'siegecaptain']: humanoid([.14,.70,.02],[.19,.52,.08],[.13,.22,0],.48,{strength:.35}),
  [E+'slime']: humanoid([.19,.38,0],[.23,.25,.02],[.10,.16,0],.23,{ family: 'blob',strength:.4,noFeet:true }),
  [E+'wyvern']: humanoid([.13,.60,.02],[.18,.44,.04],[.11,.25,0],.38,{ head:[0,.88,.10],wings: [.15,.64,-.05], wingStart: .23, flying: true,strength:.35 }),
  [E+'spider']: { family:'arthropod', pairs:4, hipY:.43, spread:.24, ends:.48, front:.36, back:-.32 },
  [E+'beetle']: { family:'arthropod', pairs:3, hipY:.34, spread:.27, ends:.43, front:.30, back:-.30 },
  [E+'crawler']: { family:'arthropod', pairs:3, hipY:.36, spread:.27, ends:.46, front:.30, back:-.30, tail:true },
  [E+'scorpion']: { family:'arthropod', pairs:4, hipY:.24, spread:.17, ends:.36, front:.24, back:-.25, tail:true, claws:true },
  [E+'crab']: { family:'arthropod', pairs:3, hipY:.25, spread:.23, ends:.43, front:.23, back:-.22, claws:true },
  [E+'glassbull']: { family:'quadruped', hipY:.40, spread:.15, ends:.18, front:.30, back:-.28 },
  [E+'toad']: { family:'quadruped', hipY:.30, spread:.20, ends:.33, front:.24, back:-.20, strength:.65 },
  [E+'bat']: { family:'winged', wings:[.13,.56,-.03], wingStart:.20 },
  [E+'hornet']: { family:'winged', wings:[.15,.55,-.08], wingStart:.22, insect:true },
  [E+'jelly']: { family:'jelly' },
  [E+'viper']: { family:'serpent' },
  [W+'golem']: humanoid([.265,.67,-.015],[.36,.43,.005],[.15,.285,0],.59),
  [W+'frost']: humanoid([.24,.65,0],[.31,.43,.04],[.13,.26,0],.47),
  [W+'magma']: humanoid([.25,.65,0],[.33,.43,.04],[.14,.27,0],.47),
  [W+'void']: humanoid([.25,.64,0],[.33,.43,.04],[.14,.26,0],.47),
  [W+'abyss']: humanoid([.24,.63,.01],[.32,.40,.06],[.14,.25,.02],.44),
  [W+'celestial']: humanoid([.22,.65,0],[.28,.46,.03],[.12,.28,0],.48),
};

export function enemyJoints(spec) {
  const joints = [{ name:'root', parent:-1, p:[0,0,0] }];
  const add = (name,parent,p) => { joints.push({name,parent,p}); return joints.length-1; };
  if (spec.shoulder) {
    const chest=add('chest',0,[0,spec.shoulder[1]-.12,0]);
    add('head',chest,spec.head||[0,Math.min(.86,spec.shoulder[1]+.12),0]);
    for (const [side,sign] of [['L',-1],['R',1]]) {
      const arm=add('arm'+side,chest,[sign*spec.shoulder[0],spec.shoulder[1],spec.shoulder[2]]);
      add('elbow'+side,arm,[sign*spec.elbow[0],spec.elbow[1],spec.elbow[2]]);
      const hip=add('leg'+side,0,[sign*spec.hip[0],spec.hip[1],spec.hip[2]]);
      add('knee'+side,hip,[sign*spec.hip[0],spec.hip[1]*.48,spec.hip[2]+.015]);
    }
  }
  if(spec.family==='arthropod'||spec.family==='quadruped'){
    const pairs=spec.pairs||2;
    for(let i=0;i<pairs;i++)for(const [side,sign]of[['L',-1],['R',1]]){
      const z=spec.front+(spec.back-spec.front)*i/(pairs-1),hip=add('leg'+side+i,0,[sign*spec.spread,spec.hipY,z]);
      add('knee'+side+i,hip,[sign*spec.ends,spec.hipY*.48,z+.025]);
    }
    if(spec.claws)for(const[side,sign]of[['L',-1],['R',1]])add('claw'+side,0,[sign*spec.spread,.40,.18]);
    if(spec.tail){const a=add('tail',0,[0,.34,-.25]);add('tailTip',a,[0,.65,-.30]);}
    if(spec.family==='quadruped')add('head',0,[0,.65,.25]);
  }
  if(spec.shoulder&&spec.tail){const a=add('tail',0,[0,.30,-.25]);add('tailTip',a,[0,.34,-.48]);}
  if(spec.wings)for(const[side,sign]of[['L',-1],['R',1]]){
    const w=add('wing'+side,0,[sign*spec.wings[0],spec.wings[1],spec.wings[2]]);
    add('wingTip'+side,w,[sign*(spec.wingStart+.12),spec.wings[1]+.10,spec.wings[2]]);
  }
  if(spec.family==='jelly')for(let i=0;i<6;i++){const a=i*Math.PI/3;add('tendril'+i,0,[Math.sin(a)*.12,.42,Math.cos(a)*.12]);}
  if(spec.family==='serpent'){let p=0;for(let i=0;i<3;i++)p=add('neck'+i,p,[0,.26+i*.21,.04]);add('head',p,[0,.87,.04]);}
  return joints;
}
