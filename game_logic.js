/* ===========================================================================
   GUARDIÕES DA FAUNA — Motor 2D (canvas)
   Telas: Início, Menu, Seleção de Bioma, Bestiário, Como Jogar.
   4 biomas (Mata Atlântica, Amazônia, Cerrado, Pantanal) + chefe (Robô Alfa).
   Usa sprites reais (SPRITES / SPRITE_META / BG_MATA).
   Otimizado: fundos pré-renderizados, timestep fixo, baixo GC.
   =========================================================================== */
(() => {
'use strict';

// ---------- Canvas ----------
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
const VW = 960, VH = 540;
cv.width = VW; cv.height = VH;
ctx.imageSmoothingEnabled = false;

// ---------- Sprites ----------
const IMG = {};
const SCALE = { idle:1.70, run:1.70, jump:1.70, patrol:1.50, claw:1.50, hit:1.50,
  heavy:1.62, throw:1.62, explode:1.55, drone:1.45, piranha:0.95 };
let bgPhoto = new Image();
let loaded = 0, toLoad = 0, ready = false;

function preload(cb){
  const names = Object.keys(SPRITES);
  toLoad = names.reduce((a,n)=>a+SPRITES[n].length,0) + 1;
  const done = ()=>{ loaded++; if(loaded>=toLoad){ ready=true; cb(); } };
  names.forEach(n=>{ IMG[n] = SPRITES[n].map(uri=>{ const im=new Image(); im.onload=done; im.onerror=done; im.src=uri; return im; }); });
  bgPhoto.onload = done; bgPhoto.onerror = done; bgPhoto.src = BG_MATA;
}

// ---------- Animações ([fps, loop]) ----------
const ANIM = { idle:[3,1], run:[13,1], jump:[1,1], patrol:[6,1], claw:[13,0], hit:[12,0],
  heavy:[5,1], throw:[9,0], explode:[11,0], drone:[14,1], piranha:[10,1] };
function frameImg(name, t){
  const a=ANIM[name], fr=IMG[name], n=fr.length; let idx=Math.floor(t*a[0]);
  idx = a[1] ? ((idx%n)+n)%n : Math.min(idx, n-1);
  return fr[idx];
}

// ---------- Desenho de sprites ----------
function drawB(img, cx, by, scale, flip, alpha, tint){
  if(!img) return; const w=img.width*scale, h=img.height*scale;
  ctx.save(); ctx.globalAlpha = alpha==null?1:alpha;
  ctx.translate(cx|0, by|0); if(flip) ctx.scale(-1,1);
  ctx.drawImage(img, (-w/2)|0, (-h)|0, w|0, h|0);
  if(tint){ ctx.globalCompositeOperation='source-atop'; ctx.fillStyle=tint; ctx.fillRect((-w/2)|0,(-h)|0,w|0,h|0); }
  ctx.restore();
}
function drawCc(img, cx, cy, scale, flip, alpha, tint){
  if(!img) return; const w=img.width*scale, h=img.height*scale;
  ctx.save(); ctx.globalAlpha = alpha==null?1:alpha;
  ctx.translate(cx|0, cy|0); if(flip) ctx.scale(-1,1);
  ctx.drawImage(img, (-w/2)|0, (-h/2)|0, w|0, h|0);
  if(tint){ ctx.globalCompositeOperation='source-atop'; ctx.fillStyle=tint; ctx.fillRect((-w/2)|0,(-h/2)|0,w|0,h|0); }
  ctx.restore();
}

// ---------- Input (teclado + mouse) ----------
const keys = {}, pressed = {};
const KEYMAP = { ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',
  ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',
  Space:'jump',KeyE:'catalog',KeyQ:'binoc',Escape:'pause',KeyP:'pause',
  Enter:'enter',KeyM:'mute',Backspace:'back' };
addEventListener('keydown', e=>{
  const k=KEYMAP[e.code];
  if(k){ if(['left','right','up','down','jump'].includes(k)) e.preventDefault();
    if(!keys[k]) pressed[k]=true; keys[k]=true; handleEdge(k); }
});
addEventListener('keyup', e=>{ const k=KEYMAP[e.code]; if(k) keys[k]=false; });

let mx=0,my=0,mClick=false;
function toCanvas(e){ const r=cv.getBoundingClientRect(); mx=(e.clientX-r.left)*(VW/r.width); my=(e.clientY-r.top)*(VH/r.height); }
cv.addEventListener('mousemove', e=>toCanvas(e));
cv.addEventListener('mousedown', e=>{ toCanvas(e); mClick=true; });
cv.addEventListener('pointerdown', e=>{ if(e&&e.clientX!=null) toCanvas(e); });

// ---------- Estado ----------
const GS = { BOOT:0, TITLE:1, MENU:2, SELECT:3, HOWTO:4, BESTIARY:5,
  PLAY:7, PAUSE:8, OVER:9, PHASEWIN:10, GAMEWIN:11 };
let state = GS.BOOT;
let time=0, camX=0, camY=0, shake=0, hintMsg='', hintT=0;
let menuSel=0, biomeSel=0, pauseSel=0, overSel=0, winSel=0;
let cardToast=null;   // ficha não-bloqueante {a,t}

// ---------- Mundo ----------
const GROUND = 472, DEATH_Y = 660;
let plats=[], vines=[], water=[], lilies=[], hazards=[], animals=[], enemies=[], shots=[], fx=[];
let checkpoint={x:120,y:GROUND-64}, exitX=4980, levelW=5200;
let curBiome=0, biome=null, boss=null, bossDownT=0;

const SR={x:0,y:0,w:0,h:0};   // scratch rect (sem GC)
function rectsOverlap(a,b){ return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y; }

// ============================ DADOS: ANIMAIS (Bestiário) ============================
const ANIMALS = {
  mata:[
    {emoji:'🐒',name:'Mico-Leão-Dourado',sci:'Leontopithecus rosalia',status:'Em Perigo',
     fact:'Símbolo da luta contra a extinção. Vive nos galhos mais altos.'},
    {emoji:'🦜',name:'Tucano-de-Bico-Preto',sci:'Ramphastos vitellinus',status:'Pouco Preocupante',
     fact:'Dispersa sementes pela floresta, ajudando novas árvores a nascer.'},
    {emoji:'🦥',name:'Bicho-Preguiça',sci:'Bradypus variegatus',status:'Pouco Preocupante',
     fact:'Move-se devagar e não foge rápido — proteja-o dos robôs!'},
  ],
  amazonia:[
    {emoji:'🐬',name:'Boto-Cor-de-Rosa',sci:'Inia geoffrensis',status:'Em Perigo',
     fact:'Golfinho de água doce. Desative as redes para libertá-lo.'},
    {emoji:'🦭',name:'Peixe-Boi',sci:'Trichechus inunguis',status:'Vulnerável',
     fact:'Mamífero lento e dócil que vive no fundo do rio comendo plantas.'},
    {emoji:'🦜',name:'Arara-Azul',sci:'Anodorhynchus hyacinthinus',status:'Vulnerável',
     fact:'Vive no topo das árvores gigantes. Ao ser salva, solta uma pena.'},
  ],
  cerrado:[
    {emoji:'🦊',name:'Lobo-Guará',sci:'Chrysocyon brachyurus',status:'Vulnerável',
     fact:'Tímido! Aproxime-se devagar (sem correr) para não assustá-lo.',shy:true},
    {emoji:'🦡',name:'Tamanduá-Bandeira',sci:'Myrmecophaga tridactyla',status:'Vulnerável',
     fact:'Vive perto de cupinzeiros. Come milhares de formigas por dia.'},
    {emoji:'🦤',name:'Ema',sci:'Rhea americana',status:'Pouco Preocupante',
     fact:'A maior ave do Brasil. Não voa, mas corre muito rápido.'},
  ],
  pantanal:[
    {emoji:'🦩',name:'Tuiuiú',sci:'Jabiru mycteria',status:'Pouco Preocupante',
     fact:'Ave-símbolo do Pantanal. Faz ninhos no topo de árvores secas.'},
    {emoji:'🦫',name:'Capivara',sci:'Hydrochoerus hydrochaeris',status:'Pouco Preocupante',
     fact:'O maior roedor do mundo. Vive em famílias nas margens dos rios.'},
    {emoji:'🐆',name:'Onça-Pintada',sci:'Panthera onca',status:'Quase Ameaçada',
     fact:'O maior felino das Américas. Achá-la garante: Guardião Supremo!',rare:true},
  ],
};
const BIOME_IDS=['mata','amazonia','cerrado','pantanal'];
const BIOME_NAMES={mata:'MATA ATLÂNTICA',amazonia:'AMAZÔNIA',cerrado:'CERRADO',pantanal:'PANTANAL'};

// progresso (salvo localmente)
let progress={ unlocked:1, caught:{} };
function loadProgress(){ try{ const s=localStorage.getItem('gf_progress'); if(s)progress=JSON.parse(s); }catch(e){} if(!progress.caught)progress.caught={}; if(!progress.unlocked)progress.unlocked=1; }
function saveProgress(){ try{ localStorage.setItem('gf_progress',JSON.stringify(progress)); }catch(e){} }
function isCaught(bid,i){ return !!progress.caught[bid+':'+i]; }
function totalCaught(){ let n=0; for(const k in progress.caught) if(progress.caught[k]) n++; return n; }

// ============================ FUNDOS PRÉ-RENDERIZADOS ============================
const BG = {};
function mkCanvas(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }

function buildBG(id){
  if(BG[id]) return BG[id];
  const layers=[];
  if(id==='mata'){
    const tw=Math.ceil(bgPhoto.width*(VH/bgPhoto.height))||1080;
    const c=mkCanvas(tw,VH), g=c.getContext('2d'); g.imageSmoothingEnabled=true;
    g.drawImage(bgPhoto,0,0,tw,VH);
    layers.push({cv:c,par:0.4,tile:tw});
    BG[id]={sky:'#7fc6c9',layers,bot:'rgba(15,22,14,0.55)',end:'#aee0d0'};
  } else if(id==='amazonia'){
    layers.push(layerHills('#0f3b3a','#15514f',0.25));
    layers.push(layerTrees('#0c3330','#10403a',0.5,true));
    BG[id]={sky:'#163f44',layers,bot:'rgba(6,20,24,0.6)',end:'#0d2a2e'};
  } else if(id==='cerrado'){
    layers.push(layerHills('#caa24a','#b8863a',0.25));
    layers.push(layerTwisted('#5a3a1e','#3e2713',0.5));
    BG[id]={sky:'#e8b15a',layers,bot:'rgba(60,30,8,0.45)',end:'#f0d68a'};
  } else if(id==='pantanal'){
    layers.push(layerHills('#7a3f5a','#5a2d46',0.22));
    layers.push(layerTrees('#3a2238','#28182a',0.5,false));
    BG[id]={sky:'#e98a4a',layers,bot:'rgba(30,10,30,0.55)',end:'#7a3f5a'};
  }
  const b=BG[id];
  const sg=ctx.createLinearGradient(0,0,0,VH); sg.addColorStop(0,b.sky); sg.addColorStop(1,b.end); b.skyGrad=sg;
  const bg2=ctx.createLinearGradient(0,VH*0.5,0,VH); bg2.addColorStop(0,'rgba(0,0,0,0)'); bg2.addColorStop(1,b.bot); b.botGrad=bg2;
  return b;
}
function layerHills(c1,c2,par){
  const w=1200,h=VH,c=mkCanvas(w,h),g=c.getContext('2d');
  g.fillStyle=c1; g.beginPath(); g.moveTo(0,h);
  for(let x=0;x<=w;x+=60) g.lineTo(x, h*0.55 + Math.sin(x*0.012)*40 + Math.cos(x*0.03)*18);
  g.lineTo(w,h); g.fill();
  g.fillStyle=c2; g.beginPath(); g.moveTo(0,h);
  for(let x=0;x<=w;x+=50) g.lineTo(x, h*0.7 + Math.sin(x*0.018+2)*30);
  g.lineTo(w,h); g.fill();
  return {cv:c,par,tile:w};
}
function layerTrees(c1,c2,par,canopy){
  const w=1200,h=VH,c=mkCanvas(w,h),g=c.getContext('2d');
  for(let i=0;i<26;i++){ const x=Math.random()*w, th=120+Math.random()*180, tw=14+Math.random()*16;
    g.fillStyle=c2; g.fillRect(x,h-th,tw,th);
    g.fillStyle=c1; g.beginPath(); g.arc(x+tw/2,h-th,28+Math.random()*22,0,7); g.fill(); }
  if(canopy){ g.fillStyle=c1; g.globalAlpha=0.6; g.beginPath(); g.moveTo(0,0);
    for(let x=0;x<=w;x+=40) g.lineTo(x, 60+Math.sin(x*0.02)*30); g.lineTo(w,0); g.fill(); g.globalAlpha=1; }
  return {cv:c,par,tile:w};
}
function layerTwisted(c1,c2,par){
  const w=1200,h=VH,c=mkCanvas(w,h),g=c.getContext('2d');
  for(let i=0;i<14;i++){ const x=Math.random()*w, th=160+Math.random()*150;
    g.strokeStyle=c1; g.lineWidth=10+Math.random()*8; g.beginPath(); g.moveTo(x,h);
    let cx2=x; for(let y=h;y>h-th;y-=20){ cx2+=(Math.random()-0.5)*18; g.lineTo(cx2,y); } g.stroke();
    g.fillStyle=c2; g.beginPath(); g.arc(cx2,h-th,18,0,7); g.fill(); }
  return {cv:c,par,tile:w};
}

// ============================ CONSTRUÇÃO DAS FASES ============================
function pushAnimal(bid,i,x,y){ const d=ANIMALS[bid][i];
  animals.push({x,y,bid,idx:i,emoji:d.emoji,name:d.name,sci:d.sci,status:d.status,fact:d.fact,
    shy:!!d.shy,rare:!!d.rare,caught:isCaught(bid,i)}); }
function ground(x,w){ plats.push({x,y:GROUND,w,h:240,ground:true}); }
function branch(x,y,w){ plats.push({x,y,w,h:22,branch:true}); }
function resetWorld(){ plats=[];vines=[];water=[];lilies=[];hazards=[];animals=[];enemies=[];shots=[];fx=[]; boss=null; bossDownT=0; }

function loadPhase(b){
  resetWorld(); curBiome=b; const bid=BIOME_IDS[b]; biome=buildBG(bid);
  if(b===0) buildMata(); else if(b===1) buildAmazonia(); else if(b===2) buildCerrado(); else buildPantanal();
  P.hp=3; resetPlayer(false); checkpoint={x:120,y:GROUND-64}; beam=null; camX=0; camY=0;
}

function buildMata(){
  levelW=5200; exitX=4980;
  ground(-40,1240); ground(1330,1170);
  water.push({x:2500,y:GROUND-6,w:820,h:240}); plats.push({x:2500,y:GROUND+120,w:820,h:160,ground:true});
  ground(3320,1180); ground(4620,720);
  branch(470,330,150); branch(250,250,120); branch(820,210,150); branch(1020,150,140);
  branch(1500,300,130); branch(1760,250,120); branch(3520,300,140); branch(3760,210,150);
  branch(4150,300,140); branch(4760,250,150);
  vines.push({x:1035,y0:150,y1:GROUND}); vines.push({x:1545,y0:300,y1:GROUND});
  vines.push({x:3585,y0:300,y1:GROUND}); vines.push({x:4220,y0:300,y1:GROUND});
  pushAnimal('mata',1,545,330); pushAnimal('mata',2,1565,300); pushAnimal('mata',0,1085,150);
  enemies.push(new Patrol(360,250,560)); enemies.push(new Drone(880,760,1020));
  enemies.push(new Patrol(1880,1700,2160)); enemies.push(new Heavy(2360));
  plats.push({x:2300,y:GROUND-260,w:30,h:120,wall:true}); plats.push({x:2470,y:GROUND-260,w:30,h:120,wall:true});
  enemies.push(new Piranha(2620,3260)); enemies.push(new Drone(3760,3520,4040)); enemies.push(new Patrol(4660,4640,5060));
}

function buildAmazonia(){
  levelW=5400; exitX=5180;
  ground(-40,900);
  water.push({x:900,y:GROUND-6,w:1700,h:300}); plats.push({x:900,y:GROUND+160,w:1700,h:140,ground:true});
  ground(2600,500);
  water.push({x:3100,y:GROUND-6,w:1400,h:300}); plats.push({x:3100,y:GROUND+160,w:1400,h:140,ground:true});
  ground(4500,940);
  [1080,1360,1640,1960,2260, 3300,3600,3900,4200].forEach(x=>lilies.push({x,y:GROUND-10,w:96,h:18,baseY:GROUND-10,sink:0}));
  branch(640,300,140); branch(2760,300,150); branch(4700,260,150); branch(4980,200,150);
  vines.push({x:680,y0:300,y1:GROUND}); vines.push({x:4740,y0:260,y1:GROUND});
  pushAnimal('amazonia',2,5010,200); pushAnimal('amazonia',1,1750,GROUND+120); pushAnimal('amazonia',0,3800,GROUND+120);
  enemies.push(new Piranha(1000,2500)); enemies.push(new Piranha(1300,2400));
  enemies.push(new Drone(1700,1100,2400)); enemies.push(new Piranha(3200,4400));
  enemies.push(new Piranha(3500,4400)); enemies.push(new Drone(3900,3200,4400));
  enemies.push(new Heavy(4600)); enemies.push(new Patrol(4900,4560,5120));
}

function buildCerrado(){
  levelW=5200; exitX=4980;
  ground(-40,1600); ground(1700,1500); ground(3300,1900);
  branch(560,320,130); branch(900,250,120); branch(1300,300,130);
  branch(2100,300,140); branch(2500,230,130); branch(3700,300,140); branch(4300,250,140);
  vines.push({x:1330,y0:300,y1:GROUND});
  hazards.push({x:1180,y:GROUND-70,w:90,h:70,period:0,on:true});
  hazards.push({x:2750,y:GROUND-70,w:90,h:70,period:2.4,off:1.2,on:true});
  hazards.push({x:3050,y:GROUND-70,w:90,h:70,period:2.4,off:1.2,on:false,ph:1.8});
  hazards.push({x:4100,y:GROUND-70,w:90,h:70,period:2.0,off:1.0,on:true});
  pushAnimal('cerrado',2,820,GROUND-44);
  pushAnimal('cerrado',1,2350,GROUND-40);
  pushAnimal('cerrado',0,4500,GROUND-46);
  enemies.push(new Patrol(450,300,700)); enemies.push(new Drone(1000,760,1300));
  enemies.push(new Heavy(1500)); enemies.push(new Patrol(2000,1750,2300));
  enemies.push(new Drone(2900,2600,3200)); enemies.push(new Heavy(3500));
  enemies.push(new Patrol(4000,3700,4300));
}

function buildPantanal(){
  levelW=5600; exitX=5450;
  ground(-40,1500);
  water.push({x:1500,y:GROUND-6,w:900,h:300}); plats.push({x:1500,y:GROUND+160,w:900,h:140,ground:true});
  ground(2400,900);
  [1620,1860,2120].forEach(x=>lilies.push({x,y:GROUND-10,w:96,h:18,baseY:GROUND-10,sink:0}));
  ground(3300,2300);
  branch(560,300,130); branch(900,230,120); branch(3000,300,140);
  vines.push({x:600,y0:300,y1:GROUND});
  pushAnimal('pantanal',0,940,210); pushAnimal('pantanal',1,2700,GROUND-40); pushAnimal('pantanal',2,3150,GROUND-40);
  enemies.push(new Patrol(450,300,700)); enemies.push(new Drone(1100,800,1400));
  enemies.push(new Piranha(1600,2300)); enemies.push(new Patrol(2600,2450,2850));
  boss = new BossAlfa(4900); enemies.push(boss);
  plats.push({x:3300,y:GROUND-320,w:30,h:160,wall:true});
}

// ============================ JOGADOR ============================
const P = { x:120,y:GROUND-64,w:30,h:64,vx:0,vy:0,face:1,onGround:false,jumps:0,coyote:0,
  climbing:false,swimming:false,hp:3,inv:0,slow:0,aim:0,binoCd:0,state:'idle',anim:0,hurtAnim:0,dead:false };
const SPD=210,AIR=190,JUMP=470,GRAV=1500,MAXFALL=720,SWIM=160;

function resetPlayer(toCp){ P.x=toCp?checkpoint.x:120; P.y=toCp?checkpoint.y:GROUND-64;
  P.vx=0;P.vy=0;P.jumps=0;P.climbing=false;P.swimming=false;P.inv=1.0;P.slow=0;P.aim=0;P.dead=false;P.state='idle';P.anim=0; }

function nearVine(){ const cx=P.x+P.w/2; for(const v of vines){ if(Math.abs(cx-v.x)<22 && P.y+P.h>v.y0 && P.y<v.y1) return v; } return null; }
function inWater(){ const cx=P.x+P.w/2, cy=P.y+P.h*0.6; for(const w of water){ if(cx>w.x&&cx<w.x+w.w&&cy>w.y&&cy<w.y+w.h) return w; } return null; }

function solidsCollideX(){ for(const p of plats){ if(rectsOverlap(P,p)){ if(P.vx>0)P.x=p.x-P.w; else if(P.vx<0)P.x=p.x+p.w; P.vx=0; } }
  for(const l of lilies){ SR.x=l.x;SR.y=l.y;SR.w=l.w;SR.h=l.h; if(rectsOverlap(P,SR)){ if(P.vx>0)P.x=l.x-P.w; else if(P.vx<0)P.x=l.x+l.w; P.vx=0; } } }
function solidsCollideY(){ P.onGround=false;
  for(const p of plats){ if(rectsOverlap(P,p)){ if(P.vy>0){P.y=p.y-P.h;P.onGround=true;P.jumps=0;} else if(P.vy<0)P.y=p.y+p.h; P.vy=0; } }
  for(const l of lilies){ SR.x=l.x;SR.y=l.y;SR.w=l.w;SR.h=l.h;
    if(P.vy>=0 && rectsOverlap(P,SR) && (P.y+P.h-P.vy*STEP)<=l.y+8){ P.y=l.y-P.h; P.onGround=true; P.jumps=0; P.vy=0; l.standing=true; } } }

function updatePlayer(dt){
  if(P.inv>0)P.inv-=dt; if(P.slow>0)P.slow-=dt; if(P.binoCd>0)P.binoCd-=dt; if(P.aim>0)P.aim-=dt; if(P.hurtAnim>0)P.hurtAnim-=dt;
  const spdMul=P.slow>0?0.5:1;
  if(pressed.binoc && P.binoCd<=0 && !P.dead){ P.aim=0.32; P.binoCd=0.55; fireBinoc(); sfx('zap'); }

  P.swimming=!!inWater();
  const vine=nearVine();
  if(vine && (keys.up||keys.down) && !P.swimming) P.climbing=true;
  if(!vine) P.climbing=false;
  for(const l of lilies) l.standing=false;

  if(P.swimming){
    let ax=0,ay=0;
    if(keys.left){ax=-1;P.face=-1;} if(keys.right){ax=1;P.face=1;}
    if(keys.up||keys.jump)ay=-1; if(keys.down)ay=1;
    P.vx+=ax*900*dt; P.vy+=ay*820*dt; P.vy+=120*dt; P.vx*=0.86; P.vy*=0.86;
    P.vx=Math.max(-SWIM,Math.min(SWIM,P.vx)); P.vy=Math.max(-SWIM,Math.min(SWIM,P.vy));
    P.x+=P.vx*dt; P.y+=P.vy*dt;
    for(const p of plats){ if(rectsOverlap(P,p)){ if(P.vy>0){P.y=p.y-P.h;P.vy=0;} else if(P.vy<0){P.y=p.y+p.h;P.vy=0;} } }
    if(P.x<0)P.x=0; if(P.x>levelW-P.w)P.x=levelW-P.w;
    P.state=(Math.abs(P.vx)+Math.abs(P.vy)>30)?'run':'idle';
  } else if(P.climbing){
    P.vx=0;P.vy=0;
    if(keys.up)P.y-=130*dt; if(keys.down)P.y+=130*dt;
    if(pressed.jump){ P.climbing=false; P.vy=-JUMP*0.8; P.jumps=1; sfx('jump'); }
    P.x=vine.x-P.w/2; if(P.y<vine.y0-10)P.y=vine.y0-10; P.state='idle';
  } else {
    let ax=0; if(keys.left){ax=-1;P.face=-1;} if(keys.right){ax=1;P.face=1;}
    const acc=P.onGround?SPD:AIR; P.vx+=ax*acc*8*dt;
    const max=(P.onGround?SPD:AIR)*spdMul; P.vx=Math.max(-max,Math.min(max,P.vx));
    if(ax===0)P.vx*=P.onGround?0.7:0.92;
    P.vy+=GRAV*dt; if(P.vy>MAXFALL)P.vy=MAXFALL;
    if(P.onGround)P.coyote=0.1; else P.coyote-=dt;
    if(pressed.jump){
      if(P.onGround||P.coyote>0){ P.vy=-JUMP; P.jumps=1; P.coyote=0; sfx('jump'); }
      else if(P.jumps<2){ P.vy=-JUMP*0.92; P.jumps=2; sfx('jump'); fx.push(mkPuff(P.x+P.w/2,P.y+P.h)); }
    }
    P.x+=P.vx*dt; solidsCollideX(); if(P.x<0)P.x=0; if(P.x>levelW-P.w)P.x=levelW-P.w;
    P.y+=P.vy*dt; solidsCollideY();
    P.state=!P.onGround?'jump':(Math.abs(P.vx)>20?'run':'idle');
  }

  for(const l of lilies){ if(l.standing){ l.sink=Math.min(1,l.sink+dt*0.7); } else { l.sink=Math.max(0,l.sink-dt*1.3); } l.y=l.baseY + l.sink*60; }
  for(const h of hazards){ if(h.on){ SR.x=h.x;SR.y=h.y;SR.w=h.w;SR.h=h.h; if(rectsOverlap(P,SR)) hurt(1,true); } }

  if(pressed.catalog) tryCatalog();
  if(P.y>DEATH_Y) hurt(1,0,true);
  if(P.x>levelW*0.32 && checkpoint.x<levelW*0.3){ checkpoint={x:P.x|0,y:GROUND-64}; flash('✓ CHECKPOINT'); }
  P.anim+=dt;
  if(P.x+P.w/2>exitX) tryFinish();
}

function hurt(dmg,knock,isPit){ if(P.inv>0 && !isPit) return;
  P.hp-=dmg; P.inv=1.2; P.hurtAnim=0.3; shake=8; sfx('hurt');
  if(knock){ P.vx=-P.face*220; P.vy=-240; }
  if(isPit) resetPlayer(true);
  if(P.hp<=0){ P.hp=0; state=GS.OVER; overSel=0; } }

// ---------- Binóculo ----------
let beam=null;
function fireBinoc(){
  const ox=P.x+P.w/2+P.face*8, oy=P.y+P.h*0.42;
  beam={x:ox,y:oy,dir:P.face,len:300,t:0.32};
  for(const e of enemies){ if(!e.active) continue;
    const dx=(e.cx()-ox)*P.face; if(dx<0||dx>beam.len) continue;
    const dy=Math.abs(e.cy()-oy); const spread=30+dx*0.22;
    if(dy<spread){ if(e.kind==='boss') e.zap(); else { e.disable(); flash('🔆 ROBÔ DESATIVADO'); } } }
}

// ---------- Catalogar (não bloqueia) ----------
function tryCatalog(){
  for(const a of animals){ if(a.caught) continue;
    const d=Math.hypot((P.x+P.w/2)-a.x,(P.y+P.h/2)-a.y);
    if(d<82){
      if(a.shy && Math.abs(P.vx)>60){ flash('🐾 Aproxime-se devagar!'); a.x += (a.x>P.x?1:-1)*120; return; }
      a.caught=true; progress.caught[a.bid+':'+a.idx]=true; saveProgress();
      sfx('chime'); fx.push({type:'pop',x:a.x,y:a.y,t:1.0}); cardToast={a,t:4.2}; return;
    } }
}
function faunaCaught(){ return animals.filter(a=>a.caught).length; }

function tryFinish(){
  if(curBiome===3 && boss && !boss.dead){ P.x=exitX-P.w-4; P.vx=0; flash('Derrote o Robô Alfa!'); return; }
  if(faunaCaught()>=animals.length){
    if(curBiome>=BIOME_IDS.length-1){ state=GS.GAMEWIN; sfx('win'); }
    else { progress.unlocked=Math.max(progress.unlocked,curBiome+2); saveProgress(); state=GS.PHASEWIN; winSel=0; sfx('win'); }
  } else { flash('Faltam '+(animals.length-faunaCaught())+' animal(is)!'); P.x=exitX-P.w-4; P.vx=0; }
}
function flash(m){ hintMsg=m; hintT=2.2; }

// ============================ INIMIGOS ============================
class Enemy{ constructor(x,y,w,h){ this.x=x;this.y=y;this.w=w;this.h=h;this.active=true;this.t=0;this.state='move';this.face=-1;this.dead=false;this.dis=0; }
  cx(){return this.x+this.w/2;} cy(){return this.y+this.h/2;}
  hitsPlayer(){ if(!this.active) return false; SR.x=this.x;SR.y=this.y;SR.w=this.w;SR.h=this.h; return rectsOverlap(P,SR); }
  onCam(){ return this.cx()-camX>-140 && this.cx()-camX<VW+140; } }

class Patrol extends Enemy{ constructor(x,x0,x1){ super(x,GROUND-44,46,44); this.x0=x0;this.x1=x1;this.spd=58;this.attk=0;this.cd=0;this.kind='patrol'; }
  update(dt){ this.t+=dt; if(this.cd>0)this.cd-=dt;
    if(!this.active){ if(this.dis<1)this.dis+=dt; return; }
    const near=Math.abs(P.x+P.w/2-this.cx())<86 && Math.abs(P.y-this.y)<70;
    if(near && this.attk<=0 && this.cd<=0){ this.attk=0.32; this.cd=1.1; this.state='claw'; this.face=(P.x>this.x)?1:-1; }
    if(this.attk>0){ this.attk-=dt; if(this.attk<=0)this.state='move'; }
    else { this.x+=this.spd*this.face*dt; if(this.x<this.x0){this.x=this.x0;this.face=1;} if(this.x>this.x1){this.x=this.x1;this.face=-1;} }
    if(this.hitsPlayer()) hurt(1,true); }
  draw(){ if(!this.onCam())return; const sx=this.cx()-camX, by=this.y+this.h-camY+6;
    if(!this.active){ drawB(frameImg('hit',Math.min(this.dis,0.4)),sx,by,SCALE.hit,this.face<0,1,'rgba(70,90,150,0.35)'); return; }
    if(this.state==='claw') drawB(frameImg('claw',0.32-this.attk),sx,by,SCALE.claw,this.face<0);
    else drawB(frameImg('patrol',this.t),sx,by,SCALE.patrol,this.face<0); }
  disable(){ this.active=false; this.dis=0; shake=6; fx.push(mkSpark(this.cx(),this.cy())); } }

class Drone extends Enemy{ constructor(x,x0,x1){ super(x,200,56,26); this.x0=x0;this.x1=x1;this.baseY=205;this.spd=46;this.drop=2.2;this.kind='drone'; }
  update(dt){ this.t+=dt;
    if(!this.active){ this.y+=260*dt; if(this.y>GROUND-26)this.y=GROUND-26; return; }
    this.x+=this.spd*this.face*dt; if(this.x<this.x0){this.x=this.x0;this.face=1;} if(this.x>this.x1){this.x=this.x1;this.face=-1;}
    this.y=this.baseY+Math.sin(this.t*2.2)*16; this.drop-=dt;
    if(this.drop<=0 && Math.abs(P.x+P.w/2-this.cx())<260){ this.drop=2.8; shots.push({type:'net',x:this.cx(),y:this.y+10,vy:140,t:4}); }
    if(this.hitsPlayer()) hurt(1,true); }
  draw(){ if(!this.onCam())return; drawCc(frameImg('drone',this.t),this.cx()-camX,this.cy()-camY,SCALE.drone,this.face<0,1,this.active?null:'rgba(70,90,150,0.4)'); }
  disable(){ this.active=false; shake=5; fx.push(mkSpark(this.cx(),this.cy())); } }

class Heavy extends Enemy{ constructor(x){ super(x,GROUND-120,70,120); this.face=-1;this.cd=2.6;this.thr=0;this.kind='heavy';this.expl=0; }
  update(dt){ this.t+=dt;
    if(!this.active){ if(this.expl<0.7)this.expl+=dt; else this.dead=true; return; }
    this.face=(P.x>this.x)?1:-1; this.cd-=dt;
    if(this.thr>0){ this.thr-=dt; if(this.thr<=0) shots.push({type:'log',x:this.cx()+this.face*30,y:this.y+34,vx:this.face*230,vy:-40,t:5,rot:0}); }
    if(this.cd<=0 && Math.abs(P.x+P.w/2-this.cx())<420){ this.cd=2.8; this.thr=0.45; }
    if(this.hitsPlayer()){ hurt(1,true); P.vx=this.face*300; } }
  draw(){ if(!this.onCam())return; const sx=this.cx()-camX, by=this.y+this.h-camY+4;
    if(!this.active){ drawB(frameImg('explode',this.expl),sx,by,SCALE.explode,this.face<0); return; }
    if(this.thr>0) drawB(frameImg('throw',0.45-this.thr),sx,by,SCALE.heavy,this.face<0);
    else drawB(frameImg('heavy',this.t),sx,by,SCALE.heavy,this.face<0); }
  disable(){ this.active=false; this.expl=0; shake=12; for(let i=0;i<10;i++)fx.push(mkSpark(this.cx()+(Math.random()-0.5)*60,this.cy()+(Math.random()-0.5)*60)); } }

class Piranha extends Enemy{ constructor(x0,x1){ super(x0,GROUND+30,80,40); this.x0=x0;this.x1=x1;this.spd=85;this.face=1;this.kind='piranha';this.baseY=GROUND+34; }
  update(dt){ this.t+=dt; if(!this.active){ this.y+=40*dt; return; }
    if(Math.abs(P.x-this.cx())<300 && inWater()) this.face=(P.x>this.cx())?1:-1;
    this.x+=this.spd*this.face*dt; if(this.x<this.x0){this.x=this.x0;this.face=1;} if(this.x>this.x1){this.x=this.x1;this.face=-1;}
    this.y=this.baseY+Math.sin(this.t*3)*14;
    if(this.hitsPlayer()){ hurt(1,true); P.vx=this.face*260; P.vy=-120; } }
  draw(){ if(!this.onCam())return; drawCc(frameImg('piranha',this.t),this.cx()-camX,this.cy()-camY,SCALE.piranha,this.face<0,1,this.active?null:'rgba(70,90,150,0.4)'); }
  disable(){ this.active=false; shake=5; fx.push(mkSpark(this.cx(),this.cy())); } }

// CHEFE — Robô Alfa (Pantanal). Vulnerável quando "sobrecarrega".
class BossAlfa extends Enemy{ constructor(x){ super(x,GROUND-150,110,150); this.kind='boss'; this.face=-1; this.bhp=3;
    this.phase='idle'; this.timer=2.0; this.vuln=0; this.flash=0; this.expl=null; }
  update(dt){ this.t+=dt; if(this.flash>0)this.flash-=dt;
    if(!this.active){ if(this.expl==null)this.expl=0; if(this.expl<0.9)this.expl+=dt; else this.dead=true; return; }
    this.face=(P.x>this.x)?1:-1;
    if(this.vuln>0){ this.vuln-=dt; if(this.vuln<=0){ this.phase='idle'; this.timer=1.4; } return; }
    this.timer-=dt;
    if(this.timer<=0){
      const r=Math.random();
      if(r<0.4){ for(let i=0;i<3;i++) shots.push({type:'log',x:this.cx()+this.face*20,y:this.y+40+i*8,vx:this.face*(200+i*40),vy:-120-i*30,t:6,rot:0}); this.timer=1.8; sfx('hurt'); }
      else if(r<0.7){ shots.push({type:'net',x:P.x+P.w/2,y:60,vy:170,t:5}); this.timer=1.6; }
      else { this.phase='overload'; this.vuln=1.8; this.flash=1.8; flash('⚡ Use o binóculo AGORA!'); }
    }
    if(this.hitsPlayer()){ hurt(1,true); P.vx=this.face*320; } }
  zap(){ if(this.vuln>0){ this.bhp--; this.vuln=0; this.phase='idle'; this.timer=1.2; shake=10;
      for(let i=0;i<14;i++)fx.push(mkSpark(this.cx()+(Math.random()-0.5)*80,this.cy()+(Math.random()-0.5)*80));
      flash('💥 Núcleo atingido! ('+(3-this.bhp)+'/3)');
      if(this.bhp<=0){ this.active=false; shake=18; bossDownT=0; sfx('win'); flash('Robô Alfa desativado!'); }
    } else flash('Espere ele sobrecarregar!'); }
  draw(){ const sx=this.cx()-camX, by=this.y+this.h-camY;
    if(!this.active){ drawB(frameImg('explode',this.expl||0),sx,by,2.6,this.face<0); return; }
    if(this.vuln>0){ ctx.save(); ctx.globalAlpha=0.4+0.3*Math.abs(Math.sin(this.t*20)); ctx.fillStyle='#7af7ff'; ctx.beginPath(); ctx.arc(sx,by-70,80,0,7); ctx.fill(); ctx.restore(); }
    drawB(frameImg('heavy',this.t),sx,by,2.6,this.face<0,1,this.vuln>0?null:'rgba(150,40,40,0.45)');
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.fillStyle=this.vuln>0?'#aef9ff':'#ff5a3a'; ctx.globalAlpha=0.8+0.2*Math.sin(this.t*10);
    ctx.beginPath(); ctx.arc(sx,by-95,this.vuln>0?16:10,0,7); ctx.fill(); ctx.restore();
    const bw=240,bx=VW/2-bw/2,byy=92; ctx.fillStyle='rgba(0,0,0,0.5)'; rr(bx-3,byy-3,bw+6,16,5); ctx.fill();
    ctx.fillStyle='#5a1a1a'; rr(bx,byy,bw,10,4); ctx.fill();
    ctx.fillStyle='#ff5a3a'; rr(bx,byy,bw*Math.max(0,this.bhp)/3,10,4); ctx.fill();
    ctx.fillStyle='#ffd9d0'; ctx.font='9px "Press Start 2P",monospace'; ctx.textAlign='center'; ctx.fillText('ROBÔ ALFA',VW/2,byy-8); }
  disable(){} }

// ---------- Projéteis ----------
function updateShots(dt){
  for(const s of shots){ s.t-=dt;
    if(s.type==='net') s.y+=s.vy*dt;
    if(s.type==='log'){ s.vy+=900*dt; s.x+=s.vx*dt; s.y+=s.vy*dt; s.rot+=8*dt;
      if(s.y>GROUND-10){ s.y=GROUND-10; s.vy=0; s.vx*=0.6; if(Math.abs(s.vx)<10)s.t=Math.min(s.t,0.3); } }
    if(s.type==='net'){ SR.x=s.x-14;SR.y=s.y-14;SR.w=28;SR.h=28; } else { SR.x=s.x-22;SR.y=s.y-10;SR.w=44;SR.h=20; }
    if(rectsOverlap(P,SR)){ if(s.type==='net'){ P.slow=1.6; flash('🕸️ Preso na rede!'); } else hurt(1,true); s.t=0; }
  }
  if(shots.length) shots=shots.filter(s=>s.t>0);
}
function drawShots(){ for(const s of shots){ const x=s.x-camX,y=s.y-camY; if(x<-40||x>VW+40)continue;
  if(s.type==='net'){ ctx.strokeStyle='rgba(220,230,255,0.85)'; ctx.lineWidth=1.5;
    for(let i=-12;i<=12;i+=6){ ctx.beginPath();ctx.moveTo(x+i,y-12);ctx.lineTo(x+i,y+12);ctx.stroke(); ctx.beginPath();ctx.moveTo(x-12,y+i);ctx.lineTo(x+12,y+i);ctx.stroke(); }
    ctx.strokeStyle='rgba(120,140,200,0.9)'; ctx.strokeRect(x-13,y-13,26,26);
  } else { ctx.save(); ctx.translate(x,y); ctx.rotate(s.rot); ctx.fillStyle='#6b4422'; ctx.strokeStyle='#3e2611'; ctx.lineWidth=2;
    ctx.fillRect(-22,-8,44,16); ctx.strokeRect(-22,-8,44,16); ctx.fillStyle='#caa06a';
    ctx.beginPath();ctx.ellipse(-22,0,5,8,0,0,7);ctx.fill(); ctx.beginPath();ctx.ellipse(22,0,5,8,0,0,7);ctx.fill(); ctx.restore(); } } }

// ---------- Partículas ----------
function mkPuff(x,y){ return {type:'puff',x,y,t:0.4,parts:Array.from({length:6},()=>({a:Math.random()*7,s:30+Math.random()*40}))}; }
function mkSpark(x,y){ return {type:'spark',x,y,t:0.5,parts:Array.from({length:8},()=>({a:Math.random()*7,s:60+Math.random()*120,c:Math.random()<0.5?'#ffe27a':'#aee9ff'}))}; }
function updateFx(dt){ if(!fx.length)return; for(const p of fx)p.t-=dt; fx=fx.filter(p=>p.t>0); }
function drawFx(){ for(const p of fx){ const x=p.x-camX,y=p.y-camY;
  if(p.type==='puff'){ ctx.globalAlpha=p.t/0.4; ctx.fillStyle='#dfeee0'; for(const q of p.parts){ const d=(0.4-p.t)*q.s; ctx.beginPath();ctx.arc(x+Math.cos(q.a)*d,y-Math.abs(Math.sin(q.a))*d,3,0,7);ctx.fill(); } ctx.globalAlpha=1; }
  else if(p.type==='spark'){ for(const q of p.parts){ const d=(0.5-p.t)*q.s; ctx.fillStyle=q.c; ctx.fillRect(x+Math.cos(q.a)*d-2,y+Math.sin(q.a)*d-2,4,4);} }
  else if(p.type==='pop'){ ctx.globalAlpha=Math.min(1,p.t); ctx.fillStyle='#ffe27a'; ctx.font='bold 20px "Press Start 2P",monospace'; ctx.textAlign='center'; ctx.fillText('+1',x,y-40-(1-p.t)*30); ctx.globalAlpha=1; } } }

// ============================ UPDATE ============================
function update(dt){
  time+=dt; if(shake>0)shake=Math.max(0,shake-dt*40); if(hintT>0)hintT-=dt;
  if(cardToast){ cardToast.t-=dt; if(cardToast.t<=0)cardToast=null; }
  updatePlayer(dt);
  for(const h of hazards){ if(h.period>0){ const cyc=h.period+(h.off||h.period); const ph=(time+(h.ph||0))%cyc; h.on=ph<h.period; } }
  for(const e of enemies) e.update(dt);
  if(enemies.some(e=>e.dead)) enemies=enemies.filter(e=>!e.dead);
  if(curBiome===3 && boss && !boss.active && boss.expl!=null){ bossDownT+=dt; if(bossDownT>1.4){ state=GS.GAMEWIN; sfx('win'); } }
  updateShots(dt); updateFx(dt);
  if(beam){ beam.t-=dt; if(beam.t<=0)beam=null; }
  const tx=P.x+P.w/2-VW/2; camX+=(tx-camX)*Math.min(1,dt*8); camX=Math.max(0,Math.min(levelW-VW,camX));
  const ty=P.y-VH*0.55; camY+=(Math.max(-40,Math.min(80,ty))-camY)*Math.min(1,dt*6);
}

// ============================ RENDER (mundo) ============================
function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

function drawBackground(){
  ctx.fillStyle=biome.skyGrad; ctx.fillRect(0,0,VW,VH);
  for(const L of biome.layers){ const tw=L.tile, off=(camX*L.par)%tw; let start=-off-tw;
    for(let x=start;x<VW+tw;x+=tw) ctx.drawImage(L.cv,x|0,0,tw,VH); }
  ctx.fillStyle=biome.botGrad; ctx.fillRect(0,0,VW,VH);
}
function drawPlats(){
  const gt = curBiome===2?'#caa24a': curBiome===3?'#6a7d4a':'#4f8a31';
  const gt2= curBiome===2?'#e0c060': curBiome===3?'#86a35a':'#6cb544';
  const dirt= curBiome===2?'#7a5a2a': curBiome===3?'#4a3a26':'#3b2a18';
  for(const p of plats){ if(p.wall)continue; const x=p.x-camX,y=p.y-camY; if(x>VW||x+p.w<0)continue;
    if(p.branch){ ctx.fillStyle='#5b3a1d'; ctx.strokeStyle='#3c2512'; ctx.lineWidth=2; rr(x,y,p.w,p.h,6); ctx.fill(); ctx.stroke();
      ctx.fillStyle=gt; rr(x-2,y-6,p.w+4,9,5); ctx.fill();
    } else { ctx.fillStyle=dirt; ctx.fillRect(x,y+8,p.w,p.h);
      ctx.fillStyle=gt; ctx.fillRect(x,y,p.w,12); ctx.fillStyle=gt2; ctx.fillRect(x,y,p.w,5);
      ctx.fillStyle=gt2; for(let i=10;i<p.w;i+=46){ ctx.beginPath();ctx.moveTo(x+i,y);ctx.lineTo(x+i+4,y-7);ctx.lineTo(x+i+8,y);ctx.fill(); } } }
}
function drawLilies(){ for(const l of lilies){ const x=l.x-camX,y=l.y-camY; if(x>VW||x+l.w<0)continue;
  ctx.fillStyle='#2f7d3a'; ctx.beginPath(); ctx.ellipse(x+l.w/2,y+l.h/2,l.w/2,l.h/2+4,0,0,7); ctx.fill();
  ctx.fillStyle='#3fa050'; ctx.beginPath(); ctx.ellipse(x+l.w/2,y+l.h/2-2,l.w/2-6,l.h/2,0,0,7); ctx.fill();
  ctx.strokeStyle='#1d5a26'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+l.w/2,y+2); ctx.lineTo(x+l.w/2+6,y+l.h-2); ctx.stroke(); } }
function drawVines(){ for(const v of vines){ const x=v.x-camX; if(x<-20||x>VW+20)continue;
  ctx.strokeStyle='#3f6b2a'; ctx.lineWidth=6; ctx.beginPath();
  for(let y=v.y0;y<=v.y1;y+=10){ const xx=x+Math.sin((y+time*40)*0.04)*4; if(y===v.y0)ctx.moveTo(xx,y-camY); else ctx.lineTo(xx,y-camY);} ctx.stroke();
  ctx.strokeStyle='#5a9c3e'; ctx.lineWidth=2; ctx.stroke();
  ctx.fillStyle='#5a9c3e'; for(let y=v.y0+20;y<v.y1;y+=70){ const xx=x+Math.sin((y+time*40)*0.04)*4; ctx.beginPath();ctx.ellipse(xx-7,y-camY,8,4,0.6,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(xx+7,y-camY,8,4,-0.6,0,7);ctx.fill(); } } }
function drawWater(){ for(const w of water){ const x=w.x-camX,y=w.y-camY; if(x>VW||x+w.w<0)continue;
  const g=ctx.createLinearGradient(0,y,0,y+w.h); g.addColorStop(0,'rgba(40,120,150,0.5)'); g.addColorStop(1,'rgba(15,55,80,0.78)');
  ctx.fillStyle=g; ctx.fillRect(x,y,w.w,w.h);
  ctx.strokeStyle='rgba(180,230,240,0.55)'; ctx.lineWidth=2; ctx.beginPath();
  for(let i=0;i<=w.w;i+=14){ const yy=y+Math.sin((i+time*120)*0.05)*3; if(i===0)ctx.moveTo(x+i,yy); else ctx.lineTo(x+i,yy);} ctx.stroke(); } }
function drawHazards(){ for(const h of hazards){ if(!h.on)continue; const x=h.x-camX,y=h.y-camY; if(x>VW||x+h.w<0)continue;
  for(let i=0;i<5;i++){ const fx2=x+8+i*16+Math.sin(time*12+i)*3, fh=h.h*(0.6+0.4*Math.abs(Math.sin(time*9+i*1.7)));
    ctx.fillStyle=i%2?'#ff7a1a':'#ffd24a'; ctx.beginPath(); ctx.moveTo(fx2,y+h.h); ctx.quadraticCurveTo(fx2-6,y+h.h-fh*0.6,fx2,y+h.h-fh); ctx.quadraticCurveTo(fx2+6,y+h.h-fh*0.6,fx2,y+h.h); ctx.fill(); } } }
function drawAnimals(){ for(const a of animals){ if(a.caught)continue; const x=a.x-camX,y=a.y-camY; if(x<-40||x>VW+40)continue;
  const bob=Math.sin(time*2+a.x)*3; ctx.font='34px serif'; ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.fillText(a.emoji,x,y+bob);
  const d=Math.hypot((P.x+P.w/2)-a.x,(P.y+P.h/2)-a.y);
  if(d<82){ const yy=y-44+Math.sin(time*5)*3; ctx.font='22px serif'; ctx.fillText('🔍',x,yy);
    ctx.fillStyle='#fff'; ctx.font='10px "Press Start 2P",monospace'; ctx.fillText('E',x,yy-22); } } }
function drawBeam(){ if(!beam)return; const x=beam.x-camX,y=beam.y-camY,d=beam.dir,L=beam.len,a=Math.min(1,beam.t/0.32);
  ctx.save(); ctx.globalAlpha=a*0.85; ctx.globalCompositeOperation='lighter';
  const g=ctx.createLinearGradient(x,y,x+d*L,y); g.addColorStop(0,'rgba(255,245,200,0.95)'); g.addColorStop(1,'rgba(255,220,120,0)');
  ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(x,y-6); ctx.lineTo(x+d*L,y-(30+L*0.22)); ctx.lineTo(x+d*L,y+(30+L*0.22)); ctx.lineTo(x,y+6); ctx.closePath(); ctx.fill();
  ctx.globalAlpha=a; ctx.fillStyle='#fffbe6'; ctx.beginPath(); ctx.arc(x,y,7,0,7); ctx.fill(); ctx.restore(); }
function drawPlayer(){ const sx=P.x+P.w/2-camX, by=P.y+P.h-camY;
  if(!P.swimming){ ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(sx,by-2,18,5,0,0,7); ctx.fill(); }
  let st=P.state; if(P.aim>0)st='idle';
  const blink=P.inv>0 && Math.floor(time*20)%2===0;
  drawB(frameImg(st,P.anim),sx,by,SCALE.run,P.face<0,blink?0.35:1,P.hurtAnim>0?'rgba(255,80,80,0.4)':null);
  if(P.aim>0){ ctx.save(); ctx.globalAlpha=0.9; ctx.fillStyle='#cfe9ff'; ctx.beginPath(); ctx.arc(sx+P.face*16,by-42,4,0,7); ctx.fill(); ctx.restore(); } }

function drawHUD(){
  ctx.textAlign='left'; ctx.textBaseline='alphabetic'; ctx.font='22px serif';
  for(let i=0;i<3;i++){ ctx.globalAlpha=i<P.hp?1:0.25; ctx.fillText('❤️',14+i*30,36); } ctx.globalAlpha=1;
  ctx.fillStyle='rgba(0,0,0,0.45)'; rr(12,46,180,22,6); ctx.fill();
  ctx.fillStyle='#dff0c0'; ctx.font='10px "Press Start 2P",monospace'; ctx.fillText(BIOME_NAMES[BIOME_IDS[curBiome]],20,61);
  const fc=faunaCaught(); ctx.textAlign='left'; ctx.fillStyle='rgba(0,0,0,0.45)'; rr(VW/2-70,12,140,30,8); ctx.fill();
  ctx.font='16px serif'; ctx.fillText('🐾',VW/2-58,33); ctx.font='13px "Press Start 2P",monospace'; ctx.fillStyle='#ffe27a'; ctx.fillText(fc+' / '+animals.length,VW/2-30,32);
  const mw=200,mxp=VW/2-mw/2,myp=50; ctx.fillStyle='rgba(0,0,0,0.4)'; rr(mxp,myp,mw,10,5); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=1; rr(mxp,myp,mw,10,5); ctx.stroke();
  for(const a of animals){ const px=mxp+(a.x/levelW)*mw; ctx.fillStyle=a.caught?'#6cb544':'#ffe27a'; ctx.beginPath();ctx.arc(px,myp+5,2.5,0,7);ctx.fill(); }
  ctx.fillStyle='#3fd6ff'; ctx.fillRect(mxp+(exitX/levelW)*mw-1,myp+1,3,8);
  const dpx=mxp+(P.x/levelW)*mw; ctx.fillStyle='#fff'; ctx.beginPath();ctx.arc(dpx,myp+5,3.5,0,7);ctx.fill(); ctx.strokeStyle='#1a1a1a';ctx.lineWidth=1;ctx.stroke();
  let alert=false; for(const e of enemies){ if(e.active && e.kind!=='boss' && Math.abs(e.cx()-(P.x+P.w/2))<360){alert=true;break;} }
  if(alert && Math.floor(time*4)%2===0){ ctx.fillStyle='rgba(0,0,0,0.4)'; rr(VW-128,12,116,26,6); ctx.fill(); ctx.textAlign='right'; ctx.font='12px "Press Start 2P",monospace'; ctx.fillStyle='#ff5a5a'; ctx.fillText('⚠ ROBÔ',VW-18,30); }
  ctx.textAlign='right'; ctx.font='9px "Press Start 2P",monospace'; ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.fillText('Q: binóculo  E: catalogar  ESC: pausa',VW-14,VH-14);
  if(cardToast) drawCardToast();
  if(hintT>0){ ctx.globalAlpha=Math.min(1,hintT); ctx.textAlign='center'; ctx.font='12px "Press Start 2P",monospace';
    const tw=ctx.measureText(hintMsg).width; ctx.fillStyle='rgba(0,0,0,0.65)'; rr(VW/2-tw/2-12,VH-72,tw+24,28,8); ctx.fill();
    ctx.fillStyle='#ffe27a'; ctx.fillText(hintMsg,VW/2,VH-53); ctx.globalAlpha=1; }
}
function drawCardToast(){ const a=cardToast.a, w=300,h=110,x=VW-w-16,y=VH-h-40;
  const slide = cardToast.t>3.8 ? (4.2-cardToast.t)/0.4 : (cardToast.t<0.5? cardToast.t/0.5 : 1);
  ctx.save(); ctx.globalAlpha=Math.min(1,slide);
  ctx.fillStyle='#1d2a16'; ctx.strokeStyle='#ffe27a'; ctx.lineWidth=3; rr(x,y,w,h,10); ctx.fill(); ctx.stroke();
  ctx.font='40px serif'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(a.emoji,x+14,y+40);
  ctx.textBaseline='alphabetic'; ctx.fillStyle='#fff'; ctx.font='10px "Press Start 2P",monospace'; ctx.fillText(a.name.slice(0,22),x+64,y+26);
  ctx.fillStyle='#a9c98f'; ctx.font='italic 11px Georgia,serif'; ctx.fillText(a.sci,x+64,y+44);
  ctx.fillStyle='#ffd27a'; ctx.font='9px "Press Start 2P",monospace'; ctx.fillText(a.status,x+64,y+60);
  ctx.fillStyle='#e8f0df'; ctx.font='10px Georgia,serif'; wrap(a.fact,x+14,y+82,w-28,13,'left');
  ctx.restore(); }

function render(){ ctx.save(); if(shake>0)ctx.translate((Math.random()-0.5)*shake,(Math.random()-0.5)*shake);
  drawBackground(); drawWater(); drawLilies(); drawVines(); drawPlats(); drawHazards(); drawAnimals();
  for(const e of enemies) e.draw(); drawShots(); drawBeam(); drawPlayer(); drawFx();
  ctx.restore(); drawHUD(); }

// ============================ TELAS / MENUS ============================
function dim(a){ ctx.fillStyle='rgba(8,12,8,'+a+')'; ctx.fillRect(0,0,VW,VH); }
function center(t,y,s,c){ ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.fillStyle=c||'#fff'; ctx.font=s+'px "Press Start 2P",monospace'; ctx.fillText(t,VW/2,y); }
function wrap(text,cx,y,maxw,lh,align){ const words=text.split(' '); let line='',lines=[];
  for(const wd of words){ const t=line?line+' '+wd:wd; if(ctx.measureText(t).width>maxw){lines.push(line);line=wd;} else line=t; } if(line)lines.push(line);
  ctx.textAlign=align||'center'; lines.forEach((l,i)=>ctx.fillText(l,cx,y+i*lh)); }

function menuBackdrop(){ const b=buildBG('mata'); ctx.fillStyle=b.skyGrad; ctx.fillRect(0,0,VW,VH);
  for(const L of b.layers){ const tw=L.tile, off=(time*12*L.par)%tw; let s=-off-tw; for(let x=s;x<VW+tw;x+=tw) ctx.drawImage(L.cv,x|0,0,tw,VH); }
  dim(0.45); }

function hitBtn(x,y,w,h){ const hover = mx>=x&&mx<=x+w&&my>=y&&my<=y+h; if(hover&&mClick)return 2; return hover?1:0; }
function button(label,x,y,w,h,sel){ const st=hitBtn(x,y,w,h); const on=sel||st>0;
  ctx.fillStyle=on?'rgba(255,226,122,0.18)':'rgba(0,0,0,0.4)'; rr(x,y,w,h,8); ctx.fill();
  ctx.strokeStyle=on?'#ffe27a':'rgba(255,255,255,0.3)'; ctx.lineWidth=on?3:1.5; rr(x,y,w,h,8); ctx.stroke();
  ctx.fillStyle=on?'#fff':'#cfe0c0'; ctx.font='13px "Press Start 2P",monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(label,x+w/2,y+h/2); ctx.textBaseline='alphabetic'; return st===2; }

// ---- TÍTULO ----
function drawTitle(){ menuBackdrop();
  const yb=Math.sin(time*1.5)*6;
  if(ready) drawB(frameImg('idle',time),VW/2-180,VH/2-86+yb*0.5,2.8,false);
  center('GUARDIÕES',VH/2-120+yb,40,'#ffe27a'); center('DA FAUNA',VH/2-76+yb,40,'#ffe27a');
  center('O Protocolo Ferrugem',VH/2-30,13,'#dff0c0');
  if(Math.floor(time*2)%2===0) center('▶ PRESSIONE ENTER / CLIQUE',VH/2+64,13,'#fff');
  center('Eduardo • Guilherme • João Pedro   —   PAC3',VH-26,8,'#7c9a6a');
}
// ---- MENU PRINCIPAL ----
function drawMenu(){ menuBackdrop();
  center('GUARDIÕES DA FAUNA',96,26,'#ffe27a');
  const items=['▶  JOGAR','🗺  SELECIONAR BIOMA','📖  BESTIÁRIO','❔  COMO JOGAR',(AUD.muted?'🔇  SOM: OFF':'🔊  SOM: ON')];
  const w=360,x=VW/2-w/2; let y=150;
  for(let i=0;i<items.length;i++){ if(button(items[i],x,y,w,46,i===menuSel)) selectMenu(i); y+=58; }
  center('Setas ▲ ▼ e ENTER • ou use o mouse',VH-24,9,'#9bb585');
}
function selectMenu(i){ menuSel=i;
  if(i===0){ startBiome(0); }
  else if(i===1){ go(GS.SELECT); }
  else if(i===2){ go(GS.BESTIARY); }
  else if(i===3){ go(GS.HOWTO); }
  else if(i===4){ AUD.muted=!AUD.muted; } }

// ---- SELEÇÃO DE BIOMA ----
function drawSelect(){ menuBackdrop(); center('SELECIONAR BIOMA',64,22,'#ffe27a');
  const cols=BIOME_IDS.length, cw=200, gap=20, totalW=cols*cw+(cols-1)*gap, x0=VW/2-totalW/2, y=130, ch=240;
  const cols2=['#4f8a31','#15a0a0','#caa24a','#e98a4a'];
  for(let i=0;i<cols;i++){ const x=x0+i*(cw+gap); const unlocked=i<progress.unlocked;
    const st=hitBtn(x,y,cw,ch); const on=(i===biomeSel)||st>0;
    ctx.fillStyle='rgba(0,0,0,0.45)'; rr(x,y,cw,ch,12); ctx.fill();
    ctx.strokeStyle=on?'#ffe27a':'rgba(255,255,255,0.25)'; ctx.lineWidth=on?3:1.5; rr(x,y,cw,ch,12); ctx.stroke();
    ctx.fillStyle=cols2[i]; rr(x+12,y+12,cw-24,84,8); ctx.fill();
    ctx.fillStyle='#fff'; ctx.font='11px "Press Start 2P",monospace'; ctx.textAlign='center'; ctx.fillText('FASE '+(i+1),x+cw/2,y+120);
    ctx.font='10px "Press Start 2P",monospace'; ctx.fillStyle='#dff0c0'; wrap(BIOME_NAMES[BIOME_IDS[i]],x+cw/2,y+146,cw-20,14);
    let c=0; for(let k=0;k<ANIMALS[BIOME_IDS[i]].length;k++) if(isCaught(BIOME_IDS[i],k))c++;
    ctx.fillStyle='#ffe27a'; ctx.font='9px "Press Start 2P",monospace'; ctx.fillText('🐾 '+c+'/'+ANIMALS[BIOME_IDS[i]].length,x+cw/2,y+182);
    if(!unlocked){ ctx.fillStyle='rgba(0,0,0,0.62)'; rr(x,y,cw,ch,12); ctx.fill(); ctx.font='30px serif'; ctx.textAlign='center'; ctx.fillText('🔒',x+cw/2,y+ch/2+8); }
    else { if(button('JOGAR',x+30,y+ch-44,cw-60,32,false)) startBiome(i); }
  }
  if(button('‹ VOLTAR',24,VH-54,150,38,false)) go(GS.MENU);
  center('Conclua uma fase para desbloquear a próxima',VH-18,9,'#9bb585');
}
function startBiome(i){ if(i>=progress.unlocked) return; biomeSel=i; loadPhase(i); go(GS.PLAY); AUD.ensure(); }

// ---- COMO JOGAR ----
function drawHowto(){ menuBackdrop(); center('COMO JOGAR',58,22,'#ffe27a');
  const x=VW/2;
  const blocks=[
    ['HISTÓRIA',1],
    ['O "Protocolo Ferrugem" reativou robôs que tentam',0],
    ['"organizar" a natureza, engaiolando os animais.',0],
    ['Você é Leo, o jovem Guardião, e usa o Binóculo Solar',0],
    ['para desligar os robôs — sem violência.',0],
    ['',0],
    ['CONTROLES',1],
    ['◀ ▶ / A D : mover     ESPAÇO : pular / pulo duplo',0],
    ['▲ ▼ / W S : escalar cipó / nadar',0],
    ['Q : Binóculo Solar      E : catalogar animal',0],
    ['ESC : pausar            M : som',0],
    ['',0],
    ['OBJETIVO',1],
    ['Catalogue os animais do bioma e chegue à saída.',0],
    ['No Pantanal, enfrente o Robô Alfa!',0],
  ];
  let y=98; for(const [t,head] of blocks){ if(head){ ctx.fillStyle='#ffe27a'; ctx.font='12px "Press Start 2P",monospace'; }
    else { ctx.fillStyle='#e8f0df'; ctx.font='13px Georgia, serif'; }
    ctx.textAlign='center'; ctx.fillText(t,x,y); y+= t===''?10:25; }
  if(button('‹ VOLTAR',24,VH-54,150,38,false)) go(GS.MENU);
}
// ---- BESTIÁRIO ----
function drawBestiary(){
  menuBackdrop(); center('BESTIÁRIO',52,22,'#ffe27a');
  center('Catalogados: '+totalCaught()+' / 12',80,10,'#dff0c0');
  const x0=66,y0=104,cardW=404,cardH=84,gapY=10,colGap=20;
  const clipTop=y0-4, clipBot=VH-64;
  const rows=Math.ceil(12/2), totalH=y0+rows*(cardH+gapY);
  const maxScroll=Math.max(0,totalH-clipBot);
  bestiaryScroll=Math.max(0,Math.min(maxScroll,bestiaryScroll));
  ctx.save(); ctx.beginPath(); ctx.rect(0,clipTop,VW,clipBot-clipTop); ctx.clip();
  let idx=0;
  for(let b=0;b<BIOME_IDS.length;b++){ const bid=BIOME_IDS[b];
    for(let i=0;i<ANIMALS[bid].length;i++){ const col=idx%2, row=(idx/2)|0;
      const x=x0+col*(cardW+colGap), y=y0+row*(cardH+gapY)-bestiaryScroll; idx++;
      if(y+cardH<clipTop||y>clipBot) continue;
      const a=ANIMALS[bid][i], got=isCaught(bid,i);
      ctx.fillStyle=got?'rgba(29,42,22,0.92)':'rgba(0,0,0,0.5)'; ctx.strokeStyle=got?'#ffe27a':'rgba(255,255,255,0.2)'; ctx.lineWidth=got?2:1; rr(x,y,cardW,cardH,8); ctx.fill(); ctx.stroke();
      ctx.font='38px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.globalAlpha=got?1:0.25; ctx.fillText(got?a.emoji:'❔',x+32,y+cardH/2); ctx.globalAlpha=1; ctx.textBaseline='alphabetic';
      if(got){ ctx.textAlign='left'; ctx.fillStyle='#fff'; ctx.font='9px "Press Start 2P",monospace'; ctx.fillText(a.name.slice(0,26),x+58,y+22);
        ctx.fillStyle='#a9c98f'; ctx.font='italic 10px Georgia,serif'; ctx.fillText(a.sci,x+58,y+38);
        ctx.fillStyle='#ffd27a'; ctx.font='8px "Press Start 2P",monospace'; ctx.fillText(a.status,x+58,y+52);
        ctx.fillStyle='#e8f0df'; ctx.font='10px Georgia,serif'; wrap(a.fact,x+58,y+67,cardW-72,12,'left');
      } else { ctx.textAlign='left'; ctx.fillStyle='#7c9a6a'; ctx.font='9px "Press Start 2P",monospace'; ctx.fillText('? ? ?',x+58,y+30);
        ctx.fillStyle='#5d7a4a'; ctx.font='10px Georgia,serif'; ctx.fillText(BIOME_NAMES[bid],x+58,y+52); }
    } }
  ctx.restore();
  if(maxScroll>0){
    const sbx=VW-14,sby=clipTop,sbh=clipBot-clipTop;
    const th=Math.max(40,sbh*sbh/(totalH-y0+sbh));
    ctx.fillStyle='rgba(0,0,0,0.4)'; rr(sbx,sby,8,sbh,4); ctx.fill();
    ctx.fillStyle='rgba(255,226,122,0.75)'; rr(sbx,sby+(bestiaryScroll/maxScroll)*(sbh-th),8,th,4); ctx.fill();
  }
  if(button('‹ VOLTAR',24,VH-54,150,38,false)) go(GS.MENU);
}
// ---- PAUSE ----
function drawPause(){ render(); dim(0.62); center('⏸ PAUSADO',150,24,'#fff');
  const w=320,x=VW/2-w/2; let y=210;
  if(button('CONTINUAR',x,y,w,46,pauseSel===0)) go(GS.PLAY); y+=58;
  if(button('RECOMEÇAR FASE',x,y,w,46,pauseSel===1)){ loadPhase(curBiome); go(GS.PLAY); } y+=58;
  if(button((AUD.muted?'🔇 SOM: OFF':'🔊 SOM: ON'),x,y,w,46,pauseSel===2)) AUD.muted=!AUD.muted; y+=58;
  if(button('MENU PRINCIPAL',x,y,w,46,pauseSel===3)) go(GS.MENU);
}
// ---- OVER ----
function drawOver(){ render(); dim(0.72); center('💀 GAME OVER',180,26,'#ff6a6a'); center('A floresta precisa de você!',222,12,'#dff0c0');
  const w=320,x=VW/2-w/2; let y=270;
  if(button('TENTAR DE NOVO',x,y,w,46,overSel===0)){ loadPhase(curBiome); go(GS.PLAY); } y+=58;
  if(button('MENU PRINCIPAL',x,y,w,46,overSel===1)) go(GS.MENU);
}
// ---- FASE COMPLETA ----
function drawPhaseWin(){ render(); dim(0.6); center('🌿 FASE COMPLETA! 🌿',170,22,'#ffe27a');
  center(BIOME_NAMES[BIOME_IDS[curBiome]]+' restaurada',210,12,'#dff0c0');
  const w=320,x=VW/2-w/2; let y=270; const hasNext=curBiome+1<BIOME_IDS.length;
  if(hasNext){ if(button('PRÓXIMA FASE  ▶',x,y,w,46,winSel===0)){ loadPhase(curBiome+1); go(GS.PLAY); } y+=58; }
  if(button('SELECIONAR BIOMA',x,y,w,46,winSel===(hasNext?1:0))) go(GS.SELECT); y+=58;
  if(button('MENU PRINCIPAL',x,y,w,46,winSel===(hasNext?2:1))) go(GS.MENU);
}
// ---- VITÓRIA FINAL ----
function drawGameWin(){ menuBackdrop(); dim(0.2);
  center('🏆 VOCÊ VENCEU! 🏆',116,26,'#ffe27a');
  center('O Protocolo Ferrugem foi desativado',156,12,'#dff0c0');
  center('e a harmonia voltou a todos os biomas.',180,12,'#dff0c0');
  const onca=isCaught('pantanal',2);
  center(onca?'★ Conquista: GUARDIÃO SUPREMO ★':'Dica: ache a Onça-Pintada p/ "Guardião Supremo"',224, onca?13:10, onca?'#ffd24a':'#9bb585');
  center('Animais catalogados: '+totalCaught()+' / 12',262,12,'#fff');
  if(ready) drawB(frameImg('idle',time),VW/2,VH/2+150,3.0,false);
  const w=320,x=VW/2-w/2,y=330;
  if(button('VOLTAR AO MENU',x,y,w,46,true)) go(GS.MENU);
}

// ============================ FLUXO ============================
function go(s){ state=s; mClick=false; }
function handleEdge(k){
  if(k==='mute'){ AUD.muted=!AUD.muted; return; }
  if(state===GS.TITLE){ if(k==='enter'||k==='jump') go(GS.MENU); return; }
  if(state===GS.MENU){ if(k==='up')menuSel=(menuSel+4)%5; else if(k==='down')menuSel=(menuSel+1)%5; else if(k==='enter')selectMenu(menuSel); else if(k==='back')go(GS.TITLE); return; }
  if(state===GS.SELECT){ if(k==='left')biomeSel=(biomeSel+3)%4; else if(k==='right')biomeSel=(biomeSel+1)%4; else if(k==='enter'){ if(biomeSel<progress.unlocked)startBiome(biomeSel); } else if(k==='back'||k==='pause')go(GS.MENU); return; }
  if(state===GS.HOWTO || state===GS.BESTIARY){ if(k==='back'||k==='pause'||k==='enter')go(GS.MENU); return; }
  if(state===GS.PLAY){ if(k==='pause'){ pauseSel=0; state=GS.PAUSE; } return; }
  if(state===GS.PAUSE){ if(k==='up')pauseSel=(pauseSel+3)%4; else if(k==='down')pauseSel=(pauseSel+1)%4;
    else if(k==='pause')go(GS.PLAY);
    else if(k==='enter'){ if(pauseSel===0)go(GS.PLAY); else if(pauseSel===1){loadPhase(curBiome);go(GS.PLAY);} else if(pauseSel===2)AUD.muted=!AUD.muted; else go(GS.MENU); } return; }
  if(state===GS.OVER){ if(k==='up'||k==='down')overSel=overSel?0:1; else if(k==='enter'){ if(overSel===0){loadPhase(curBiome);go(GS.PLAY);} else go(GS.MENU); } return; }
  if(state===GS.PHASEWIN){ const hasNext=curBiome+1<BIOME_IDS.length; const n=hasNext?3:2;
    if(k==='up')winSel=(winSel+n-1)%n; else if(k==='down')winSel=(winSel+1)%n;
    else if(k==='enter'){ if(hasNext&&winSel===0){loadPhase(curBiome+1);go(GS.PLAY);} else if(winSel===(hasNext?1:0))go(GS.SELECT); else go(GS.MENU); } return; }
  if(state===GS.GAMEWIN){ if(k==='enter'||k==='back')go(GS.MENU); return; }
}
addEventListener('keydown', e=>{ if(e.code==='KeyR' && (state===GS.PAUSE||state===GS.PLAY)){ loadPhase(curBiome); go(GS.PLAY); } });
addEventListener('wheel', e=>{ if(state!==GS.BESTIARY) return; const maxS=Math.max(0,(104+6*(84+10))-(VH-64)); bestiaryScroll=Math.max(0,Math.min(maxS,bestiaryScroll+e.deltaY*0.5)); e.preventDefault(); },{passive:false});

// ---------- Áudio (WebAudio) ----------
const AUD={ ctx:null, muted:false, ensure(){ if(!this.ctx){ try{ this.ctx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume(); } };
function sfx(type){ if(!AUD.ctx||AUD.muted)return; const c=AUD.ctx,t=c.currentTime; const o=c.createOscillator(),g=c.createGain(); o.connect(g); g.connect(c.destination);
  let f0=440,f1=440,d=0.12,ty='square',vol=0.12;
  if(type==='jump'){f0=300;f1=620;d=0.14;}
  else if(type==='chime'){f0=660;f1=990;d=0.25;ty='triangle';vol=0.16;}
  else if(type==='zap'){f0=900;f1=160;d=0.18;ty='sawtooth';vol=0.13;}
  else if(type==='hurt'){f0=200;f1=70;d=0.22;vol=0.16;}
  else if(type==='win'){f0=520;f1=1040;d=0.5;ty='triangle';vol=0.18;}
  o.type=ty; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(Math.max(40,f1),t+d);
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+d); o.start(t); o.stop(t+d+0.02); }

// ============================ LOOP (timestep fixo) ============================
let last=0, acc=0; const STEP=1/60;
function loop(ts){ let dt=(ts-last)/1000; last=ts; if(!isFinite(dt))dt=0; if(dt>0.1)dt=0.1;
  if(state===GS.PLAY){ acc+=dt; let n=0; while(acc>=STEP && n<4){ update(STEP); acc-=STEP; n++; } render(); }
  else { time+=dt;
    if(state===GS.TITLE)drawTitle();
    else if(state===GS.MENU)drawMenu();
    else if(state===GS.SELECT)drawSelect();
    else if(state===GS.HOWTO)drawHowto();
    else if(state===GS.BESTIARY)drawBestiary();
    else if(state===GS.PAUSE)drawPause();
    else if(state===GS.OVER)drawOver();
    else if(state===GS.PHASEWIN)drawPhaseWin();
    else if(state===GS.GAMEWIN)drawGameWin();
  }
  for(const k in pressed) pressed[k]=false; mClick=false;
  requestAnimationFrame(loop);
}

// ---------- Boot ----------
function boot(){ loadProgress();
  ctx.fillStyle='#10180e'; ctx.fillRect(0,0,VW,VH); center('Carregando...',VH/2,14,'#cfe0c0');
  preload(()=>{ buildBG('mata'); state=GS.TITLE; requestAnimationFrame(loop); });
}
boot();

})();
