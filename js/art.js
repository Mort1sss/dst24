// Таксопарк «ДСТ-24» — звук, пиксель-арт, сцена, заставка
/* ================= ЗВУК ================= */
let AC=null,musicTimer=null,nextNote=0,step16=0;
function ensureAudio(){if(paused)return;try{if(!AC)AC=new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();if(G.music&&!musicTimer)startMusic()}catch(e){}}
function tone(f,dur,type='square',vol=.06,when=0,slide){if(!AC)return;const t0=AC.currentTime+Math.max(0,when),o=AC.createOscillator(),g=AC.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t0);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t0+dur);
  g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);o.connect(g);g.connect(AC.destination);o.start(t0);o.stop(t0+dur+.02)}
function sfx(k){if(!G.sfx||!AC)return;
  if(k==='click')tone(660,.04,'square',.03);
  if(k==='coin'){tone(988,.07,'square',.05);tone(1319,.14,'square',.05,.07)}
  if(k==='bad')tone(330,.25,'square',.05,0,110);
  if(k==='win'){[523,659,784,1047].forEach((f,i)=>tone(f,.1,'square',.05,i*.08))}
  if(k==='alert'){tone(880,.08,'square',.05);tone(880,.08,'square',.05,.14)}
  if(k==='car'){tone(90,.35,'sawtooth',.04,0,220);tone(660,.06,'square',.03,.3);tone(880,.08,'square',.03,.36)}
  if(k==='cash'){tone(1568,.05,'square',.04);tone(2093,.05,'square',.04,.06);tone(1046,.15,'triangle',.05,.12)}
  if(k==='siren'){for(let i=0;i<4;i++){tone(700,.15,'square',.03,i*.3,1000);tone(1000,.15,'square',.03,i*.3+.15,700)}}
  if(k==='party'){[523,659,784,659,784,1047].forEach((f,i)=>tone(f,.09,'square',.04,i*.07))}}
const NOTE=n=>440*Math.pow(2,(n-69)/12);
const TRACKS={
 day:{st:.2,lead:'square',mel:[72,0,76,79,77,0,76,74,72,0,74,76,74,0,71,0, 72,0,76,79,81,0,79,77,76,0,74,72,74,0,0,0],bas:[48,48,55,55,53,53,55,55,48,48,55,55,50,50,55,55],hat:1},
 night:{st:.3,lead:'triangle',mel:[69,0,72,0,76,0,74,72,71,0,0,0,69,0,67,0, 69,0,72,0,77,0,76,74,72,0,71,0,69,0,0,0],bas:[45,45,52,52,50,50,52,52,45,45,48,48,43,43,47,47],hat:0},
 tension:{st:.16,lead:'square',mel:[64,0,64,67,0,64,63,0,64,0,64,67,0,70,69,0, 64,0,64,67,0,64,63,0,62,0,60,0,59,0,0,0],bas:[40,40,40,40,43,43,42,42,40,40,40,40,38,38,39,39],hat:1}};
let curTrack='day';
function pickTrack(){const h=$('modal').hidden?'':$('modalCard').innerHTML;if(/ПРОВЕРКА|ГАИ|НАЛОГОВАЯ|КРИЗИС|КОНКУРЕНТ|ДИСПЕТЧЕР|МИНИ-ИГРА/.test(h))return'tension';return sceneDark>.6?'night':'day'}
function startMusic(){if(!AC||musicTimer)return;nextNote=AC.currentTime+.05;musicTimer=setInterval(()=>{
  while(nextNote<AC.currentTime+.25){if(step16%32===0)curTrack=pickTrack();const T=TRACKS[curTrack],st=T.st,i=step16%32,w=nextNote-AC.currentTime;
    if(T.mel[i])tone(NOTE(T.mel[i]),st*.9,T.lead,curTrack==='night'?.035:.025,w);
    if(i%2===0)tone(NOTE(T.bas[(i>>1)%16]),st*1.8,'triangle',.05,w);
    if(T.hat&&i%4===2)tone(2000,.03,'square',.008,w);
    if(curTrack==='tension'&&i%8===0)tone(110,.12,'sawtooth',.02,w);
    nextNote+=st;step16++}},90)}
function stopMusic(){clearInterval(musicTimer);musicTimer=null}

/* ================= ПИКСЕЛЬ-АРТ ================= */
const PAL={l:'#ffe07a',W:'#e8f6ff',H:'#3a2418',P:'#1c1838',y:'#f7c331',d:'#c9951a',k:'#1a1530',w:'#9fd3ff',b:'#f3ecdc',c:'#1a1530',h:'#fff6a8',r:'#ff4d4d',o:'#0e0b1c',g:'#a8a0cc',t:'#f7c331'};
/* спрайты 24×11: k контур, y кузов, d низ кузова, w стекло, t табличка такси, b/c шашки, h фара, r стоп, o шина, g диск */
const SEDAN=[
"..........tt............",
".......kkkkkkkkk........",
"......kWwwkWwwwwkk......",
".....kWwwwkWwwwwwwk.....",
"..kkkklllllllllllllkkk..",
".kryyycbcbcbyyyyyyyyyyk.",
"kyyyybbcbcbcyyyyyyyyyyhk",
"kddooooddddddddddooooddk",
"kkoggggokkkkkkkkoggggokk",
"..oggggo........oggggo..",
"...oooo..........oooo...",
];
const HATCH=[
"..........tt............",
"......kkkkkkkkkk........",
".....kWwwkWwwwwwkk......",
"....kWwwwkWwwwwwwwk.....",
"..kklllllllllllllllkkk..",
".kryyycbcbcbyyyyyyyyyyk.",
"kyyyybbcbcbcyyyyyyyyyyhk",
"kddooooddddddddddooooddk",
"kkoggggokkkkkkkkoggggokk",
"..oggggo........oggggo..",
"...oooo..........oooo...",
];
const LIMO=[
"..........tt............",
"......kkkkkkkkkkk.......",
".....kWwwwkWwwwwwkk.....",
"....kWwwwwkWwwwwwwwk....",
".kkkkllllllllllllllykkk.",
"kryyyycbcbcbyyyyyyyyyyyk",
"kyyyybbcbcbcyyyyyyyyyyhh",
"kddooooddddddddddooooddk",
"kkoggggokkkkkkkkoggggokk",
"..oggggo........oggggo..",
"...oooo..........oooo...",
];
const SUV=[
"..........tt............",
"...kkkkkkkkkkkkkk.......",
"..kWwwwkWwwwwkWwwkk.....",
"..kWwwwkWwwwwkWwwwwk....",
".kkylllllllllllllllykk..",
"kryyyycbcbcbyyyyyyyyyyk.",
"kyyyybbcbcbcyyyyyyyyyyhk",
"kddooooddddddddddooooddk",
"kkoggggokkkkkkkkoggggokk",
"..oggggo........oggggo..",
"...oooo..........oooo...",
];
const VAN=[
"..........tt............",
"kkkkkkkkkkkkkkkkkkkk....",
"kWwwwkWwwwkWwwwkWwwwk...",
"kWwwwkWwwwkWwwwkWwwwwk..",
"kyyylllllllllllllllyyykk",
"kryyyycbcbcbyyyyyyyyyyyk",
"kyyyybbcbcbcyyyyyyyyyyhk",
"kddooooddddddddddooooddk",
"kkoggggokkkkkkkkoggggokk",
"..oggggo........oggggo..",
"...oooo..........oooo...",
];
const TAXI=SEDAN;
const SHAPE_OF={granta:SEDAN,vesta:SEDAN,moskvich:SUV,solaris:SEDAN,rio:HATCH,solarisNew:SEDAN,octavia:HATCH,tiggo:SUV,jolion:SUV,evolute:HATCH,camry:LIMO,zeekr:LIMO,mercedes:LIMO,monjaro:SUV,carnival:VAN};
const PERSON=[
"..HHH..",
".HHHHH.",
".HbbbH.",
"..bbb..",
".kkkkk.",
"kkkkkkk",
"k.kkk.k",
"b.kkk.b",
"..P.P..",
"..P.P..",
".PP.PP."];
const shapeOf=m=>SHAPE_OF[m]||SEDAN;
/* ---- новые модели: свой силуэт, объём в 3 тона, колёса отдельно и крутятся ----
   s тень кузова, n тёмное стекло, m хром, e световая полоса электромобиля; wh — центры колёс, wy — верх колеса */
const CARS2={
 solaris:{wh:[7,25],wy:8,s:[
"............kttk................",
"..........kkkkkkkkkk............",
".........kWwwwwkWwwwk...........",
"........kWwwwwwkwwwwWk..........",
".......knwwwwwwkwwwwwWk.........",
".kkkkkkllllllllllllllllkkkkkkk..",
"kryyyyyyyyyyyyyyyyyyyyyylllllllk",
"kryyyyyybcbcbcysyymyyyyyyyyyyyhk",
"kyyyyyyycbcbcbysyyyyyyyyyyyyyyhk",
"kssssssssssssssssssssssssssssssk",
"kddddddddddddddddddddddddddddddk",
".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk."]},
 camry:{wh:[8,27],wy:7,s:[
"..............kttk................",
"............kkkkkkkkkk............",
"..........kWwwwwwkwwwwWk..........",
"........knWwwwwwwkwwwwwwWk........",
".kkkkkkkllllllllllllllllllllkkkkk.",
"kryyyyyyyyyyyyyyyyyyyyyyyyyylllllk",
"kryyyyyyybcbcbcyysyyymyyyyyyyyyhhk",
"kyyyyyyyycbcbcbysyyyyyyyyyyyyyyymk",
"kssssssssssssssssssssssssssssssssk",
"kddddddddddddddddddddddddddddddddk",
".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk."]},
 zeekr:{wh:[8,26],wy:7,s:[
"...............kttk...............",
"........kkkkkkkkkkkkkkk...........",
".......knwwwwkwwwwwkwwwWk.........",
"......knwwwwwkwwwwwkwwwwwWk.......",
".kkkkkllllllllllllllllllllllkkkkk.",
"krryyyyyyyyyyyyyyyyyyyyyyyyylllllk",
"kryyyyyybcbcbcyyysyyymyyyyyyyeeeek",
"kyyyyyyycbcbcbyyysyyyyyyyyyyyyyymk",
"kssssssssssssssssssssssssssssssssk",
"kddddddddddddddddddddddddddddddddk",
".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk."]},
 granta:{wh:[7,24],wy:8,s:[
"...........kttk................",
".........kkkkkkkkkkk...........",
"........kWwwwwkWwwwwk..........",
".......kWwwwwwkwwwwwWk.........",
"......knwwwwwwkwwwwwwWk........",
".kkkkklllllllllllllllllkkkkkk..",
"kryyyyyyyyyyyyyyyyyyyyyyllllllk",
"kryyyyybcbcbcyysyyymyyyyyyyyyhk",
"kyyyyyycbcbcbyysyyyyyyyyyyyyyhk",
"ksssssssssssssssssssssssssssssk",
"kdddddddddddddddddddddddddddddk",
".kkkkkkkkkkkkkkkkkkkkkkkkkkkkk."]},
 vesta:{wh:[7,25],wy:8,s:[
"............kttk................",
"..........kkkkkkkkkk............",
".........kWwwwwkWwwwk...........",
"........kWwwwwwkwwwwWk..........",
".......knwwwwwwkwwwwwWk.........",
".kkkkkkmmmmmmmmmmmmmmmmkkkkkkk..",
"kryyyyyyyyyyyyyyyyyyyyyylllllllk",
"kryyyyyybcbcbcysyymyyyyysyyyyyhk",
"kyyyyyyycbcbcbyyssyyyyysyyyyyyhk",
"kssssssssssssssssssssssssssssssk",
"kddddddddddddddddddddddddddddddk",
".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk."]},
 moskvich:{wh:[6,23],wy:9,s:[
"...........kttk...............",
"......mmmmmmmmmmmmmm..........",
"......kkkkkkkkkkkkkk..........",
".....kWwwwkWwwwwkwwWk.........",
".....knwwwkwwwwwkwwwwWk.......",
".....knwwwkwwwwwkwwwwwWk......",
".kkkklllllllllllllllllllkkkkk.",
"kryyyyyyyyyyyyyyyyyyyyyyyllllk",
"kryyyyybcbcbcyysyyymyyyyyyyyhk",
"kyyyyyycbcbcbyysyyyyyyyyyyyymk",
"kssssssssssssssssssssssssssssk",
"kddddddddddddddddddddddddddddk",
".kkkkkkkkkkkkkkkkkkkkkkkkkkkk."]},
 rio:{wh:[6,23],wy:8,s:[
"...........kttk...............",
"......kkkkkkkkkkkkkk..........",
".....knWwwwkWwwwwwk...........",
"....knwwwwwkwwwwwwWk..........",
"...knwwwwwwkwwwwwwwWk.........",
".kkklllllllllllllllllkkkkkkk..",
"kryyyyyyyyyyyyyyyyyyyyyllllllk",
"kryyyybcbcbcysyymyyyyyyyyyyyhk",
"kyyyyycbcbcbysyyyyyyyyyyyyyyhk",
"kssssssssssssssssssssssssssssk",
"kddddddddddddddddddddddddddddk",
".kkkkkkkkkkkkkkkkkkkkkkkkkkkk."]},
 octavia:{wh:[7,26],wy:8,s:[
"..............kttk...............",
"...........kkkkkkkkkk............",
".........knWwwwkWwwwwk...........",
".......knwwwwwwkwwwwwwWk.........",
".....knwwwwwwwwkwwwwwwwwWk.......",
".kkkklllllllllllllllllllllkkkkkk.",
"kryyyyyyyyyyyyyyyyyyyyyyyyllllllk",
"kryyyyyyybcbcbcysyyymyyyyyyyyyyhk",
"kyyyyyyyycbcbcbysyyyyyyyyyyyyyyhk",
"ksssssssssssssssssssssssssssssssk",
"kdddddddddddddddddddddddddddddddk",
".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk."]},
 tiggo:{wh:[7,25],wy:9,s:[
"............kttk................",
".......mmmmmmmmmmmmmm...........",
"......kkkkkkkkkkkkkkkk..........",
".....kWwwwwkWwwwwkwwWk..........",
"....knwwwwwkwwwwwkwwwwWk........",
"....knwwwwwkwwwwwkwwwwwWk.......",
".kkklllllllllllllllllllllkkkkkk.",
"kryyyyyyyyyyyyyyyyyyyyyyyylllllk",
"kryyyyyybcbcbcyysyyymyyyyyyyyyhk",
"kyyyyyyycbcbcbyysyyyyyyyyyyyyymk",
"kssssssssssssssssssssssssssssssk",
"kddddddddddddddddddddddddddddddk",
".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk."]},
 jolion:{wh:[7,26],wy:9,s:[
".............kttk................",
"......mmmmmmmmmmmmmmmmm..........",
"......kkkkkkkkkkkkkkkkkk.........",
".....kWwwwwkWwwwwwkWwwwk.........",
".....knwwwwkwwwwwwkwwwwwk........",
".....knwwwwkwwwwwwkwwwwwWk.......",
".kkkklllllllllllllllllllllkkkkkk.",
"kryyyyyyyyyyyyyyyyyyyyyyyyylllllk",
"kryyyyyyybcbcbcyysyyymyyyyyyyyyhk",
"kyyyyyyyycbcbcbyysyyyyyyyyyyyymmk",
"ksssssssssssssssssssssssssssssssk",
"kdddddddddddddddddddddddddddddddk",
".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk."]},
 evolute:{wh:[6,22],wy:8,s:[
"...........kttk..............",
".......kkkkkkkkkkk...........",
"......knWwwwkWwwwwk..........",
".....knwwwwwkwwwwwwk.........",
"....knwwwwwwkwwwwwwwWk.......",
".kkklllllllllllllllllkkkkk...",
"kryyyyyyyyyyyyyyyyyyyyllllllk",
"kryyyybcbcbcysyymyyyyyyyyyeek",
"kyyyyycbcbcbysyyyyyyyyyyyyyyk",
"ksssssssssssssssssssssssssssk",
"kdddddddddddddddddddddddddddk",
".kkkkkkkkkkkkkkkkkkkkkkkkkkk."]},
 mercedes:{wh:[8,27],wy:7,s:[
"..............kttk.................",
"...........kkkkkkkkkk..............",
".........knWwwwwkWwwwwk............",
".......knwwwwwwwkwwwwwwWk..........",
".kkkkkkmmmmmmmmmmmmmmmmmmmkkkkkkkk.",
"kryyyyyyyyyyyyyyyyyyyyyyyyyllllllmk",
"kryyyyyyyybcbcbcyysyyymyyyyyyyyyhhk",
"kyyyyyyyyycbcbcbyysyyyyyyyyyyyyymmk",
"ksssssssssssssssssssssssssssssssssk",
"kmdddddddddddddddddddddddddddddddmk",
".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk."]},
 monjaro:{wh:[8,27],wy:9,s:[
"..............kttk.................",
"......mmmmmmmmmmmmmmmmmm...........",
"......kkkkkkkkkkkkkkkkkkk..........",
".....kWwwwwkWwwwwwkWwwwwk..........",
"....knwwwwwkwwwwwwkwwwwwwWk........",
"....knwwwwwkwwwwwwkwwwwwwwWk.......",
".kkkllllllllllllllllllllllllkkkkkk.",
"kryyyyyyyyyyyyyyyyyyyyyyyyyyylllllk",
"kryyyyyyybcbcbcyysyyyymyyyyyyyyhhhk",
"kyyyyyyyycbcbcbyysyyyyyyyyyyyyymmmk",
"ksssssssssssssssssssssssssssssssssk",
"kdddddddddddddddddddddddddddddddddk",
".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk."]},
 carnival:{wh:[7,28],wy:9,s:[
"...............kttk.................",
"...kkkkkkkkkkkkkkkkkkkkkk...........",
"..kWwwwkWwwwwwkWwwwwwkWwk...........",
"..knwwwkwwwwwwkwwwwwwkwwwWk.........",
"..knwwwkwwwwwwkwwwwwwkwwwwwWk.......",
".kklllllllllllllllllllllllllllkkkk..",
"kryyyyyyyyyyyyyyyyyyyyyyyyyyyylllllk",
"kryyyyyyyybcbcbcysyyyyyyyysyyyyyymhk",
"kyyyyyyyyycbcbcbysmmmmmmmmsyyyyyyyhk",
"kssssssssssssssssssssssssssssssssssk",
"kddddddddddddddddddddddddddddddddddk",
"kddddddddddddddddddddddddddddddddddk",
".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk."]}};
CARS2.solarisNew=CARS2.solaris;
const carW=m=>CARS2[m]?CARS2[m].s[0].length:24;
/* высота фар над верхом «старой» машины 24×11 — по ней ставятся свет фар и стоп-огни */
const carHo=m=>{const N=CARS2[m];return N?5-N.wy+N.s.findIndex(r=>/[he]/.test(r)):6};
/* колесо 6×6: шина, диск, ступица и блик, который обегает диск — так видно вращение */
function wheel(g,x,y,P,spin){g.fillStyle='#0e0b1c';g.fillRect(x+1,y,4,6);g.fillRect(x,y+1,6,4);g.fillStyle='#4a4570';g.fillRect(x+1,y+1,4,4);
  g.fillStyle=P.g;g.fillRect(x+2,y+2,2,2);const sp=[[1,1],[4,1],[4,4],[1,4]][spin&3];g.fillStyle='#c6bfe4';g.fillRect(x+sp[0],y+sp[1],1,1)}
/* машина на земле: x — левый край, gy — линия земли */
function drawCar(g,m,x,gy,flip,P,spin=0){P=P||carPal(m);const N=CARS2[m];
  if(!N){spr(g,shapeOf(m),x,gy-11,flip,P);return}
  const w=N.s[0].length,y=Math.round(gy-N.wy-6);x=Math.round(x);spr(g,N.s,x,y,flip,P);if(P.v)livery(g,N.s,x,y,flip,P.v);
  N.wh.forEach(c=>{const wx=x+(flip?w-1-c:c)-3+(flip?1:0);g.fillStyle='#0e0b1c';g.fillRect(wx,y+N.wy-1,6,1);g.fillRect(wx-1,y+N.wy,8,2);wheel(g,wx,y+N.wy,P,flip?3-(spin&3):spin)})}
/* ---- раскраски: перекрашивают пиксели кузова ('y') по узору; координаты c/r — в спрайте без отражения ---- */
const LIV_RANGE=new WeakMap();
function livPix(s,flip,v){const P=new Map();const w=s[0].length;let R=LIV_RANGE.get(s);if(!R){let a=99,b=0;s.forEach((row,r)=>{if(/[ys]/.test(row)&&r>3){a=Math.min(a,r);b=r}});LIV_RANGE.set(s,R=[a,b])}
  const[r0,r1]=R,h=r1-r0+1,rb=r0+Math.round(h*.55);
  for(let r=r0;r<=r1;r++)for(let c=0;c<w;c++){const ch=s[r][c];if(ch!=='y'&&ch!=='s')continue;let k=null;
    if(v==='checker'){if(r===rb||r===rb+1)k=(c+r)&1?'#0e0b1c':'#f3ecdc'}
    else if(v==='stripe'){if(r===rb)k='#f3ecdc';else if(r===rb+1)k='#c23a3a'}
    else if(v==='flame'){const xe=w*.38+((r*5)%4)*2+(r1-r)*.8;if(r>=r0+h*.2&&c>=xe){const d=c-xe;k=d<2?'#ffe07a':d<5?'#ff8a4c':'#c23a3a'}}
    else if(v==='neon')k=lerp('#4fffd0','#e66fa8',c/w);
    else if(v==='retro'){const rr=r0+Math.round(h*.4);if(r===rr)k='#c23a3a';else if(r>rr)k='#f3ecdc'}
    else if(v==='night')k=(c*7+r*13)%11===0?'#f7c331':'#2a2460';
    else if(v==='gl_home'){if(r===rb)k='#f7c331';else if(r===rb+1)k=(c+r)&1?'#0e0b1c':'#f7c331'}
    else if(v==='gl_capital'){const t=Math.floor((r-r0)*3/h);k=t===0?'#f3ecdc':t===1?'#2b5d8a':'#c23a3a'}
    else if(v==='gl_resort'){if(r>=rb)k=((c+(r&1)*2)%6)<3?'#ff8a4c':'#4fc7b0'}
    else if(v==='gl_north')k=(c*5+r*7)%9===0?'#f3ecdc':'#2b5d8a';
    else if(v==='gl_port'){if(r>=rb-1)k=(r-rb)%3===0?'#1d3a5f':'#e8e4d4'}
    else if(v==='gl_science')k=(c%4===0||r%4===0)?'#4fffd0':'#0e1b2a';
    if(k){const col=ch==='s'?shade(k,.78):k;if(!P.has(col))P.set(col,[]);P.get(col).push(flip?w-1-c:c,r)}}
  return P}
// узор не зависит от цвета кузова: пиксели считаются один раз на спрайт, разворот и раскраску
const LIV_CACHE=new WeakMap();
function livery(g,s,x,y,flip,v){let M=LIV_CACHE.get(s);if(!M)LIV_CACHE.set(s,M=new Map());const key=v+(flip?1:0);let P=M.get(key);if(!P)M.set(key,P=livPix(s,flip,v));
  for(const[col,pts]of P){g.fillStyle=col;for(let i=0;i<pts.length;i+=2)g.fillRect(x+pts[i],y+pts[i+1],1,1)}}
const carPal=m=>{const M=MODELS[m]||MODELS.solaris,C=S&&S.custom&&COLORS[S.custom.color],own=C&&C.body&&!['Комфорт+','Бизнес'].includes(M.cls);const by=own?C.body:M.body;const darkBody=hx(by).reduce((a,v)=>a+v,0)<270;return{y:by,l:darkBody?lerp(by,'#a8a0cc',.4):shade(by,1.16),s:shade(by,.74),n:'#3a4a78',m:'#d8d0e8',e:'#9ff0ff',d:own?C.trim:M.trim,t:M.ev?'#86e06f':'#f7c331',k:['camry','mercedes','monjaro','zeekr'].includes(m)?'#0b0914':'#1a1530',g:m==='mercedes'?'#e8e2d0':'#a8a0cc',v:S&&S.custom&&S.custom.livery&&S.custom.livery!=='none'?S.custom.livery:''}};
function spr(g,s,x,y,flip,pal){x=Math.round(x);y=Math.round(y);for(let r=0;r<s.length;r++)for(let c=0;c<s[r].length;c++){const ch=s[r][c];if(ch==='.')continue;
  g.fillStyle=(pal&&pal[ch])||PAL[ch];g.fillRect(x+(flip?s[r].length-1-c:c),y+r,1,1)}}
function drawMini(el){const g=el.getContext('2d');g.clearRect(0,0,38,17);
  if(el.dataset.m==='person'){spr(g,PERSON,11,5,false,{b:'#f0c8a0',k:'#4fc7b0'});spr(g,PERSON,20,5,false,{b:'#e8b890',k:'#e66fa8',H:'#b05a2a'});return}
  const m=el.dataset.m,w=carW(m),x=(38-w)>>1;g.fillStyle='#2a2450';g.fillRect(0,13,38,4);g.fillStyle='#0e0b1c66';g.fillRect(x+2,15,w-4,1);
  drawCar(g,m,x,15,false,el.dataset.liv===undefined?carPal(m):Object.assign(carPal(m),{v:el.dataset.liv==='none'?'':el.dataset.liv}))}
const shade=(h,k)=>'#'+hx(h).map(v=>Math.max(0,Math.min(255,Math.round(v*k))).toString(16).padStart(2,'0')).join('');
const HEAD=[
"................",
"................",
".....oooooo.....",
"....osssssdo....",
"...ossssssddo...",
"...osbbssbbdo...",
"..oosewsewsdoo..",
"..osdsssssssdo..",
"...ossssnssdo...",
"...osscmmcsdo...",
"....osssssdo....",
".....okkkko.....",
"....tttwwttt....",
"..tTttttwttttT..",
".tTttttttttttTt.",
".tTttttttttttTt."];
function face(g,p){g.clearRect(0,0,16,16);if(!p)return;const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
  R(0,0,16,16,'#2f2858');R(0,0,16,1,'#3a3268');R(0,11,16,5,'#28224c');
  if(p.cat){const o='#e8883a',d='#b8602a',l='#ffb06a';
    R(2,2,3,4,d);R(11,2,3,4,d);R(3,3,1,2,'#e66fa8');R(12,3,1,2,'#e66fa8');R(2,5,12,8,o);R(3,4,10,1,o);R(3,13,10,2,o);R(4,5,8,1,l);
    R(6,5,1,2,d);R(9,5,1,2,d);R(7,4,2,1,d);R(4,8,3,2,'#f3ecdc');R(9,8,3,2,'#f3ecdc');R(5,8,1,2,'#2e7a3a');R(10,8,1,2,'#2e7a3a');R(5,8,1,1,'#86e06f');R(10,8,1,1,'#86e06f');
    R(7,10,2,1,'#e66fa8');R(6,11,1,1,d);R(9,11,1,1,d);R(7,11,2,1,'#f3ecdc');R(0,10,4,1,'#f3ecdc');R(12,10,4,1,'#f3ecdc');R(0,12,3,1,'#f3ecdc');R(13,12,3,1,'#f3ecdc');return}
  if(p.goat){const w='#f3ecdc',d='#c8c0b0';
    R(3,1,2,3,'#8a7a5a');R(11,1,2,3,'#8a7a5a');R(4,3,8,9,w);R(1,5,3,2,d);R(12,5,3,2,d);R(5,12,6,2,w);R(4,4,8,1,'#ffffff');
    R(5,6,2,2,'#1a1530');R(9,6,2,2,'#1a1530');R(5,6,1,1,'#f7c331');R(9,6,1,1,'#f7c331');R(6,10,4,2,'#e8b0b8');R(7,10,1,1,'#9a4a4a');R(8,10,1,1,'#9a4a4a');R(7,14,2,2,d);return}
  const sk=p.skin,pal={o:'#1a1530',s:sk,d:shade(sk,.84),b:shade(p.hair,.8),e:'#f3ecdc',w:'#1a1530',n:shade(sk,.78),c:'#e89a9a',m:'#9a4a4a',k:shade(sk,.72),t:p.shirt||'#4a4570',T:shade(p.shirt||'#4a4570',.72)};
  HEAD.forEach((row,y)=>{for(let x=0;x<16;x++){const ch=row[x];if(ch!=='.'){g.fillStyle=pal[ch];g.fillRect(x,y,1,1)}}});
  R(7,12,2,2,'#f3ecdc');
  const hr=p.hair,hD=shade(hr,.72),hL=shade(hr,1.4);
  if(p.style===0){R(4,2,8,2,hr);R(3,3,1,3,hr);R(12,3,1,3,hD);R(5,1,6,1,'#1a1530');R(6,2,3,1,hL);R(4,4,2,1,hr)}
  if(p.style===1){R(4,2,8,2,hr);R(2,3,2,10,hr);R(12,3,2,10,hD);R(3,4,1,8,hD);R(5,1,6,1,'#1a1530');R(6,2,4,1,hL);R(4,4,1,2,hr);R(11,4,1,2,hr)}
  if(p.style===2){R(3,5,1,4,hr);R(12,5,1,4,hD);R(6,3,3,1,shade(sk,1.12))}
  if(p.style===3){R(6,0,4,2,hr);R(7,0,2,1,hL);R(4,2,8,2,hr);R(3,3,1,3,hr);R(12,3,1,3,hD);R(6,2,3,1,hL)}
  // настроение начальника: улыбка при хороших отношениях, нахмуренные брови и опущенные уголки рта при плохих
  if(p.mood==='happy'){R(6,9,4,1,sk);R(6,9,1,1,pal.m);R(9,9,1,1,pal.m);R(7,10,2,1,pal.m)}
  if(p.mood==='angry'){R(5,5,2,1,sk);R(9,5,2,1,sk);R(5,4,1,1,pal.b);R(6,5,1,1,pal.b);R(10,4,1,1,pal.b);R(9,5,1,1,pal.b);R(6,9,4,1,sk);R(7,9,2,1,pal.m);R(6,10,1,1,pal.m);R(9,10,1,1,pal.m)}
  if(p.acc==='glasses'){const o='#1a1530';R(4,5,3,1,o);R(9,5,3,1,o);R(4,7,3,1,o);R(9,7,3,1,o);R(4,6,1,1,o);R(6,6,1,1,'#9fd3ff');R(11,6,1,1,o);R(9,6,1,1,'#9fd3ff');R(7,6,2,1,o);R(5,6,1,1,'#cfe8ff');R(10,6,1,1,'#cfe8ff')}
  if(p.acc==='mustache'){const mc=hr==='#9a9a9a'||hr==='#8a8a8a'?'#e0e0e0':hr;R(5,9,6,1,mc);R(4,10,1,1,mc);R(11,10,1,1,mc)}
  if(p.acc==='beard'){R(4,8,1,3,hr);R(11,8,1,3,hD);R(4,10,8,2,hr);R(5,12,6,1,hD);R(6,9,4,1,'#9a4a4a');R(5,10,2,1,hL)}
  if(p.acc==='cap'){const c=p.cap||'#ff8a4c';R(3,1,10,3,c);R(4,0,8,1,c);R(5,1,4,1,shade(c,1.3));R(7,2,2,1,'#f3ecdc');R(9,4,6,1,shade(c,.7));R(3,4,1,1,shade(c,.7))}
}
function faceParams(key){const [t,a,b]=key.split(':');
  if(t==='head'){const f=headDef(+a).face,r=S&&S.heads&&S.heads[+a]?relOf(+a):0;return f&&Object.assign({},f,{mood:r>=4?'happy':r<=-3?'angry':''})}
  if(t==='cand')return(HEADS[+a].find(h=>h.key===b)||((S.extraHeads||[])[+a]||[]).find(h=>h.key===b)||{}).face;
  if(t==='founder')return FOUNDERS[+a].face;
  if(t==='char')return CHARS[a]||CHARS.mech;
  if(t==='av')return AVATARS[+a];}
function drawFaces(){document.querySelectorAll('canvas.face').forEach(el=>{try{face(el.getContext('2d'),faceParams(el.dataset.face))}catch(e){}})}

/* ---- логотип, карта, графики ---- */
function drawLogo(g,key,x,y,col){const L=LOGOS[key]||LOGOS.checker;g.clearRect(x,y,8,8);g.fillStyle='#1d1838';g.fillRect(x,y,8,8);L.forEach((r,yy)=>{for(let xx=0;xx<8;xx++)if(r[xx]==='c'){g.fillStyle=yy<3?shade(col,1.15):yy>5?shade(col,.8):col;g.fillRect(x+xx,y+yy,1,1)}})}
let mapRAF=null,mapT=0;
function mapLoop(){if(uiTab!=='map'||!$('mapC')){mapRAF=null;return}if(!paused){mapT+=1;drawMap()}mapRAF=requestAnimationFrame(mapLoop)}
const MAP_AREAS={sleep:[8,6,92,36],center:[124,6,62,36],air:[194,6,40,74],rail:[24,92,84,36]};
function drawMap(){const el=$('mapC');if(!el)return;const g=el.getContext('2d'),Rm=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)};
  const dk=sceneDark||0,T=mapT;
  Rm(0,0,240,135,lerp('#3a7a4a','#1a3a2a',dk));for(let i=0;i<90;i++)Rm((i*37)%240,(i*53)%135,2,2,lerp('#4a8a54','#22442e',dk));
  // река с бликами
  Rm(0,78,240,9,lerp('#3a7fa0','#1a3a5a',dk));for(let x=0;x<240;x+=12)Rm((x+T*.3)%240,80+((x/12)%3),5,1,lerp('#8ac8e8','#3a6a8a',dk));
  // дороги и мост
  const road=lerp('#6a6290','#3a3460',dk);Rm(114,0,6,135,road);Rm(0,46,240,5,road);Rm(0,104,190,5,road);Rm(112,76,10,12,lerp('#8a83b0','#4a4570',dk));
  g.fillStyle=lerp('#f7c33188','#f7c33144',dk);for(let y=(T*.5)%8;y<135;y+=8)g.fillRect(116,y,1,4);for(let x=(T*.5)%8;x<240;x+=8)g.fillRect(x,48,4,1);
  const tot=Object.values(S.alloc).reduce((a,b)=>a+b,0)||1;
  DISTRICTS.forEach(D=>{const[x,y,w,h]=MAP_AREAS[D.k];Rm(x-1,y-1,w+2,h+2,'#0e0b1c');Rm(x,y,w,h,lerp(D.c+'',shade(D.c,.4),dk*.8));
    Rm(x,y,w,h,'#1d183866');
    {let k=0;const bw=D.k==='air'||D.k==='rail'?11:6;for(let by=y+12;by+7<=y+h-2;by+=9)for(let bx=x+3;bx+bw<=x+w-2;bx+=bw+3){k++;const hsh=(bx*7+by*13)%11;
      if(hsh===0){Rm(bx,by+2,bw,5,lerp('#4a9a5a','#1e3a26',dk));Rm(bx+1,by+3,2,2,lerp('#2e7a44','#14301c',dk));continue}
      const bh=3+hsh%4;Rm(bx,by+7-bh,bw,bh,lerp('#2a2450','#14102a',dk));Rm(bx,by+7-bh,bw,1,lerp('#3a3268','#1c1838',dk));
      if(dk>.4){for(let wx=bx+1;wx<bx+bw-1;wx+=2)if((wx+by+Math.floor(T/50))%3)Rm(wx,by+8-bh+1,1,1,'#fff6a8')}}}
    const m=S.dmods[D.k];if(m!==1){const pr=(T%60)/60;g.strokeStyle=m>1?`rgba(134,224,111,${1-pr})`:`rgba(255,107,107,${1-pr})`;g.lineWidth=1;g.strokeRect(x-pr*6,y-pr*6,w+pr*12,h+pr*12)}
    // такси в районе
    const n=Math.round(S.alloc[D.k]/tot*14);for(let k=0;k<n;k++){const per=2*(w+h),pos=((T*.4+k*per/n)%per);let px,py;
      if(pos<w){px=x+pos;py=y}else if(pos<w+h){px=x+w;py=y+pos-w}else if(pos<2*w+h){px=x+w-(pos-w-h);py=y+h}else{px=x;py=y+h-(pos-2*w-h)}
      Rm(px-1,py-1,3,3,'#0e0b1c');Rm(px,py,2,2,'#f7c331');if(dk>.4){g.fillStyle='rgba(255,246,168,.25)';g.fillRect(Math.round(px)-2,Math.round(py)-2,6,6)}}
    g.fillStyle='#0e0b1c';g.font='7px monospace';g.fillText(D.n.split(' ')[0],x+3,y+9);g.fillStyle='#f3ecdc';g.fillText(D.n.split(' ')[0],x+2,y+8);
    if(m!==1){Rm(x+w-14,y+2,12,8,m>1?'#86e06f':'#ff6b6b');g.fillStyle='#0e0b1c';g.font='6px monospace';g.fillText('×'+m,x+w-14,y+8)}});
  // аэропорт: взлётная полоса и самолёт
  Rm(200,60,30,4,'#4a4570');for(let x=202;x<230;x+=5)Rm(x,61,2,1,'#f3ecdc');
  const pc=(T%400)/400;if(pc<.6){const px=200+pc/.6*40,py=61-Math.max(0,pc/.6-.4)*60;Rm(px,py,6,2,'#f3ecdc');Rm(px+2,py-2,2,6,'#f3ecdc');Rm(px+5,py-1,1,1,'#ff6b6b')}
  // вокзал: поезд
  Rm(24,122,84,2,'#8a83b0');for(let x=24;x<108;x+=4)Rm(x,124,2,1,'#5a5285');const tx=24+((T*.5)%110)-20;for(let k=0;k<4;k++)Rm(tx+k*7,118,6,4,k?'#4fc7b0':'#ff8a4c');
  // ваш парк
  Rm(140,58,10,8,'#0e0b1c');Rm(141,59,8,6,'#f7c331');drawLogo(g,S.custom&&S.custom.logo,141,58,'#0e0b1c');
  if(dk>.3){g.fillStyle=`rgba(10,8,30,${(dk*.25).toFixed(2)})`;g.fillRect(0,0,240,135)}
}
function svgChart(st,key,col){const W2=600,H2=130,P=6,vals=st.map(x=>x[key]),mn=Math.min(...vals),mx=Math.max(...vals),rg=(mx-mn)||1;
  const X=i=>P+i*(W2-2*P)/(st.length-1),Y=v=>H2-P-(v-mn)/rg*(H2-2*P-14);
  const pts=st.map((x,i)=>`${X(i).toFixed(1)},${Y(x[key]).toFixed(1)}`).join(' ');
  const fmt=v=>key==='money'?rub(v):String(v);
  return `<svg class="chart" viewBox="0 0 ${W2} ${H2}" role="img" aria-label="График">
    ${[0,.5,1].map(f=>`<line x1="${P}" x2="${W2-P}" y1="${(Y(mn+rg*f)).toFixed(1)}" y2="${(Y(mn+rg*f)).toFixed(1)}" style="stroke:var(--panel);stroke-width:2"/>`).join('')}
    <polygon points="${X(0)},${H2-P} ${pts} ${X(st.length-1)},${H2-P}" style="fill:${col};opacity:.15"/>
    <polyline points="${pts}" style="fill:none;stroke:${col};stroke-width:3;stroke-linejoin:round"/>
    <circle cx="${X(st.length-1)}" cy="${Y(vals[vals.length-1])}" r="5" style="fill:${col};stroke:var(--edge);stroke-width:2"/>
    <text x="${P}" y="12" style="fill:var(--muted);font:12px 'PT Mono',monospace">макс ${fmt(mx)}</text>
    <text x="${W2-P}" y="12" text-anchor="end" style="fill:var(--ink);font:12px 'PT Mono',monospace">сейчас ${fmt(vals[vals.length-1])}</text></svg>`}
function svgBars(st,key){const W2=600,H2=130,P=6,vals=st.map(x=>x[key]),mx=Math.max(1,...vals.map(Math.abs)),bw=(W2-2*P)/st.length,mid=H2/2;
  return `<svg class="chart" viewBox="0 0 ${W2} ${H2}" role="img" aria-label="Прибыль по дням">
    <line x1="${P}" x2="${W2-P}" y1="${mid}" y2="${mid}" style="stroke:var(--muted);stroke-width:1"/>
    ${vals.map((v,i)=>{const h=Math.abs(v)/mx*(mid-P);return `<rect x="${(P+i*bw+1).toFixed(1)}" y="${(v>=0?mid-h:mid).toFixed(1)}" width="${Math.max(1,bw-2).toFixed(1)}" height="${Math.max(1,h).toFixed(1)}" style="fill:${v>=0?'var(--good)':'var(--bad)'}"/>`}).join('')}
    <text x="${P}" y="12" style="fill:var(--muted);font:12px 'PT Mono',monospace">+${rub(mx)}</text></svg>`}

/* ---- сцена ---- */
const cv=$('scene'),cx=cv.getContext('2d'),H=150;
let W=640; // декорации создаются с запасом по ширине, реальную ширину задаёт fitScene()
let seed=7;const srnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const stars=Array.from({length:60},()=>[srnd()*W|0,srnd()*40|0,srnd()]);
const mkSky=(n,base,hmin,hmax)=>{const arr=[];let x=0;while(x<W){const w=8+(srnd()*16|0),h=hmin+(srnd()*(hmax-hmin)|0),win=[];for(let i=0;i<w*h/30;i++)win.push([srnd()*(w-2)+1|0,srnd()*(h-3)+2|0]);arr.push({x,w,h,win,base});x+=w+(srnd()*3|0)}return arr};
const farSky=mkSky(0,80,20,44),nearSky=mkSky(0,84,10,30);
const clouds=Array.from({length:6},(_,i)=>({x:srnd()*W,y:6+srnd()*26,w:16+(srnd()*22|0),v:.04+srnd()*.06}));
const birds=Array.from({length:4},()=>({x:srnd()*W,y:14+srnd()*30,v:.25+srnd()*.2}));
const peds=Array.from({length:5},(_,i)=>({x:srnd()*W,v:(i%2?-1:1)*(.15+srnd()*.12),c:['#4fc7b0','#e66fa8','#ff8a4c','#86c4e0','#f7c331'][i],h:['#3a2418','#1a1010','#b05a2a','#d0a040','#2a1a10'][i]}));
const drops=Array.from({length:70},()=>({x:srnd()*W,y:srnd()*H,s:.6+srnd()*.8}));
const SKIES={night:['#100c28','#141030','#181338','#1b1540','#1f1846','#231c4c','#281f52','#2c2257','#31255c','#372a62','#3d2e67','#43326c'],
 dawn:['#2c2257','#3a2a60','#4d3268','#61396d','#7a4372','#924d74','#ab5a76','#c26a78','#d57c7a','#e2907c','#ec a680'.replace(' ',''),'#f5bf88'],
 day:['#3f7fc4','#4686c8','#4d8dcc','#5594d0','#5d9bd4','#66a2d8','#70a9db','#7ab0df','#85b8e2','#90bfe6','#9cc7e9','#a8ceec'],
 dusk:['#231c4c','#2c2257','#3a2a60','#4d3268','#61396d','#7a4372','#924d74','#ad5470','#c8606a','#dc7266','#e88866','#f09e6c']};
const CYCLE=['night','dawn','day','day','day','dusk','night'];
const DARKV={night:1,dawn:.5,day:0,dusk:.5};
const hx=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const lerp=(a,b,f)=>{const A=hx(a),B=hx(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*f).toString(16).padStart(2,'0')).join('')};
let movers=[],t=0;
function syncMovers(){
  const working=S.fleet.filter(c=>!c.b).sort((a,b)=>MODELS[b.m].mult-MODELS[a.m].mult);
  let n=Math.min(S.drivers,working.length,10);if(strikeOn())n=Math.max(n?1:0,Math.floor(n/2));
  const onRoad=working.slice(0,n).map(c=>c.id);
  movers=movers.filter(m=>onRoad.includes(m.id));
  onRoad.forEach((id,i)=>{if(!movers.find(m=>m.id===id)){const lane=i%2;movers.push({id,m:S.fleet.find(c=>c.id===id).m,x:srnd()*W,lane,v:(lane?-1:1)*(.3+srnd()*.3)})}});
}
let SP=1,sceneDark=0,scn=null;
const R=(x,y,w,h,c)=>{cx.fillStyle=c;cx.fillRect(Math.round(x),Math.round(y),w,h)};
/* ---- свет: источники собираются за кадр, затем карта света (multiply) и свечение (lighter) ---- */
const lm=document.createElement('canvas');lm.width=W;lm.height=H;const lg=lm.getContext('2d');
let lights=[];
const light=(x,y,r,c,a=1,refl=0)=>lights.push({x,y,r,c,a,refl});
function glow(g,x,y,r,c,a){const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,`rgba(${c},${a})`);gr.addColorStop(.35,`rgba(${c},${a*.5})`);gr.addColorStop(1,`rgba(${c},0)`);g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)}
let vig;
/* ---- постобработка WebGL: свечение с размытием, цветокоррекция по времени суток и настроению, зерно ----
   картинка рисуется как раньше в холст #scene, а на экран выводится через шейдеры; без WebGL остаётся обычный холст */
const post=(()=>{
  const el=document.createElement('canvas');el.id='sceneGL';el.setAttribute('role','img');el.setAttribute('aria-label',cv.getAttribute('aria-label'));
  let gl=null;try{gl=el.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false})}catch(e){}
  if(!gl)return null;
  const VS='attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  const HEAD='precision mediump float;varying vec2 v;uniform sampler2D s;';
  const FS={
    bright:HEAD+'uniform float th;void main(){vec3 c=texture2D(s,v).rgb;float l=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c*smoothstep(th,1.,l),1.);}',
    blur:HEAD+'uniform vec2 d;void main(){vec3 c=texture2D(s,v).rgb*.227;c+=(texture2D(s,v+d*1.385).rgb+texture2D(s,v-d*1.385).rgb)*.316;c+=(texture2D(s,v+d*3.23).rgb+texture2D(s,v-d*3.23).rgb)*.07;gl_FragColor=vec4(c,1.);}',
    final:HEAD+'uniform sampler2D b;uniform vec2 res;uniform float bl,sat,con,gr,tm;uniform vec3 tint;'+
      'float h(vec2 q){return fract(sin(dot(q,vec2(12.9898,78.233)))*43758.5453);}'+
      'void main(){vec3 c=texture2D(s,v).rgb+texture2D(b,v).rgb*bl;float l=dot(c,vec3(.299,.587,.114));c=mix(vec3(l),c,sat);c=(c-.5)*con+.5;c*=tint;'+
      'c+=(h(floor(v*res)+tm)-.5)*gr;gl_FragColor=vec4(c,1.);}'};
  const sh=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw gl.getShaderInfoLog(s);return s};
  const P={};
  try{for(const k in FS){const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,VS));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,FS[k]));gl.bindAttribLocation(p,0,'p');gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw gl.getProgramInfoLog(p);P[k]={p,u:{}};}}catch(e){return null}
  const U=(k,n)=>P[k].u[n]||(P[k].u[n]=gl.getUniformLocation(P[k].p,n));
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  const tex=f=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);[gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER].forEach(p=>gl.texParameteri(gl.TEXTURE_2D,p,f));
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t};
  const src=tex(gl.NEAREST),bufs=[0,1].map(()=>{const t=tex(gl.LINEAR),f=gl.createFramebuffer();return{t,f}});
  let bw=1,bh=1,on=false,lost=false,fr=0,mood='day';
  // плавно меняющиеся параметры: к ним каждый кадр подтягиваются целевые
  const cur={bl:.4,th:.6,sat:1.1,con:1.05,r:1,g:1,b:1};
  el.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;api.show(false)});
  const api={
    show(v){on=v&&!lost;el.style.display=on?'block':'none';cv.style.display=on?'none':'block'},
    fit(cssW,cssH,devW,devH){if(!el.parentElement)cv.after(el);el.width=devW;el.height=devH;el.style.width=cssW;el.style.height=cssH;
      bw=Math.max(1,W>>1);bh=Math.max(1,H>>1);bufs.forEach(B=>{gl.bindTexture(gl.TEXTURE_2D,B.t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,bw,bh,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
        gl.bindFramebuffer(gl.FRAMEBUFFER,B.f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,B.t,0)});gl.bindFramebuffer(gl.FRAMEBUFFER,null)},
    get on(){return on},
    render(dark,wk){if(!on)return;if(fr++%30===0)mood=pickTrack();
      // цели: ночью холоднее и ярче свечение, на рассвете и закате теплее, на проверках тревожный красноватый тон
      const warm=Math.max(0,1-Math.abs(dark-.5)*2.5),tense=mood==='tension'?1:0,fog=wk==='fog'?1:0,rain=wk==='rain'?1:0;
      const T={bl:.3+dark*.85,th:.66-dark*.14,sat:1.12-fog*.25-rain*.08+tense*.05,con:1.06+tense*.04,
        r:(1.02-dark*.1)*(1+warm*.06)*(1+tense*.08),g:(1-dark*.04)*(1-warm*.02)*(1-tense*.05),b:(.97+dark*.12)*(1-warm*.08)*(1-tense*.06)*(1+rain*.04)};
      for(const k in T)cur[k]+=(T[k]-cur[k])*.06;
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,src);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,cv);
      const pass=(k,from,to,set)=>{gl.useProgram(P[k].p);gl.bindFramebuffer(gl.FRAMEBUFFER,to?to.f:null);gl.viewport(0,0,to?bw:el.width,to?bh:el.height);
        gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,from);gl.uniform1i(U(k,'s'),0);set&&set();gl.drawArrays(gl.TRIANGLE_STRIP,0,4)};
      const [A,B]=bufs;
      const filt=f=>{gl.bindTexture(gl.TEXTURE_2D,src);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,f);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,f)};
      filt(gl.LINEAR);pass('bright',src,A,()=>gl.uniform1f(U('bright','th'),cur.th));filt(gl.NEAREST);
      [1,2].forEach(r=>{pass('blur',A.t,B,()=>gl.uniform2f(U('blur','d'),r/bw,0));pass('blur',B.t,A,()=>gl.uniform2f(U('blur','d'),0,r/bh))});
      pass('final',src,null,()=>{gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,A.t);gl.uniform1i(U('final','b'),1);
        gl.uniform2f(U('final','res'),W,H);gl.uniform1f(U('final','bl'),cur.bl);gl.uniform1f(U('final','sat'),cur.sat);gl.uniform1f(U('final','con'),cur.con);
        gl.uniform1f(U('final','gr'),.035);gl.uniform1f(U('final','tm'),still?0:(fr%61));gl.uniform3f(U('final','tint'),cur.r,cur.g,cur.b)})}};
  return api})();
/* ровные пиксели: масштаб только целый (в точках экрана), а лишнюю ширину занимает сама сцена, не пустые поля */
function fitScene(){const d=devicePixelRatio||1,cw=cv.parentElement.clientWidth*d,k=Math.max(1,Math.ceil(cw/400));
  W=Math.floor(cw/k);
  if(W<320){W=320;cv.style.width='100%';cv.style.height='auto';post&&post.show(false)} // очень узкий экран: целый масштаб не помещается
  else{cv.style.width=W*k/d+'px';cv.style.height=H*k/d+'px';if(post){post.fit(cv.style.width,cv.style.height,W*k,H*k);post.show(true)}}
  cv.width=lm.width=W;cx.imageSmoothingEnabled=false;
  vig=cx.createRadialGradient(W/2,H*.55,H*.45,W/2,H*.55,W*.62);vig.addColorStop(0,'rgba(8,6,20,0)');vig.addColorStop(1,'rgba(8,6,20,.38)');
  if(typeof draw==='function'&&S)draw()}
fitScene();window.addEventListener('resize',fitScene);if(window.ResizeObserver)new ResizeObserver(()=>fitScene()).observe(cv.parentElement);
/* то же для холстов мини-игр, без расширения */
function crisp(el){if(!el)return;const d=devicePixelRatio||1,k=Math.max(1,Math.floor(el.clientWidth*d/el.width));el.style.width=el.width*k/d+'px';el.style.height=el.height*k/d+'px'}
function lightPass(dark,wet){
  if(dark>.05){
    const amb=lg.createLinearGradient(0,0,0,H);amb.addColorStop(0,lerp('#ffffff','#d0c8f0',dark));amb.addColorStop(.5,lerp('#ffffff','#7a72b4',dark));amb.addColorStop(.75,lerp('#ffffff','#463e86',dark));amb.addColorStop(1,lerp('#ffffff','#383070',dark));
    lg.globalCompositeOperation='source-over';lg.fillStyle=amb;lg.fillRect(0,0,W,H);
    lg.globalCompositeOperation='lighter';lights.forEach(l=>glow(lg,l.x,l.y,l.r,l.c,l.a*dark));
    cx.globalCompositeOperation='multiply';cx.drawImage(lm,0,0);
    cx.globalCompositeOperation='lighter';lights.forEach(l=>glow(cx,l.x,l.y,l.r*.55,l.c,l.a*dark*.28));
    // мокрый асфальт: огни отражаются полосами на дороге
    if(wet)lights.forEach(l=>{if(!l.refl)return;const gr=cx.createLinearGradient(0,103,0,136);gr.addColorStop(0,`rgba(${l.c},${.22*l.a*dark})`);gr.addColorStop(1,`rgba(${l.c},0)`);cx.fillStyle=gr;cx.fillRect(Math.round(l.x)-1,103,3,33)});
    cx.globalCompositeOperation='source-over'}
  lights=[];cx.fillStyle=vig;cx.fillRect(0,0,W,H)}
const PERSON_B=[
"..HHH..",
".HHHHH.",
".HbbbH.",
"..bbb..",
".kkkkk.",
"kkkkkkk",
"k.kkk.k",
"b.kkk.b",
"..PP...",
".P..P..",
".P...P."];
function drawPeds(dark){peds.forEach((p,i)=>{p.x+=p.v*SP;if(p.x>W+8)p.x=-8;if(p.x<-8)p.x=W+8;const fr=Math.floor(t/3+i)%2;
  spr(cx,fr?PERSON_B:PERSON,Math.round(p.x),139,p.v<0,{b:'#f0c8a0',k:p.c,H:p.h})})}
function tree(x,y,month){const winter=month===11||month<=1,autumn=month>=8&&month<=10;
  R(x+3,y+8,2,6,'#5a3a20');const c1=winter?'#e8eef8':autumn?'#e8883a':'#3a9a5a',c2=winter?'#b8c8d8':autumn?'#c25a22':'#2e7a44';
  R(x+1,y+2,6,6,c2);R(x,y+3,8,4,c2);R(x+2,y+1,4,1,c1);R(x+1,y+2,4,3,c1);R(x+2,y+5,2,1,c1)}
/* ---- частицы: пыль в свете фонарей, пар из люка, листья, выхлоп на морозе, капли и брызги ---- */
let parts=[],sunDx=0;
const emit=(k,x,y,vx,vy,life,c,s=1)=>{const p={k,x,y,vx,vy,life,max:life,c,s};if(parts.length<260)parts.push(p);return p};
const chance=p=>Math.random()<p*SP;
function stepParts(){if(still){parts=[];return}
  parts=parts.filter(p=>{p.life-=SP;if(p.life<=0)return false;const a=p.life/p.max;
    if(p.k==='leaf'){if(p.vy){p.x+=(p.vx+Math.sin((t+p.s*40)/9)*.25)*SP;p.y+=p.vy*SP;if(p.y>=p.g){p.y=p.g;p.vy=0}}}
    else if(p.k==='drip'){p.vy+=.06*SP;p.y+=p.vy*SP;if(p.y>=p.g){for(let i=0;i<2;i++)emit('spl',p.x,p.g,(i?.3:-.3),-.5,8,'#9fd3ff');return false}}
    else if(p.k==='spl'){p.vy+=.12*SP;p.x+=p.vx*SP;p.y+=p.vy*SP}
    else if(p.k==='coin'){p.vy+=.04*SP;p.x+=p.vx*SP;p.y+=p.vy*SP}
    else{p.x+=p.vx*SP;p.y+=p.vy*SP}
    const x=Math.round(p.x),y=Math.round(p.y);
    if(p.k==='dust'){cx.globalCompositeOperation='lighter';cx.globalAlpha=Math.min(1,a*3)*(.35+.35*Math.sin(t/7+p.s*9));R(x,y,1,1,'#fff6c8');cx.globalCompositeOperation='source-over'}
    else if(p.k==='steam'||p.k==='puff'){const sz=Math.round(p.s+(1-a)*(p.k==='steam'?4:2));cx.globalAlpha=a*(p.k==='steam'?.3:.45);R(x-(sz>>1),y-(sz>>1),sz,sz,p.c);if(sz>2)R(x-(sz>>1)+1,y-(sz>>1)-1,sz-2,sz+2,p.c)}
    else if(p.k==='ripple'){const r=Math.round((1-a)*3)+1;cx.globalAlpha=a*.8;R(x-r,y,1,1,p.c);R(x+r,y,1,1,p.c);R(x-r+1,y-1,r*2-1,1,p.c);R(x-r+1,y+1,r*2-1,1,p.c)}
    else if(p.k==='coin'){cx.globalAlpha=Math.min(1,a*3);const sh=(Math.floor(t/3+p.x)%3);R(x,y,sh?2:1,2,'#f7c331');R(x,y,1,1,'#fff6a8')}
    else{cx.globalAlpha=p.k==='leaf'?Math.min(1,a*4):Math.min(1,a*2);R(x,y,p.k==='drip'?1:p.s,p.k==='drip'?2:1,p.c)}
    cx.globalAlpha=1;return true})}
/* мягкая тень: днём сдвинута от солнца, ночью прямо под предметом */
function shadow(x,gy,w){R(x+2+(sunDx>>1),gy,w-4,1,'#0e0b1c88');cx.globalAlpha=.45;R(x+3+sunDx,gy+1,w-6,1,'#0e0b1c');cx.globalAlpha=1}
const PUDDLES=[[38,107,14],[128,126,18],[262,109,12],[334,127,16],[88,142,10],[200,145,12]];
/* дорога и тротуар по погоде: лужи в дождь, снег зимой, люк с паром */
function ground(month,wk,dark,snow){
  const mx=150;R(mx,118,7,3,'#1a1830');R(mx+1,119,5,1,'#3a3654');
  if((month>=9||month<=3||dark>.5)&&chance(.12))emit('steam',mx+3+Math.random()*2,117,(Math.random()-.5)*.08,-.13,140,'#d8d0e8',1+Math.random());
  if(wk==='rain'){const sky=lerp('#4a5a90','#2a2a58',dark);PUDDLES.forEach(([x,y,w])=>{if(x>W)return;R(x+1,y,w-2,1,'#1c1a34');R(x,y+1,w,1,'#1c1a34');R(x+1,y+2,w-2,1,'#1c1a34');R(x+2,y+1,w-5,1,sky);
      if(chance(.05))emit('ripple',x+2+Math.random()*(w-4),y+1,0,0,12,'#9fd3ff')});
    if(chance(1.2))emit('spl',Math.random()*W,103+Math.random()*46,(Math.random()-.5)*.4,-.5,8,'#9fd3ff')}
  if(snow){cx.fillStyle='#e8eef8';for(let x=0;x<W;x++){const h=1+((x*37)%7<2?1:0);cx.fillRect(x,102,1,h);cx.fillRect(x,136-h,1,h)}
    R(0,98,W,2,'#f3f6fc');cx.globalAlpha=.55;R(0,138,W,12,'#e8eef8');cx.globalAlpha=1;
    cx.globalAlpha=.35;R(0,112,W,2,'#4a4870');R(0,129,W,2,'#4a4870');cx.globalAlpha=1}}
/* снег на крыше, вывеске и навесах */
function snowCaps(bTop){const c='#f3f6fc';R(4,bTop-3,176,2,c);for(let x=8;x<176;x+=11)R(x,bTop-4,4,1,c);R(46,bTop-15,92,1,c);R(150,bTop-7,8,1,c);R(160,bTop-5,6,1,c);
  DEPTS.forEach((D,d)=>R(10+d*57,57,48,1,c))}
function draw(){
  if(!S||!S.fleet||!S.heads)return;syncMovers();
  const L=500,pos=(t%(L*(CYCLE.length-1)))/L,ph=Math.floor(pos),f=pos-ph;
  const a=SKIES[CYCLE[ph]],b=SKIES[CYCLE[ph+1]];
  const dark=DARKV[CYCLE[ph]]*(1-f)+DARKV[CYCLE[ph+1]]*f;
  const month=dateOf(S.day).getMonth(),wk=S.weather&&S.weather[0];sceneDark=dark;
  const snow=wk==='snow'||month===11||month<=1,cold=month>=10||month<=2;
  sunDx=dark<.7?Math.max(-5,Math.min(5,Math.round(((pos-1)/4-.5)*-10))):0;
  // небо с дизерингом между полосами
  for(let i=0;i<12;i++){const c=lerp(a[i],b[i],f);R(0,i*7,W,7,c);if(i<11){const n=lerp(a[i+1],b[i+1],f);cx.fillStyle=n;for(let x=(i%2);x<W;x+=2)cx.fillRect(x,i*7+6,1,1)}}
  if(dark<.4)birds.forEach(bd=>{bd.x+=bd.v*SP;if(bd.x>W+10)bd.x=-10;const fy=bd.y+Math.sin((t+bd.x)/10)*2,wing=Math.floor(t/4+bd.x)%2;R(bd.x,fy,1,1,'#2a2450');R(bd.x-1,fy-wing,1,1,'#2a2450');R(bd.x+1,fy-wing,1,1,'#2a2450')});
  if(dark>.4)stars.forEach(([x,y,p])=>{if(Math.sin(t/20+p*40)>-.2){R(x,y,1,1,p>.7?'#fff6a8':'#c6bfe4')}});
  if(dark>.5){const MOON=['..###...','.####...','###.....','###.....','###.....','###.....','.####...','..###...'];MOON.forEach((r,yy)=>{for(let xx=0;xx<8;xx++)if(r[xx]==='#')R(280+xx,7+yy,1,1,xx<1||yy<1||yy>6?'#d8d0c0':'#f3ecdc')});
    cx.globalCompositeOperation='lighter';cx.fillStyle='rgba(243,236,220,.06)';cx.fillRect(276,3,16,16);cx.globalCompositeOperation='source-over';light(284,11,34,'225,220,255',.7)}
  else{R(276,7,12,12,'#ffe27a');R(278,9,8,8,'#fff6a8');R(274,12,2,2,'#ffe27a88');R(288,12,2,2,'#ffe27a88')}
  // облака
  const cc=lerp('#ffffff','#4a4070',dark),cs=lerp('#d8e4f4','#3a3260',dark);
  clouds.forEach(c=>{c.x+=c.v*SP;if(c.x>W+30)c.x=-40;const x=Math.round(c.x),y=Math.round(c.y);R(x,y+2,c.w,4,cs);R(x+3,y,c.w-8,3,cc);R(x+1,y+2,c.w-2,2,cc)});
  // дальний и ближний город
  const far=lerp('#7a86b8','#2a2450',dark),near=lerp('#5a5c90','#1c1838',dark);
  farSky.forEach(s=>R(s.x,s.base-s.h,s.w,s.h,far));
  // дымка у горизонта: дальний город тонет в воздухе
  const hz=cx.createLinearGradient(0,36,0,90);hz.addColorStop(0,lerp(a[11],b[11],f)+'00');hz.addColorStop(1,lerp(a[11],b[11],f)+'b0');cx.fillStyle=hz;cx.fillRect(0,36,W,54);
  nearSky.forEach(s=>{R(s.x,s.base-s.h,s.w,s.h,near);if(dark>.3)s.win.forEach(([wx,wy],i)=>{if(wy<s.h-1&&(i+(t/90|0))%6)R(s.x+wx,s.base-s.h+wy,1,1,'#f7c33199')})});
  // здание парка: этажи растут со званием
  const floors=S.rank||0,bTop=52-floors*9;
  R(4,bTop,176,98-bTop,'#3b3470');R(4,bTop-1,176,2,'#0e0b1c');R(4,bTop,1,98-bTop,'#0e0b1c');R(179,bTop,1,98-bTop,'#0e0b1c');
  for(let y=bTop+4;y<98;y+=5)R(5,y,174,1,'#352e66');
  for(let fl=0;fl<floors;fl++){const y=52-(fl+1)*9+2;for(let x=10;x<176;x+=14){const lit=dark>.4&&((x+fl*7+(t/120|0))%3);R(x,y,8,5,lit?'#fff6a8':'#6fa3d0');R(x,y+2,8,1,lit?'#e8d890':'#5a8ab8');if(lit){cx.globalCompositeOperation='lighter';cx.fillStyle='rgba(255,230,140,.12)';cx.fillRect(x-2,y-2,12,9);cx.globalCompositeOperation='source-over';light(x+4,y+3,13,'255,214,140',.75,1)}}}
  // крыша: вывеска, антенна, кондиционеры
  R(150,bTop-6,8,6,'#5a5285');R(160,bTop-4,6,4,'#5a5285');R(24,bTop-14,1,14,'#8a83b0');R(22,bTop-14,5,1,'#8a83b0');if((t>>4)%2){R(24,bTop-15,1,1,'#ff6b6b');light(24,bTop-15,7,'255,80,80',.9)}
  R(46,bTop-14,92,13,'#0e0b1c');R(47,bTop-13,90,11,dark>.4?'#ffd447':'#f7c331');
  drawLogo(cx,S.custom&&S.custom.logo,49,bTop-12,'#f7c331');R(49,bTop-12,8,8,'#0e0b1c');drawLogo(cx,S.custom&&S.custom.logo,49,bTop-12,'#f7c331');
  cx.fillStyle='#0e0b1c';cx.font='7px "Press Start 2P", monospace';cx.textBaseline='top';cx.fillText(parkName().slice(0,9),60,bTop-11);
  if(dark>.4){R(46,bTop-1,92,1,'#ffd44766')}
  light(70,bTop-7,40,'255,212,71',.85,1);light(115,bTop-7,40,'255,212,71',.85,1);
  DEPTS.forEach((D,d)=>{
    const x=10+d*57,y=58;
    R(x,y,48,5,D.hex);for(let i=0;i<12;i++)R(x+i*4,y+5,4,2,i%2?D.hex:'#f3ecdc');
    R(x+3,y+9,16,11,dark>.4?'#fff6a8':'#9fd3ff');R(x+3,y+14,16,1,'#6fa3d0');R(x+11,y+9,1,11,'#6fa3d0');R(x+3,y+9,16,1,'#0e0b1c55');
    light(x+11,y+15,22,'255,220,150',.8,1);light(x+24,y+3,14,D.hex.match(/\w\w/g).map(h=>parseInt(h,16)).join(','),.5);
    if(d===2){R(x+24,y+9,22,31,'#211b3d');for(let r=0;r<7;r++)R(x+24,y+11+r*4,22,1,'#4a4570')}
    else{R(x+27,y+9,15,31,'#211b3d');R(x+28,y+10,13,29,'#2a2450');R(x+39,y+23,2,2,D.hex)}
    if(!S.done[d]&&!S.over&&!S.preview){const bob=Math.round(Math.sin(t/6+d)*1.5);R(x+18,y-14+bob,11,12,'#0e0b1c');R(x+19,y-13+bob,9,10,'#f3ecdc');R(x+23,y-11+bob,2,5,'#ff6b6b');R(x+23,y-5+bob,2,1,'#ff6b6b')}
    else if(S.done[d]){R(x+20,y-8,2,2,'#86e06f');R(x+22,y-6,2,2,'#86e06f');R(x+24,y-10,2,4,'#86e06f');R(x+26,y-12,2,2,'#86e06f')}
    if(wk==='rain'&&chance(.04))emit('drip',x+Math.random()*48,66,0,0,80,'#9fd3ff').g=97;
  });
  if(snow)snowCaps(bTop);
  if(S.cnt.cat){const px=166,py=bTop-3;R(px,py,6,3,'#e8883a');R(px+5,py-2,3,3,'#e8883a');R(px+5,py-3,1,1,'#e8883a');R(px+7,py-3,1,1,'#e8883a');R(px-2,py-1+Math.round(Math.sin(t/8)),2,1,'#e8883a')}
  if(getEv(1,S.today[1]).t==='Гуси на стоянке'){for(let i=0;i<3;i++){const gx=150+i*9+Math.round(Math.sin(t/5+i)*2);R(gx,92,5,3,'#f3ecdc');R(gx+4,89,1,3,'#f3ecdc');R(gx+5,89,1,1,'#ff8a4c');R(gx+1,95,1,1,'#ff8a4c');R(gx+3,95,1,1,'#ff8a4c')}}
  const idle=Math.max(0,S.drivers-(carsN()-brokenN()));
  for(let i=0;i<Math.min(idle,5);i++){R(169-i*8+(sunDx>>1),98,5,1,'#0e0b1c66');spr(cx,PERSON,168-i*8,87,false,{b:'#f0c8a0',k:['#4fc7b0','#e66fa8','#ff8a4c'][i%3]})}
  if(strikeOn()&&!(scn&&/^strike/.test(scn.type)))for(let i=0;i<pickets();i++)striker(PICKET_X[i],i,1);
  if(S.owned&&S.owned.car)spr(cx,LIMO,152,87,false,{y:'#1c1a24',l:'#3a3550',d:'#0b0914',t:'#1c1a24',k:'#0b0914',b:'#1c1a24',c:'#1c1a24',g:'#e8e2d0'});
  // стоянка
  const cols=10,rowsAll=Math.ceil(S.spots/cols),rows=Math.min(6,rowsAll),lotY=98-rows*8-2;
  R(186,lotY,132,rows*8+2,'#2b2842');R(186,lotY-1,132,1,'#0e0b1c');
  const roadIds=movers.map(m=>m.id),parked=S.fleet.filter(c=>!roadIds.includes(c.id)).sort((p,q)=>q.b-p.b);
  for(let sI=0;sI<Math.min(S.spots,rows*cols);sI++){const r=sI/cols|0,c=sI%cols,px=188+c*13,py=lotY+2+r*8;
    R(px-1,py,1,6,'#4a4570');
    const car=parked[sI];if(car){const brk=car.b,P=carPal(car.m);
      R(px+1,py+1,10,5,brk?'#7a6e58':P.y);R(px+3,py+2,5,3,brk?'#5a4e38':P.d);R(px+8,py+2,1,3,'#9fd3ff');R(px+1,py+6,10,1,'#0e0b1c66');
      if(brk&&((t>>3)+sI)%2)R(px+5,py,1,1,'#ff6b6b')}}
  const hidden=parked.length-rows*cols;if(hidden>0){cx.fillStyle='#f3ecdc';cx.font='6px monospace';cx.fillText(`+${hidden}`,296,lotY-8)}
  // тротуар, дорога, разметка, переход
  R(0,98,W,4,'#8a83b0');R(0,101,W,1,'#5a5285');R(0,102,W,34,'#2a2740');
  for(let i=0;i<40;i++)R((i*53)%W,103+(i*7)%32,1,1,'#33304a');
  cx.fillStyle='#f7c331';for(let x=-(Math.floor(t)%16);x<W;x+=16)cx.fillRect(x,119,8,1);
  for(let y=104;y<134;y+=4)R(222,y,14,2,'#d8d0e8');
  R(0,136,W,2,'#8a83b0');R(0,138,W,12,'#5a5285');for(let x=0;x<W;x+=10)R(x,138,1,12,'#4a4570');
  ground(month,wk,dark,snow);
  // машины с тенями
  const red=(Math.floor(t)%240)>150;
  // светофор у перехода
  R(240,88,2,14,'#4a4570');R(238,80,6,9,'#0e0b1c');R(239,81,4,3,red?'#ff4d4d':'#3a1a1a');R(239,85,4,3,red?'#1a3a1a':'#86e06f');
  if(dark>.3){cx.globalCompositeOperation='lighter';cx.fillStyle=red?'rgba(255,77,77,.18)':'rgba(134,224,111,.18)';cx.fillRect(235,78,12,12);cx.globalCompositeOperation='source-over'}
  light(241,red?82:86,14,red?'255,77,77':'134,224,111',.9,1);
  movers.forEach(m=>{const nx=m.x+m.v*SP;
    const cw=carW(m.m),ho=carHo(m.m);
    const stop=red&&((m.lane===0&&m.x+cw<=220&&nx+cw>196)||(m.lane===1&&m.x>=238&&nx<262));
    if(!stop)m.x=nx;if(m.x>W+4)m.x=-cw-4;if(m.x<-cw-4)m.x=W+4;const x=Math.round(m.x),y=m.lane?121:104;
    shadow(x,y+11,cw);drawCar(cx,m.m,x,y+11,m.lane===1,carPal(m.m),Math.floor(m.x/2));
    if(wk==='rain'&&!stop&&chance(.15))emit('spl',x+(m.lane===0?4:cw-4),y+11,m.lane===0?-.4:.4,-.6,10,'#9fd3ff');
    if(!stop&&!MODELS[m.m].ev&&(Math.floor(t+m.id*7)%9)<2){const ex=m.lane===0?x-2:x+cw+1;R(ex,y+7,2,1,'#a8a0cc66');if(cold&&chance(.5))emit('puff',ex,y+7,m.lane===0?-.15:.15,-.04,50,'#e8eef8')}
    if(dark>.35){cx.globalCompositeOperation='lighter';const dir=m.lane===0?1:-1,hx0=m.lane===0?x+cw:x-1;
      for(let k=0;k<8;k++){const hh=1+Math.floor(k*.6);cx.fillStyle=`rgba(255,240,170,${(.13-k*.014).toFixed(3)})`;cx.fillRect(hx0+dir*k*2-(dir<0?1:0),y+ho-Math.floor(hh/2),2,hh)}
      cx.fillStyle='rgba(255,60,60,.35)';cx.fillRect(m.lane===0?x-1:x+cw,y+ho-1,1,2);cx.globalCompositeOperation='source-over'}
    light(m.lane===0?x+cw+11:x-12,y+ho+1,17,'255,240,190',.9,1);light(m.lane===0?x-1:x+cw+1,y+ho,6,'255,60,60',.8)});
  drawPeds(dark);
  // деревья и фонари внизу
  for(let x=6;x<W;x+=52){tree(x,136-6,month);if(month>=8&&month<=10&&chance(.012))emit('leaf',x+1+Math.random()*6,132,(Math.random()-.5)*.1,.1,420,['#e8883a','#c25a22','#f7c331'][Math.random()*3|0],1).g=140+Math.random()*9}
  for(let x=32;x<W;x+=52){R(x,124,1,14,'#8a83b0');R(x,123,4,1,'#8a83b0');R(x+3,124,2,1,dark>.4?'#fff6a8':'#c6bfe4');light(x+4,129,26,'255,236,170',1,1);if(snow)R(x,122,4,1,'#f3f6fc');if(dark>.5&&chance(.05))emit('dust',x+1+Math.random()*7,125+Math.random()*11,(Math.random()-.5)*.05,-.02,160,'',Math.random());if(dark>.4){cx.globalCompositeOperation='lighter';for(let k=0;k<3;k++){cx.fillStyle=`rgba(255,240,170,${(.06-k*.015).toFixed(3)})`;cx.fillRect(x+1-k*2,125+k,4+k*4,10-k)}cx.globalCompositeOperation='source-over'}}
  // погода
  if(wk==='rain'||wk==='snow'){drops.forEach(d=>{d.y+=(wk==='snow'?d.s*.5:d.s*3)*SP;d.x+=(wk==='snow'?Math.sin((t+d.y)/20)*.3:-.6)*SP;if(d.y>H){d.y=-2;d.x=srnd()*W}if(d.x<0)d.x=W;
    if(wk==='snow')R(Math.round(d.x),Math.round(d.y),1,1,'#f3ecdc');else R(Math.round(d.x),Math.round(d.y),1,3,'#9fd3ff88')})}
  // туман: полосы медленно плывут в разные стороны
  if(wk==='fog'){cx.globalAlpha=.16;for(let i=0;i<4;i++){const y=60+i*22,w=W*.6,off=((t*.15*(i%2?1:-1)+i*80)%(W+w)+W+w)%(W+w)-w;R(off,y,w,10,'#c6bfe4');R(off+8,y-3,w-16,3,'#c6bfe4');R(off+8,y+10,w-16,3,'#c6bfe4')}cx.globalAlpha=1}
  if(wk==='heat'&&dark<.5){cx.fillStyle='#ffb04a14';cx.fillRect(0,0,W,H)}
  stepParts();
  drawScene(dark);
  lightPass(dark,wk==='rain');
  if(post&&post.on)post.render(dark,wk);
  t+=SP;
}
/* ---- сценки событий на картинке парка ---- */
function triggerScene(type){scn={type,t0:t};}
const SCN_DUR={ufo:220,meteor:160,crash:150,geese:160,tow:190,police:200,party:170,founder:170,newcar:150,strikeStart:170,strikeEnd:150};
/* бастующий водитель; up — насколько поднят плакат (0…1) */
const PICKET_X=[16,28,60,72,84,116],pickets=()=>Math.min(6,Math.max(1,Math.ceil(S.drivers/2)));
function striker(x,i,up){const y=87;R(x+1+(sunDx>>1),98,5,1,'#0e0b1c66');spr(cx,PERSON,x,y,i%2,{b:'#f0c8a0',k:['#4fc7b0','#e66fa8','#ff8a4c','#86c4e0','#f7c331','#a8a0cc'][i%6]});
  if(up>0){const sy=y-5-Math.round(up*4)-((Math.floor(t/8)+i)%2);R(x+3,sy+5,1,y+3-sy-5,'#8a83b0');R(x,sy,7,5,'#0e0b1c');R(x+1,sy+1,5,3,'#f3ecdc');R(x+2,sy+2,3,1,'#ff4d4d')}}
function drawScene(dark){if(!scn)return;const d=SCN_DUR[scn.type]||150,e=t-scn.t0,p=e/d;if(p>=1){scn=null;return}
  const ease=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
  if(scn.type==='ufo'){const x=330-ease(Math.min(1,p*2))*110-Math.max(0,p-.75)*4*300,y=26+Math.sin(e/8)*3;
    R(x-8,y,22,3,'#a8a0cc');R(x-4,y-3,14,3,'#c6bfe4');R(x-1,y-5,8,2,'#9fd3ff');for(let i=0;i<4;i++)R(x-6+i*6,y+1,2,1,Math.floor(e/4+i)%2?'#ffe27a':'#86e06f');
    if(p>.3&&p<.75){cx.globalCompositeOperation='lighter';for(let k=0;k<6;k++){cx.fillStyle=`rgba(160,255,200,${(.08-k*.01).toFixed(3)})`;cx.fillRect(x-2-k*3,y+3+k*10,10+k*6,10)}cx.globalCompositeOperation='source-over'}}
  if(scn.type==='meteor'){for(let i=0;i<6;i++){const k=(e*1.6+i*30)%120,x=40+i*45+k,y=4+k*.4;R(x,y,2,1,'#fff6a8');R(x-3,y-1,3,1,'#fff6a888');R(x-6,y-2,3,1,'#fff6a844')}}
  if(scn.type==='crash'){const meet=Math.min(1,p*2.2),xa=-30+ease(meet)*125,xb=W+10-ease(meet)*125;
    drawCar(cx,'solaris',xa,115,false,null,Math.floor(xa/2));drawCar(cx,'rio',xb,115,true,null,Math.floor(xb/2));
    if(meet>=1){const k=e-d/2.2;for(let i=0;i<10;i++){const a=i/10*6.28,r=(k%40)*.5;if(k<40)R(119+Math.cos(a)*r,109+Math.sin(a)*r*.6,1,1,i%2?'#ffe27a':'#ff8a4c')}
      R(110,90,11,11,'#0e0b1c');R(111,91,9,9,'#f3ecdc');R(115,92,2,5,'#ff4d4d');R(115,98,2,1,'#ff4d4d');
      for(let i=0;i<3;i++){const sx=112+i*5,sy=96-((e+i*13)%30)*.5;R(sx,sy,2,2,'#a8a0cc88')}}}
  if(scn.type==='geese'){const gx=W-ease(p)*(W+40);spr(cx,PERSON,gx,139,true,{b:'#e8b890',k:'#3a7fa0',H:'#ff8a4c'});
    for(let i=0;i<3;i++){const x=gx+16+i*10,y=144+Math.round(Math.sin(e/2+i)*1);R(x,y,5,3,'#f3ecdc');R(x-1,y-3,1,3,'#f3ecdc');R(x-2,y-3,1,1,'#ff8a4c');R(x+1,y+3,1,1,'#ff8a4c');R(x+3,y+3,1,1,'#ff8a4c')}
    if(Math.floor(e/6)%2){R(gx+2,130,3,6,'#f3ecdc');R(gx+3,131,1,3,'#ff4d4d')}}
  if(scn.type==='tow'){const inP=Math.min(1,p*3),outP=Math.max(0,(p-.6)/.4),x=W+10-ease(inP)*110-ease(outP)*(W);
    R(x,104,30,8,'#ff8a4c');R(x+20,98,10,7,'#ff8a4c');R(x+22,99,6,3,'#9fd3ff');R(x+2,112,6,3,'#0e0b1c');R(x+20,112,6,3,'#0e0b1c');R(x-8,100,10,1,'#8a83b0');
    if(Math.floor(e/5)%2)R(x+24,96,3,2,'#ffe27a');
    if(p>.33)drawCar(cx,'granta',x-32,109+(p<.45?Math.round((.45-p)*40):0),false)}
  if(scn.type==='police'){const x=-40+ease(p)*(W+80);R(x,104,26,8,'#f3ecdc');R(x+6,100,13,4,'#f3ecdc');R(x+8,101,4,2,'#9fd3ff');R(x+13,101,4,2,'#9fd3ff');R(x,107,26,2,'#3a6ab8');
    R(x+3,112,5,3,'#0e0b1c');R(x+18,112,5,3,'#0e0b1c');const on=Math.floor(e/3)%2;light(x+12,99,24,on?'255,60,60':'60,90,255',1);R(x+9,98,3,2,on?'#ff4d4d':'#4d6dff');R(x+13,98,3,2,on?'#4d6dff':'#ff4d4d');
    cx.globalCompositeOperation='lighter';for(let k=1;k<4;k++){cx.fillStyle=`rgba(255,60,60,${(.12/k).toFixed(3)})`;cx.fillRect(x+10-k*2,98-k,2+k*2,2+k*2);cx.fillStyle=`rgba(60,90,255,${(.12/k).toFixed(3)})`;cx.fillRect(x+14-k*2,98-k,2+k*2,2+k*2)}cx.globalCompositeOperation='source-over'}
  if(scn.type==='party'){for(let i=0;i<40;i++){const x=(i*37+e*.7*(i%3+1))%180+4,y=((i*23)+e*(.6+(i%4)*.2))%70+20;R(x,y,2,1,['#f7c331','#e66fa8','#4fc7b0','#86e06f','#ff8a4c'][i%5])}
    if(Math.floor(e/8)%2){R(70,30,2,5,'#f3ecdc');R(72,30,3,1,'#f3ecdc');R(110,26,2,5,'#f3ecdc');R(112,26,3,1,'#f3ecdc')}}
  if(scn.type==='founder'){const arrive=Math.min(1,p*2.5),x=W+10-ease(arrive)*(W-60);spr(cx,LIMO,x,104,true,{y:'#1c1a24',l:'#3a3550',d:'#0b0914',t:'#1c1a24',k:'#0b0914',b:'#1c1a24',c:'#1c1a24',g:'#e8e2d0'});
    if(arrive>=1){const wp=Math.min(1,(p-.4)/.4);if(wp>0)spr(cx,PERSON,x+6-wp*20,92+0,true,{b:'#e8b890',k:'#2e2a40',H:'#8a8a8a'})}}
  if(scn.type==='strikeStart'||scn.type==='strikeEnd'){const st=scn.type==='strikeStart';for(let i=0;i<pickets();i++){const sx=PICKET_X[i],door=i%2?94:37;
    if(st)striker(Math.round(door+(sx-door)*ease(Math.min(1,p/.6))),i,Math.max(0,(p-.6)/.4));
    else striker(Math.round(sx+(200+i*12-sx)*ease(Math.max(0,(p-.3)/.7))),i,Math.max(0,1-p/.3))}}
  if(scn.type==='newcar'){const x=-30+ease(Math.min(1,p*1.6))*190;drawCar(cx,'solarisNew',x,115,false,null,Math.floor(x/2));
    if(p>.5)for(let i=0;i<6;i++){const a=e/6+i;R(x+12+Math.cos(a)*16,108+Math.sin(a)*8,1,1,'#ffe27a')}}
}
const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
let last=0;function loop(ts){if(paused){last=0;requestAnimationFrame(loop);return}const dt=last?Math.min(100,ts-last):16;last=ts;SP=dt/70;draw();requestAnimationFrame(loop)}

/* ================= ЗАСТАВКА ================= */
function splash(){const el=$('splash');if(!el)return;const c=$('splC'),g=c.getContext('2d');g.imageSmoothingEnabled=false;
  const W=200,H=112,R=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(Math.round(x),Math.round(y),w,h)};
  let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
  const stars=Array.from({length:50},()=>[rnd()*W,rnd()*60,rnd()*6]);
  const blds=[];for(let x=0;x<W;){const w=8+Math.floor(rnd()*14),h=14+Math.floor(rnd()*30);blds.push([x,w,h,Array.from({length:40},()=>rnd()<.35)]);x+=w+1}
  let t0=null,raf=0,done=false;
  function frame(ts){if(done)return;if(t0===null)t0=ts;const e=(ts-t0)/16;
    R(0,0,W,H,'#120e26');R(0,40,W,30,'#1a1436');
    stars.forEach(([x,y,p])=>{if(Math.floor(e/20+p)%5)R(x,y,1,1,'#cfc6ff')});
    for(let yy=-5;yy<=5;yy++)for(let xx=-5;xx<=5;xx++){if(xx*xx+yy*yy<=25&&(xx-3)*(xx-3)+(yy+1)*(yy+1)>16)R(172+xx,16+yy,1,1,'#f3ecdc')}
    blds.forEach(([x,w,h,win])=>{R(x,86-h,w,h,'#231c45');let k=0;for(let yy=86-h+3;yy<84;yy+=4)for(let xx=x+2;xx<x+w-2;xx+=3){if(win[k++%40])R(xx,yy,1,2,'#f7c331')}});
    R(0,86,W,26,'#2a2540');for(let x=-(e*1.5%16);x<W;x+=16)R(x,98,8,1,'#f7c331');R(0,110,W,2,'#3a3458');
    const tx=((e*1.6)%(W+80))-40;
    g.globalCompositeOperation='lighter';for(let k=0;k<5;k++){g.fillStyle=`rgba(255,226,122,${(.1-k*.018).toFixed(3)})`;g.fillRect(Math.round(tx+24),Math.round(93-k),10+k*7,4+k*2)}g.globalCompositeOperation='source-over';
    try{spr(g,SEDAN,tx,90,false,carPal('solaris'))}catch(err){R(tx,92,24,8,'#f7c331')}
    if(!still)raf=requestAnimationFrame(frame)}
  raf=requestAnimationFrame(frame);
  const close=()=>{if(done)return;done=true;cancelAnimationFrame(raf);el.classList.add('out');setTimeout(()=>el.remove(),600)};
  el.addEventListener('pointerdown',()=>{ensureAudio();sfx('win');close()});
  el.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ensureAudio();close()}});
  el.focus&&el.focus();
  setTimeout(close,still?1500:4500)}

/* ---- логотип студии SitromGames ---- */
function studioLogo(next){const el=$('studio');if(!el)return next();
  const g=$('studioC').getContext('2d'),P=(x,y,c)=>{g.fillStyle=c;g.fillRect(x,y,1,1)};
  // долька цитруса: кожура, белая прослойка, сочные сегменты, листик
  for(let y=0;y<24;y++)for(let x=0;x<24;x++){const dx=x-11.5,dy=y-13.5,d=Math.hypot(dx,dy);if(d>9.6)continue;
    let c=d>8.4?'#e8761c':d>7.4?'#fff1c9':'#ffc53a';
    if(d<=7.4){const a=(Math.atan2(dy,dx)+Math.PI)/(Math.PI/4);if(Math.abs(a-Math.round(a))<.11*(8/Math.max(d,1)))c='#fff1c9';else if((x+y)%5===0&&d>2)c='#ffde7a'}
    if(d<1.3)c='#fff1c9';if(d>8.4&&dx<-3&&dy<-3)c='#ff9a3c';P(x,y,c)}
  [[13,2],[14,2],[12,3],[13,3],[14,3],[15,3],[13,4],[14,4]].forEach(([x,y])=>P(x,y,'#4fc76a'));P(12,4,'#2f8f4a');P(11,5,'#2f8f4a');
  const name='Sitrom'.split('').map((ch,i)=>`<span class="a" style="animation-delay:${.45+i*.08}s">${ch}</span>`).join('')+'Games'.split('').map((ch,i)=>`<span class="b" style="animation-delay:${.93+i*.08}s">${ch}</span>`).join('');
  $('studioName').innerHTML=name;
  let done=false;const close=()=>{if(done)return;done=true;el.classList.add('out');setTimeout(()=>el.remove(),650);next()};
  el.addEventListener('pointerdown',ev=>{ev.stopPropagation();ensureAudio();close()});
  el.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '||ev.key==='Escape')close()});
  el.focus&&el.focus();
  setTimeout(close,still?1200:2900)}
