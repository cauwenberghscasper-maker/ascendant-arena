// Authored environment kit. All geometry is cached and instanced by the game.
// Decorations sit on existing footprints or outside the playable boundary.
export const REGION_ART = [
  { name:'Sunny Meadow', stone:0x8a9280, trim:0xe4d4a5, accent:0xebb866, dark:0x384943 },
  { name:'Ashwood Forest', stone:0x526459, trim:0x99aa80, accent:0xbccf7b, dark:0x283f3c },
  { name:'Frost Peaks', stone:0x849bad, trim:0xe7f0ef, accent:0x84d9eb, dark:0x344e68 },
  { name:'Ember Wastes', stone:0x504443, trim:0x99705b, accent:0xff9b50, dark:0x2b2934 },
  { name:'Starfall Ruins', stone:0x635c85, trim:0xb7a4ce, accent:0x90bdf0, dark:0x302f4d },
  { name:'Abyssal Depths', stone:0x38656b, trim:0x79a09b, accent:0x60e2cf, dark:0x203946 },
  { name:'Celestial Spire', stone:0xc6bb9e, trim:0xf5e9cc, accent:0xd9ab52, dark:0x6d6481 },
];

// --- Points of interest (v10). Builders are pure: they emit primitives by name in a local frame whose +z faces the
// road, plus solid circles (h). poiLayout() places them, so the checks can read the collision without WebGL.
// b = shaded part, g = glowing part, h = collider; args (geo, colour, x, y, z, sx, sy, sz, rx, ry, rz).
const POI_ART = {
  windmill(k){const S=k.s;k.b('cyl',S.stone,0,3.4,0,1.7,6.8,1.7);k.b('cone',0x8a4a36,0,7.7,0,2.2,1.9,2.2);k.b('box',0x614937,0,.9,1.65,.9,1.8,.1);
    for(let i=0;i<4;i++)k.b('box',0xe4d4a5,0,6.2,1.9,.5,5.4,.08,0,0,i*Math.PI/2+.3);k.b('cyl',0x614937,0,6.2,1.8,.25,.4,.25,Math.PI/2);k.h(0,0,1.9);},
  bell(k){k.b('crystal',0xb08d3a,0,1.1,0,1.9,2.6,1.9,0,0,.45);k.b('ring',0xd9b45a,-.9,.2,0,2,2,2,Math.PI/2,0,.45);k.b('cyl',0x6f5a3e,1.8,1.6,-1.2,.25,3.2,.25,0,0,.2);
    k.b('box',0x5a4632,.2,.25,1.6,4.4,.3,.3,0,.4,0);k.b('crown',0x6d9a4a,-1.4,.2,1.2,1.2,.4,1);k.h(0,0,2.2);},
  fairyRing(k){for(let i=0;i<11;i++){const a=i/11*6.283,x=Math.sin(a)*6,z=Math.cos(a)*6,s=.8+(i%3)*.3,c=[0xff4fd8,0x4fffe0,0xb6ff4f][i%3];k.b('cyl',0xe9e3cf,x,s,z,.3*s,2*s,.3*s);k.g('cone',c,x,2.1*s,z,1.3*s,.8*s,1.3*s);k.h(x,z,.45);}
    k.b('dodec',0x8a9280,0,.4,0,1,.8,1);k.g('ring',0xff9bf0,0,.05,0,5.2,5.2,5.2,Math.PI/2);},
  elderStump(k){k.b('cyl',0x5a3e2a,0,1.5,0,4,3,4);k.b('cyl',0x2a1c14,0,3.02,0,3.3,.05,3.3);k.b('cyl',0xd9b98a,0,3.01,0,3.6,.03,3.6);
    for(let i=0;i<7;i++){const a=i/7*6.283;k.b('box',0x4a3424,Math.sin(a)*4.2,.4,Math.cos(a)*4.2,1,.8,3,0,a,0);}k.b('crown',0x4f7f45,1.2,3.6,.8,.8,.7,.8);k.h(0,0,4.4);},
  ribcage(k){for(let i=0;i<6;i++){const z=-6+i*2.2;k.b('half',0xf1ead6,0,0,z,3.2-i*.2,3.4-i*.25,3);k.h(3.2-i*.2,z,.45);k.h(-3.2+i*.2,z,.45);}
    k.b('box',0xe4dcc4,0,.4,-.5,.7,.6,13);k.b('crown',0xf1ead6,0,1.3,7.6,2,1.6,2.4);k.b('box',0x1a1612,-.7,1.6,9.5,.5,.4,.2);k.b('box',0x1a1612,.7,1.6,9.5,.5,.4,.2);k.h(0,7.6,2);},
  windArch(k){const S=k.s;k.b('crown',S.stone,-4,3,0,1.6,3.6,1.6,0,0,.18);k.b('crown',S.stone,4,3,0,1.6,3.6,1.6,0,0,-.18);k.b('crown',S.trim,0,6.6,0,5,1.2,1.6);
    k.b('cone4',0xe9f2fa,0,8,0,.6,1,.6);k.h(-4,0,1.7);k.h(4,0,1.7);},
  colossus(k){const S=k.s;k.b('box',S.stone,-1.6,2.2,0,1.6,4.4,1.8);k.b('box',S.stone,1.6,1.6,0,1.6,3.2,1.8,0,0,.1);k.b('box',S.dark,0,.9,-4.5,5,1.8,3,.1,.3,.05);
    k.b('crown',S.trim,4.5,1.2,4,1.8,1.8,1.8,.3,0,.4);k.b('box',S.stone,-4.8,.6,3.5,1.2,1.2,4.5,0,.6,0);k.h(-1.6,0,1.3);k.h(1.6,0,1.3);k.h(0,-4.5,2.4);k.h(4.5,4,1.7);},
  sundial(k){const S=k.s;k.b('disk',S.trim,0,.15,0,5,.3,5);k.b('box',S.dark,0,2,0,.3,4,2.8);
    for(let i=0;i<12;i++){const a=i/12*6.283;k.b('box',S.accent,Math.sin(a)*4.4,.36,Math.cos(a)*4.4,.3,.12,.8,0,a,0);}k.h(0,0,1);},
  blackSpire(k){k.b('cone4',0x2a2a32,0,7,0,2.6,14,2.6);for(let i=0;i<6;i++){const a=i/6*6.283;k.b('ico',0x3a3a44,Math.sin(a)*4,.8,Math.cos(a)*4,.9,1.8,.9,.3,a,.2);k.h(Math.sin(a)*4,Math.cos(a)*4,.8);}
    k.g('crystal',0x84d9eb,0,14.4,0,.3,.9,.3);k.h(0,0,2.5);},
  frozenFall(k){k.b('crown',0x5a6478,0,4,-4,6,8,3.5);k.g('crystal',0xbfefff,0,3.5,-.6,1.6,7,.7);k.b('disk',0xd7e6f2,0,.06,2,4,.12,3);
    for(let i=0;i<5;i++)k.b('cone',0xe7f0ef,-2.4+i*1.2,.6,2+i%2,.4,1.2,.4);k.h(0,-4,4.2);k.h(-3.5,-3,2.5);k.h(3.5,-3,2.5);},
  mineHead(k){for(const x of[-2.2,2.2]){k.b('box',0x5a3e2a,x,3,0,.4,6,.4);k.h(x,0,.5);}k.b('box',0x5a3e2a,0,6,0,5,.4,.4);k.b('ring',0x8a8478,0,6.4,0,1.4,1.4,1.4);
    k.b('cyl',0x0c0a08,0,.03,0,1.8,.06,1.8);k.b('box',0x6a4a30,3.6,.6,2.4,1.4,.9,2,0,.3,0);k.h(3.6,2.4,1.1);},
  cauldron(k){k.b('crown',0x1e1e22,0,1.4,0,2.2,1.5,2.2);k.g('disk',0x9aff4f,0,2.5,0,1.7,.08,1.7);for(let i=0;i<3;i++){const a=i*2.094;k.b('box',0x2a2a2e,Math.sin(a)*1.6,.3,Math.cos(a)*1.6,.3,.7,.3);}
    k.g('ico',0xff8a2a,0,.25,0,1,.4,1);k.b('dodec',0x4a4a30,2.8,.4,1.2,.7,.5,.6);k.h(0,0,2.3);},
  forge(k){k.b('box',0x2a2226,-2,1.6,-1,3,3.2,3);k.g('box',0xff6a1f,-2,1.2,.52,1.4,1,.05);k.b('cyl',0x1e171a,-2,4.6,-1,.6,3,.6);k.b('box',0x4b4f58,1.8,.7,1,1.4,.5,.7);
    k.b('box',0x34373e,1.8,.3,1,.7,.6,.5);k.g('box',0xff5a1f,2,.06,-2.4,3,.08,1.2);k.h(-2,-1,2.1);k.h(1.8,1,.8);},
  chapel(k){const c=0x2e2622;k.b('box',c,-3,1.6,0,.5,3.2,7);k.b('box',c,3,1.1,0,.5,2.2,7);k.b('box',c,0,2.2,-3.5,6.5,4.4,.5);k.b('box',0x1e1a18,-1,3.2,0,.25,.25,7.4,0,0,.4);
    k.b('box',c,0,4.6,-3.5,1.6,2.4,1.2);k.b('cone4',0x1e1a18,0,6.4,-3.5,1.3,1.4,1.3);for(const z of[-2.5,0,2.5]){k.h(-3,z,.9);k.h(3,z,.9);}k.h(-2,-3.5,1);k.h(0,-3.5,1);k.h(2,-3.5,1);},
  dragonSkull(k){k.b('crown',0xe9e0c8,0,1.8,0,3,2.4,3.4);k.b('box',0xd8cfb8,0,.5,3.4,2.4,.6,3,.15,0,0);k.g('ico',0xff5a1f,-1.2,2.3,2.7,.4,.4,.3);k.g('ico',0xff5a1f,1.2,2.3,2.7,.4,.4,.3);
    k.b('cone',0xcfc6ae,-2.2,3.8,-.6,.5,3,.5,-.5,0,.5);k.b('cone',0xcfc6ae,2.2,3.8,-.6,.5,3,.5,-.5,0,-.5);for(let i=0;i<4;i++)k.b('cone',0xf1ead6,-1.1+i*.75,.2,4.6,.18,.6,.18,Math.PI);k.h(0,0,3);k.h(0,3.4,1.3);},
  brazier(k){const S=k.s;k.b('cyl',S.stone,0,1.4,0,.8,2.8,.8);k.b('crystal',S.dark,0,3.1,0,1.6,.8,1.6,Math.PI);k.g('crystal',0x3a8aff,0,4,0,.7,1.8,.7);k.g('crystal',0x9adfff,.4,3.8,.2,.35,1.1,.35,0,0,.3);
    for(let i=0;i<4;i++){const a=i*1.571+.78;k.b('box',S.trim,Math.sin(a)*2.6,.5,Math.cos(a)*2.6,.6,1,.6);k.h(Math.sin(a)*2.6,Math.cos(a)*2.6,.5);}k.h(0,0,1);},
  crystalArch(k){k.g('crystal',0xc77dff,-4,3,0,1,6,1,0,0,.12);k.g('crystal',0xc77dff,4,3,0,1,6,1,0,0,-.12);k.g('ring',0xe0b0ff,0,4.2,0,4.2,4.2,4.2);k.b('dodec',0x5b3a90,0,.4,0,1.4,.6,1.2);k.h(-4,0,1.1);k.h(4,0,1.1);},
  invertedTower(k){const S=k.s;k.b('cone4',S.dark,0,3.6,0,2.2,3,2.2,Math.PI);k.b('cyl',S.stone,0,7,0,2,4,2);k.b('cyl',S.trim,0,9.2,0,2.4,.5,2.4);
    for(let i=0;i<5;i++){const a=i*1.257;k.b('ico',S.stone,Math.sin(a)*4.5,2+i%3,Math.cos(a)*4.5,.8,.6,.8,i,a,0);}k.g('ico',0x6ac8ff,0,1.4,0,.5,.5,.5);k.h(0,0,1);},
  mirrors(k){[[-3,0,0],[3,0,0],[0,-3,1.571],[0,3,1.571],[-4.5,3.5,.78],[4.5,-3.5,.78]].forEach(([x,z,r])=>{const dx=Math.sin(r)*1.1,dz=Math.cos(r)*1.1;
    k.g('box',0xbff0ff,x,1.7,z,.15,3.4,3,0,r,0);k.b('box',0xa8d8f0,x,.1,z,.4,.2,3.2,0,r,0);k.h(x,z,.5);k.h(x+dx,z+dz,.5);k.h(x-dx,z-dz,.5);});},
  crashedStar(k){for(let i=0;i<14;i++){const a=i/14*6.283;k.b('dodec',0x4a4170,Math.sin(a)*5,.3,Math.cos(a)*5,1.1,.6+i%3*.3,1);}k.b('disk',0x1a1636,0,.04,0,4.4,.08,4.4);
    k.g('ico',0xfff07a,0,1.6,0,1.8,1.8,1.8,.4,.3,.6);k.g('ring',0xfff6b0,0,1.6,0,2.6,2.6,2.6,1.2,0,.4);k.h(0,0,1.9);},
  ghostShip(k){const c=0x3a3a52;k.b('box',c,0,1.2,0,3,2.4,10,0,0,.18);k.b('cone4',c,0,1.2,6,1.5,2.4,2,Math.PI/2,0,.18);k.b('cyl',0x2a2a3a,-.3,5,0,.18,8,.18,0,0,.18);
    k.g('box',0xa8f0e0,.2,5.5,.4,.05,3.4,3.6,0,0,.18);k.b('box',0x2a2a3a,0,2.6,-4.4,3,1,1.4,0,0,.18);for(const z of[-4,-1.5,1,3.5,6])k.h(0,z,1.6);},
  waterwheel(k){const S=k.s;k.b('box',S.stone,-3,1.8,0,4,3.6,4);k.b('cone4',S.dark,-3,4.6,0,3.2,2,3.2,0,.78,0);k.b('ring',0x5a3e2a,1.4,2.6,0,2.6,2.6,2.6,0,1.571,0);
    for(let i=0;i<6;i++)k.b('box',0x6a4a30,1.4,2.6,0,.2,5,.4,i*.524,0,0);k.b('disk',0x3e8d99,2.2,.05,0,3,.1,4);k.h(-3,0,2.8);k.h(1.4,0,1.2);},
  clam(k){k.b('crown',0xcfe0e8,0,.6,0,3,.8,2.6);k.b('crown',0xb8ccd8,0,2,-1.6,3,.7,2.6,-.9,0,0);k.g('crown',0xfff4f8,0,1.3,.2,.9,.9,.9);k.b('dodec',0x1f8a7a,2.8,.3,2,.6,.5,.6);k.h(0,0,2.8);},
  lighthouse(k){for(let i=0;i<5;i++)k.b('cyl',i%2?0xe8e2d0:0x9a2a2a,0,1+i*2,0,1.6-i*.12,2,1.6-i*.12);k.b('cyl',0x22262e,0,10.6,0,1.4,1.2,1.4);k.g('ico',0xfff07a,0,10.7,0,.7,.6,.7);
    k.b('cone',0x22262e,0,11.8,0,1.5,1.2,1.5);k.b('dodec',0x1a1e24,2.4,.5,1.6,1.4,1,1.2);k.h(0,0,1.8);k.h(2.4,1.6,1.3);},
  spine(k){for(let i=0;i<8;i++){const z=-7+i*2,y=.6+Math.sin(i*.8)*.4,x=Math.sin(i*.6)*1.5;k.b('dodec',0xd8cfb8,x,y,z,.9,.8,.9);k.b('cone',0xe9e0c8,x,y+1.4,z,.25,2.2-i*.15,.25,-.3);k.h(x,z,.9);}
    k.g('ico',0x2fffd0,0,.2,8,.4,.3,.4);},
  geyser(k){for(let i=0;i<9;i++){const a=i/9*6.283;k.b('dodec',0x4a4a50,Math.sin(a)*2.6,.5,Math.cos(a)*2.6,1,1+i%2*.4,1);k.h(Math.sin(a)*2.6,Math.cos(a)*2.6,.8);}
    k.g('crystal',0xf0f0f8,0,4,0,.9,8,.9);k.g('disk',0xff8a3a,0,.08,0,1.6,.1,1.6);},
  chimney(k){k.b('crystal',0x14101a,0,5,0,2,10,2);k.g('ring',0x8a3aff,0,10,0,1.4,1.4,1.4,Math.PI/2);k.g('ico',0xb06aff,0,10.4,0,.8,.5,.8);
    for(let i=0;i<4;i++){const a=i*1.571;k.g('crystal',0x6a2adf,Math.sin(a)*3,1,Math.cos(a)*3,.4,2,.4,.3,a,0);k.h(Math.sin(a)*3,Math.cos(a)*3,.5);}k.h(0,0,2.1);},
  stormRod(k){k.b('cyl',0x6a7488,0,7,0,.25,14,.25);for(let i=0;i<4;i++)k.g('ring',0x9fe8ff,0,3+i*3,0,1.2-i*.15,1.2-i*.15,1.2-i*.15,Math.PI/2);k.g('ico',0xffffff,0,14.4,0,.5,.5,.5);
    for(let i=0;i<5;i++){const a=i*1.257;k.b('box',0x7a8498,Math.sin(a)*2.4,.5,Math.cos(a)*2.4,1,1,1,0,a,.2);k.h(Math.sin(a)*2.4,Math.cos(a)*2.4,.7);}k.h(0,0,.6);},
  moonGate(k){const S=k.s;k.g('ring',0xd8c8ff,0,4.6,0,4.2,4.2,4.2);k.b('box',S.trim,0,.15,0,10,.3,3);k.b('box',S.stone,-4.2,1,0,1.2,2,1.4);k.b('box',S.stone,4.2,1,0,1.2,2,1.4);
    k.g('crown',0xffffff,0,8.8,0,.5,.5,.5);k.h(-4.2,0,1);k.h(4.2,0,1);},
  skyAltar(k){const S=k.s;k.b('disk',S.stone,0,.2,0,6,.4,6);k.b('disk',S.trim,0,.55,0,4.5,.3,4.5);k.b('box',S.stone,0,1.3,0,2,1.2,1.2);k.g('ring',0xfff07a,0,3.4,0,1.6,1.6,1.6,Math.PI/2);
    for(let i=0;i<4;i++){const a=i*1.571+.78,x=Math.sin(a)*5,z=Math.cos(a)*5;k.b('cyl',S.trim,x,2.4,z,.45,4,.45);k.b('box',S.accent,x,4.5,z,1,.3,1);k.h(x,z,.6);}k.h(0,0,1.2);},
  // minor POIs: shared shapes, coloured by the area palette
  camp(k){const S=k.s;k.b('cone4',0x9a6a4a,-1.5,1.2,-1,2,2.4,2.2,0,.78,0);k.b('box',0x5a3e2a,1.4,.2,.8,1.6,.3,.3,0,.5,0);k.g('ico',0xff8a2a,1.2,.4,1.2,.5,.6,.5);
    k.b('box',S.dark,2.6,.4,-1.4,.8,.8,.8);k.h(-1.5,-1,1.8);k.h(2.6,-1.4,.6);},
  tower(k){const S=k.s;k.b('cyl',S.stone,0,2.6,0,2.2,5.2,2.2);k.b('cyl',S.dark,0,5.25,0,1.7,.1,1.7);for(let i=0;i<5;i++){const a=i*1.25;k.b('box',S.stone,Math.sin(a)*2,5.6+i%2*.4,Math.cos(a)*2,.8,.8+i%2*.6,.6,0,a,0);}
    k.b('dodec',S.stone,3,.4,1.5,.8,.5,.7);k.h(0,0,2.3);},
  statue(k){const S=k.s;k.b('box',S.dark,0,.6,0,1.8,1.2,1.8);k.b('cyl',S.trim,0,2.4,0,.6,2.4,.5);k.b('crown',S.trim,0,4,0,.45,.5,.45);k.b('box',S.trim,.7,3.2,.2,.25,1.6,.25,0,0,-.5);k.h(0,0,1.2);},
  well(k){const S=k.s;k.b('cyl',S.stone,0,.5,0,1.3,1,1.3);k.b('cyl',0x0e1a24,0,1.01,0,1,.02,1);for(const x of[-1.1,1.1])k.b('box',0x5a3e2a,x,1.6,0,.18,2.4,.18);k.b('cone4',0x8a4a36,0,3.2,0,1.6,.9,1.6,0,.78,0);k.h(0,0,1.4);},
  cart(k){k.b('box',0x6a4a30,0,.9,0,1.6,.6,3,0,0,.2);for(const z of[-1,1])k.b('cyl',0x4a3424,-.9,.6,z,.6,.15,.6,0,0,Math.PI/2);k.b('box',0x8a6a4a,1.6,.4,1.6,.8,.8,.8,0,.4,0);k.b('box',0x8a6a4a,1.9,.3,.6,.6,.6,.6);k.h(0,0,1.5);k.h(1.6,1.6,.6);},
  graves(k){const S=k.s;for(let i=0;i<6;i++){const x=-2.4+(i%3)*2.4,z=i<3?-1.2:1.4;k.b('box',S.stone,x,.6,z,.8,1.2+(i%2)*.3,.25,(i%3-1)*.1);k.b('box',0x3a3328,x,.05,z+.9,.7,.1,1.4);k.h(x,z,.4);}k.b('cyl',S.dark,3.6,1.2,0,.12,2.4,.12);},
  obelisk(k){const S=k.s;k.b('box',S.dark,0,.25,0,2,.5,2);k.b('cone4',S.stone,0,3,0,.8,5.5,.8,0,.78,0);k.g('box',S.accent,0,2.4,.42,.2,1.6,.05);k.h(0,0,1);},
  shack(k){const S=k.s;k.b('box',0x6a5a4c,0,1.2,0,4,2.4,3.2);k.b('cone4',S.dark,0,3.2,0,3.2,1.6,2.6,0,.78,0);k.b('box',0x3a2a20,0,.8,1.62,.9,1.6,.05);k.g('box',0xffd99a,1.3,1.4,1.62,.6,.5,.05);k.h(-1,0,1.8);k.h(1,0,1.8);},
  // cave mouth down to a dungeon: rock mound behind, dark arch and steps toward the road, two torches
  cave(k){const S=k.s;k.b('crown',S.dark,0,2.2,-6,5.5,4.6,5);k.b('crown',S.stone,-4,1.6,-4,3,3,3,0,.5,0);k.b('crown',S.stone,4,1.6,-4,3,3,3,0,1,0);
    k.b('box',0x050407,0,1.5,-1.2,3.4,3,.6);k.b('box',S.trim,0,3.2,-1,4.2,.6,1.2);for(let i=0;i<3;i++)k.b('box',S.stone,0,.08-i*.02,.2-i*.5,3,.16,.5);
    for(const x of[-2.5,2.5]){k.b('cyl',0x4a3426,x,1,.2,.12,2,.12);k.g('ico',0xff9b3d,x,2.2,.2,.3,.4,.3);}k.h(0,-6,5);k.h(-4,-4,2.8);k.h(4,-4,2.8);},
  // secret pocket: a closed ring of rocks and dark firs with one narrow gap (world +z or −z), cache in the middle
  cache(k,q){const N=22,R=7,skip=q.gap>0?0:N/2;for(let i=0;i<N;i++){if(i===skip)continue;const a=i/N*6.283,x=Math.sin(a)*R,z=Math.cos(a)*R;
      k.b('crown',0x4a4a44,x,.6,z,1.2,1,1.2,0,a,0);k.b('cone',0x1e3a2a,x,3,z,1.2,4.2,1.2);k.h(x,z,1.1);}
    k.b('box',0x6a4a30,0,.45,0,1.2,.7,.8);k.b('box',0xd9a441,0,.86,0,1.24,.14,.84);k.g('crystal',0xfff07a,0,1.6,0,.25,.7,.25);},
};
export const POI_ART_IDS = Object.keys(POI_ART);
export function poiLayout(q, style, emit) {
  // landmarks and caves turn their front (+z) to the road; secret pockets keep world axes for their gap
  const rot = q.art === 'cache' ? 0 : (q.x < 0 ? Math.PI / 2 : -Math.PI / 2), cs = Math.cos(rot), sn = Math.sin(rot), hits = [];
  const P = (x, z) => [q.x + cs * x + sn * z, q.z - sn * x + cs * z];
  const put = (glow) => (geo, c, x, y, z, sx = 1, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) => { const [wx, wz] = P(x, z); emit(glow, geo, c, [wx, y, wz], [sx, sy, sz], [rx, ry + rot, rz]); };
  (POI_ART[q.art] || POI_ART.statue)({ b: put(false), g: put(true), h: (x, z, r) => { const [wx, wz] = P(x, z); hits.push({ x: wx, z: wz, r }); }, s: style || REGION_ART[0] }, q);
  return hits;
}

export function createWorldArt({THREE, GEO, part, mergeParts}) {
  const box=GEO.box, cone=GEO.cone7, cyl=GEO.cyl7;
  const crown=new THREE.IcosahedronGeometry(1,1), crystal=new THREE.CylinderGeometry(.65,1,1,6);
  const ring=new THREE.TorusGeometry(1,.055,4,32), disk=new THREE.CylinderGeometry(1,1,1,16);
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.94,metalness:0});
  const foliageMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0});
  const glowMaterial=new THREE.MeshBasicMaterial({vertexColors:true});
  const waterMaterial=new THREE.MeshStandardMaterial({color:0x3e8d99,roughness:.28,metalness:.12});
  const add=(a,g,c,p,s,r)=>a.push(part(g,c,p,r||null,s));
  const branch=(a,c,from,to,r0,r1)=>{
    const v=new THREE.Vector3(...to).sub(new THREE.Vector3(...from)), geo=new THREE.CylinderGeometry(r1,r0,v.length(),6);
    const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());
    const e=new THREE.Euler().setFromQuaternion(q);
    add(a,geo,c,from.map((n,i)=>(n+to[i])/2),[1,1,1],[e.x,e.y,e.z]);geo.dispose();
  };
  const shade=(g)=>{
    const p=g.attributes.position,n=g.attributes.normal,c=g.attributes.color;
    for(let i=0;i<p.count;i++){
      // Baked cavity tint keeps branches and overlapping leaves legible without SSAO.
      const k=.76+.19*Math.max(0,n.getY(i))+.05*Math.sin(p.getX(i)*6+p.getZ(i)*3);
      c.setXYZ(i,c.getX(i)*k,c.getY(i)*k,c.getZ(i)*k);
    }
    return g;
  };
  const mesh=a=>shade(mergeParts(a));
  const stem=[];
  branch(stem,0x765744,[0,0,0],[.08,2.2,-.06],.28,.12);
  for(let i=0;i<5;i++){const a=i*2.4;branch(stem,0x68503e,[0,.18,0],[Math.sin(a)*.7,.02,Math.cos(a)*.7],.12,.035);}
  branch(stem,0x836249,[0,1.2,0],[.8,2.4,.15],.12,.035);
  branch(stem,0x735441,[0,1.5,0],[-.7,2.6,-.3],.11,.035);
  const trunkGeo=mesh(stem), broad=[];
  [[0,2.65,0,1.05,.9],[.78,2.28,.12,.78,.66],[-.68,2.45,-.3,.88,.65],[.2,3.34,-.14,.74,.62],[-.4,2.7,.7,.72,.58],[.63,2.9,-.62,.66,.56]].forEach(([x,y,z,s,h],i)=>add(broad,crown,[0xf2f4d6,0xc6d3b7,0xe2e9c8,0xffffff,0xd5e0bd,0xe3edd0][i],[x,y,z],[s,h,s],[0,i*.7,.08*i]));
  const broadGeo=mesh(broad), pine=[];
  for(let i=0;i<5;i++){
    const y=1.3+i*.63,r=1.32-i*.23;
    add(pine,cone,i%2?0xe1e8d9:0xf8f9e4,[.04*Math.sin(i),y,0],[r,1.6-i*.12,r],[0,i*.63,.025*Math.sin(i)]);
    for(let j=0;j<3;j++){const a=j*2.094+i;add(pine,cone,0xc8d5be,[Math.sin(a)*r*.56,y-.23,Math.cos(a)*r*.56],[r*.45,.62,r*.5],[.12*Math.cos(a),a,.12*Math.sin(a)]);}
  }
  const pineGeo=mesh(pine), crystals=[];
  [[0,1.25,0,.45,2.5,0],[.52,.65,.16,.26,1.3,-.3],[-.4,.52,-.23,.23,1.05,.38]].forEach(([x,y,z,r,h,tilt])=>{
    add(crystals,crystal,0xc5d3e5,[x,y,z],[r,h,r],[0,.3,tilt]);
    add(crystals,cone,0xf1f9ff,[x+Math.sin(-tilt)*h*.47,y+h*.5,z],[r*.65,.6,r*.65],[0,.3,tilt]);
  });
  const crystalGeo=mesh(crystals), coral=[];
  for(let i=0;i<5;i++){
    const a=i*2.4, tip=[Math.sin(a)*.68,1.2+(i%3)*.36,Math.cos(a)*.65];
    branch(coral,0xcde9e2,[0,.04,0],tip,.18,.07);
    for(let j=-1;j<=1;j+=2){const end=[tip[0]+j*.35,tip[1]+.38,tip[2]+.2];branch(coral,0xedfff1,tip,end,.07,.025);add(coral,crown,0xffffff,end,[.12,.16,.12]);}
  }
  const coralGeo=mesh(coral), rocks=[];
  add(rocks,crown,0xe0e5e5,[0,.3,0],[.87,.68,.7],[.1,.5,.2]);
  add(rocks,crown,0xffffff,[.16,.55,-.13],[.63,.39,.58],[.13,.8,.06]);
  add(rocks,crown,0xb2bcb7,[-.55,.12,.22],[.4,.25,.4],[.2,.2,.4]);
  const rockGeo=mesh(rocks), bush=[];
  for(let i=0;i<5;i++){const a=i*2.4;add(bush,crown,i%2?0xd0dfbd:0xffffff,[Math.sin(a)*.42,.34+(i%2)*.2,Math.cos(a)*.38],[.49,.38,.45],[0,a,.12]);}
  const bushGeo=mesh(bush), tuft=[];
  // Bent tapered blades; opaque geometry avoids alpha-card sorting and overdraw.
  for(let i=0;i<5;i++){const a=i*2.4,h=.23+(i%3)*.11;add(tuft,cone,i%2?0xc9dba4:0xffffff,[Math.sin(a)*.13,h*.5,Math.cos(a)*.13],[.038,h,.095],[.22*Math.cos(a),a,.25*Math.sin(a)]);}
  const tuftGeo=mesh(tuft);

  function town(parts,T,houseAngles,palette){
    houseAngles.forEach((a,i)=>{
      const x=T.x+Math.sin(a)*17,z=T.z+Math.cos(a)*17,rot=a+Math.PI;
      const p=(lx,y,lz)=>[x+Math.cos(rot)*lx+Math.sin(rot)*lz,y,z-Math.sin(rot)*lx+Math.cos(rot)*lz];
      const beam=(lx,y,lz,s,c=0x614937)=>add(parts,box,c,p(lx,y,lz),s,[0,rot,0]);
      // Timber framing and a recessed stone threshold inside each existing house footprint.
      for(const side of [-1,1]){beam(side*1.95,1.4,1.83,[.16,2.8,.16]);beam(side*1.95,1.4,-1.83,[.16,2.8,.16]);}
      beam(0,.24,1.84,[4.15,.18,.17]);beam(0,2.65,1.84,[4.15,.17,.17]);
      beam(0,.06,1.95,[1.3,.12,.42],0x999388);
      beam(1.3,1.7,1.87,[.87,.88,.07]);beam(1.3,1.7,1.92,[.6,.6,.04],0xffd99a);
      beam(1.3,1.7,1.95,[.07,.64,.04]);beam(1.3,1.7,1.95,[.64,.07,.04]);
      beam(1.3,1.18,1.98,[1.03,.25,.3],0x77513c);
      for(let k=0;k<3;k++)add(parts,crown,[0x91a86e,0xb4bd7b,0xaeb76b][k],p(1+k*.29,1.38,1.99),[.22,.19,.2]);
      // Layered eave tiles, warm clay faces and cool undersides, not extra texture downloads.
      for(const side of [-1,1])for(let k=0;k<7;k++)beam(-1.92+k*.64,2.95,side*1.78,[.61,.15,.55],palette.roof[i%palette.roof.length]);
      beam(0,4.6,0,[.13,.15,3.3],0xd0b18a);
    });
    for(let i=0;i<12;i++){const a=i*Math.PI/6;add(parts,box,0xc3beb0,[T.x+Math.sin(a)*2.85,.51,T.z+Math.cos(a)*2.85],[.7,.18,.5],[0,a,0]);}
    add(parts,ring,0xd3cbbb,[T.x,.57,T.z],[2.85,2.85,2.85],[Math.PI/2,0,0]);
    add(parts,ring,0x9cd7d6,[T.x,2.39,T.z],[.85,.85,.85],[Math.PI/2,0,0]);
  }

  function zoneLandmarks(group,W,zi,styleArg){
    const zn=W.zones[zi], th=zn.theme!=null?zn.theme:zi, style=styleArg||REGION_ART[th], parts=[], glow=[];
    // Existing lair is the focal landmark; its central combat disc remains unobstructed.
    const lair=W.lairs[zi];
    if(lair){
      for(let i=0;i<8;i++){
        const a=i*Math.PI/4+Math.PI/8,x=lair.x+Math.sin(a)*9.5,z=lair.z+Math.cos(a)*9.5;
        add(parts,box,style.dark,[x,.16,z],[1.35,.32,1.12],[0,a,0]);
        add(parts,box,style.trim,[x,2.63,z],[1.23,.16,.96],[0,a,0]);
        add(parts,box,style.accent,[x+Math.sin(a)*.43,1.48,z+Math.cos(a)*.43],[.18,.8,.06],[0,a,0]);
        if(th>=2)add(glow,crystal,style.accent,[x,3.05,z],[.22,.7,.22],[0,a,0]);
      }
      for(let i=0;i<32;i++){
        const a=i*Math.PI/16,r=7.7;add(parts,box,style.trim,[lair.x+Math.sin(a)*r,.055,lair.z+Math.cos(a)*r],[.18,.035,.55],[0,a,0]);
      }
    }
    // Region gates: stepped bases, engraved lintels, distinct stone and metal treatments.
    if(zi>0){for(const x of [-3.2,3.2]){
      add(parts,box,style.dark,[x,.18,zn.z0],[1.14,.36,1.16]);
      add(parts,box,style.trim,[x,3.87,zn.z0],[1.03,.17,1.04]);
      add(parts,box,style.accent,[x,2.7,zn.z0-.48],[.24,1.4,.06]);
    }
      add(parts,box,style.trim,[0,4.94,zn.z0],[7.45,.16,1.04]);
      for(let i=-2;i<=2;i++)add(parts,crystal,style.accent,[i*.85,4.53,zn.z0-.53],[.12,.28,.08],[0,0,.45]);
    }
    // Distant silhouettes live beyond collision bounds: biome-specific horizon architecture.
    for(const side of [-1,1])for(let j=0;j<4;j++){
      const x=side*(W.maxX+9+j%2*5),z=zn.z0+23+j*(zn.z1-zn.z0-42)/3;
      if(th<=3){
        add(parts,crown,style.dark,[x,3,z],[8,6+(j%3)*2,10],[.2,j,.1]);
        add(parts,crown,th===2?style.trim:style.stone,[x-2*side,5,z+1],[6,4,7],[.1,j,.2]);
      }else{
        for(const s of [-1,1])add(parts,box,style.stone,[x+s*3.4,5.3,z],[1.8,10.6,2],[0,.08*s,.03*s]);
        add(parts,box,style.trim,[x,10.8,z],[9,.9,2.2],[0,0,.03]);
        add(parts,ring,style.accent,[x,8,z],[2.3,2.3,2.3]);
      }
    }
    // This area's landmarks, caves and secret pockets join the same two meshes (no extra draw calls per POI).
    const P={box,cyl,cone,cone4:GEO.cone4,crown,crystal,ring,disk,ico:GEO.ico0,dodec:GEO.dodec,half:GEO.torusHalf}, hits=[];
    for(const q of W.pois)if(q.zone===zi)hits.push(...poiLayout(q,style,(lit,g,c,p,s,r)=>add(lit?glow:parts,P[g],c,p,s,r)));
    const m=new THREE.Mesh(mesh(parts),material);m.name='World art / '+style.name;m.castShadow=true;m.receiveShadow=true;group.add(m);
    if(glow.length){const g=new THREE.Mesh(mergeParts(glow),glowMaterial);g.name='Lair crystals / '+style.name;group.add(g);}
    return hits;
  }

  function arena(parts,center,half){
    // Tournament masonry, heraldic trim and exterior terraces. Cover footprints stay exact.
    for(let ringIndex=0;ringIndex<3;ringIndex++)for(const s of [-1,1]){
      const d=half+2+ringIndex*2,h=.4+ringIndex*.55;
      add(parts,box,ringIndex%2?0x586079:0x747b90,[center.x+s*d,h/2,center.z],[1.8,h,half*2+8]);
      add(parts,box,ringIndex%2?0x586079:0x747b90,[center.x,h/2,center.z+s*d],[half*2+8,h,1.8]);
    }
    for(const s of [-1,1])for(let k=-2;k<=2;k++){
      const x=center.x+k*8,z=center.z+s*(half+.65);
      add(parts,box,0xbdad88,[x,.25,z],[1.1,.5,1.4]);add(parts,box,0xa5a6ad,[x,1.25,z],[.6,2.5,.8]);
      add(parts,cone,0xdfb96d,[x,2.75,z],[.5,.65,.5]);
    }
    add(parts,ring,0xb6a16f,[center.x,.03,center.z],[4.5,4.5,4.5],[Math.PI/2,0,0]);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;add(parts,box,0xbaa574,[center.x+Math.sin(a)*3,.025,center.z+Math.cos(a)*3],[.12,.02,1.1],[0,a,0]);}
  }

  function rift(parts,center,radius){
    // Fractured platform skirt and buttresses make the sanctum read as architecture.
    for(let i=0;i<24;i++){
      const a=i*Math.PI/12,r=radius+1.5;
      add(parts,crystal,i%2?0x413952:0x302b44,[center.x+Math.sin(a)*r,-1.6,center.z+Math.cos(a)*r],[1.25,4+(i%3),1.25],[.1,a,.1]);
      add(parts,box,0x84719b,[center.x+Math.sin(a)*(radius-.3),.14,center.z+Math.cos(a)*(radius-.3)],[1.7,.28,.65],[0,a,0]);
    }
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3+.52,x=center.x+Math.sin(a)*13,z=center.z+Math.cos(a)*13;
      add(parts,disk,0x726384,[x,.56,z],[1.15,.15,1.15]);
      add(parts,ring,0xc594d8,[x,2.7,z],[.7,.7,.7],[Math.PI/2,.15,0]);
    }
  }
  // Source primitives have been copied into the cached meshes; retain only ones used at world build.
  return {material,foliageMaterial,glowMaterial,waterMaterial,trunkGeo,broadGeo,pineGeo,crystalGeo,coralGeo,rockGeo,bushGeo,tuftGeo,town,zoneLandmarks,arena,rift};
}
