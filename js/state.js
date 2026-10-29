// Таксопарк «ДСТ-24» — настройки G, состояние S, сохранения, цели, новая игра
/* ================= ГЛОБАЛЬНЫЕ НАСТРОЙКИ ================= */
const SKEY='dst24-save-v1', GKEY='dst24-global-v1';
let G={pins:[null,null,null],founders:FOUNDERS.map(f=>f.name),music:false,sfx:true,ach:{},rec:{days:0,cars:0,money:0,goals:0}};
try{const g=JSON.parse(localStorage.getItem(GKEY));if(g)G=Object.assign(G,g)}catch(e){}
function saveG(){try{localStorage.setItem(GKEY,JSON.stringify(G))}catch(e){}}

/* ================= СОСТОЯНИЕ ================= */
let S, uiTab='shop', shopTab='all';
const $=id=>document.getElementById(id);
const rub=n=>(n<0?'−':'')+Math.abs(Math.round(n)).toLocaleString('ru-RU')+' ₽';
const km=n=>Math.round(n/1000).toLocaleString('ru-RU')+' тыс. км';
const rand=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const carsN=()=>S.fleet.length, brokenN=()=>S.fleet.filter(c=>c.b).length;
const countM=(...ms)=>S.fleet.filter(c=>ms.includes(c.m)).length;
const activeN=()=>Math.min(S.drivers,carsN()-brokenN());
const leaseSum=()=>S.fleet.reduce((a,c)=>a+(c.lease>0?MODELS[c.m].lease:0),0);
/* ---- кредитный рейтинг (bal 5) ---- */
const cOn=()=>B(5)&&(!simpleOn()||S.day>=TAB_DAY.fin),cSc=()=>cOn()?S.cscore||0:0;
const cGrade=(c=cSc())=>c>=bal('cA')?'A':c>=0?'B':c>bal('cD')?'C':'D';
const maxLoans=()=>B(5)?bal('cLoans')[cGrade()]:2;
function loanOffer(i){const L=loanBase(i);return hq('fin',2)?Object.assign({},L,{rate:+(L.rate-bal('tree',7).fin.loan).toFixed(4)}):L}
function loanBase(i){if(!B(5))return LOANS[i];const g=cGrade(),L=LOANS[i%2],a=bal('cAmt'),r=bal('cRate'),o=bal('cOver');
  if(i===2)return{amount:bal('cThird'),days:L.days,rate:+(L.rate+r.A).toFixed(2)};
  return{amount:Math.round(L.amount*(a[g]||1)/100)*100,days:L.days,rate:+(1+(L.rate-1)*(o[g]||1)+(r[g]||0)).toFixed(4)}}
const loanPay=L=>Math.round(L.amount*L.rate/L.days/10)*10;
const cAdd=n=>{S.cscore=Math.max(-bal('cMax'),Math.min(bal('cMax'),(S.cscore||0)+n))};
const loanSum=()=>S.loans.reduce((a,l)=>a+l.pay,0);
const payroll=()=>Math.round(inf()*(S.heads.reduce((a,h,d)=>a+headDef(d).pay,0)+S.staff.reduce((a,n)=>a+n*STAFF_PAY,0))*(stratOn('grow')?1.1:stratOn('save')?.85:1));
const dateOf=day=>{const d=new Date(START_DATE);d.setDate(d.getDate()+day-1);return d};
const mmdd=d=>String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
function season(d){const m=d.getMonth();
  if(m===11||m<=1)return{n:'Зима',fail:1.35,demand:1.05};
  if(m===10||m===2)return{n:m===10?'Поздняя осень':'Ранняя весна',fail:1.15,demand:1};
  if(m>=5&&m<=7)return{n:'Лето',fail:1,demand:1.1};
  return{n:m<=4?'Весна':'Осень',fail:1,demand:1}}
const newsDef=n=>NEWS.find(x=>x.id===n.id)||n;
// «Пчёлку» не касаются новости о большом агрегаторе
const aggNews=n=>B(4)&&S.agg==='bee'&&bal('beeSkip').includes(n.id);
const newsMod=k=>{const add=k==='leave'||k==='risk1';return S.news.reduce((a,n)=>{const N=aggNews(n)?{}:newsDef(n);return add?a+(N[k]||0):a*(N[k]||1)},add?0:1)};
function save(){try{localStorage.setItem(SKEY,JSON.stringify(S))}catch(e){}if(!save.t||Date.now()-save.t>60000){save.t=Date.now();G.lastSeen=Date.now();saveG()}}
function load(){try{const v=JSON.parse(localStorage.getItem(SKEY));if(v&&v.fleet&&v.heads)return fixState(v)}catch(e){}return null}
function toast(t){const el=$('toast');el.textContent=t;el.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>el.hidden=true,2600)}
function addLog(t){S.log.unshift({d:S.day,t});S.log=S.log.slice(0,80)}

/* ---- модификаторы отделов ---- */
function load01(d){const need=d===0?S.drivers/6:carsN()/6, cap=S.staff[d]+1;return Math.min(.4,Math.max(0,need/cap-1)*.15)}
function rm(d){
  const h=headDef(d);let r=1-.07*S.staff[d]-.1*S.train[d]-.08*h.skill+load01(d);
  if(h.key==='gena')r+=.15; if(h.key==='irina'||h.key==='zarina')r-=.15;
  if(d===0&&S.upg.call)r-=.12;
  if(d===1)r+=newsMod('risk1');
  if(S.moodMod)r+=S.moodMod[d]||0;
  r-=relOf(d)*.01;
  r*=dif().risk;
  return Math.max(.25,Math.min(1.6,r));
}
const repairMult=()=>inf()*(hq('car',3)?1-bal('tree',7).car.svc:1)*(hasHead('master')?.85:1)*(hasHead('petrovich')?.7:1)*(S.upg.tire?.65:1)*newsMod('repair');
const failMult=()=>(cityDef().fail||1)*dif().fail*(hasHead('sanya')?.65:1)*(S.upg.diag?.7:1)*(hq('car',2)?1-bal('tree',7).car.fail:1)*season(dateOf(S.day)).fail*newsMod('fail');
const repairCap=()=>2+2*S.staff[2]+(hasHead('olga')?3:0)+(hasHead('robot')?5:0)+(S.upg.lift?2:0);
const leaseWear=c=>c.lease>0&&B(2)?Math.min(bal('leaseWearMax'),1+bal('leaseWearK')*Math.max(0,LEASE_DAYS-c.lease-bal('leaseWearFrom'))):1;
const leaseRet=c=>bal('leaseRet')*MODELS[c.m].lease;
/* ---- плановое ТО (bal 3) ---- */
const toLeft=c=>{if(c.to==null)c.to=c.km+bal('toKm');return c.to-c.km};
const toOn=()=>B(3)&&(!simpleOn()||S.day>=TAB_DAY.base),toOver=c=>toOn()?Math.max(0,-toLeft(c)):0;
const toPrice=()=>Math.round(bal('toCost')*inf()*(hq('car',3)?1-bal('tree',7).car.svc:1)/100)*100;
const carFail=c=>MODELS[c.m].fail*(1+Math.max(0,c.km-MODELS[c.m].km0)/150000)*leaseWear(c)*(B(3)?Math.min(3,1+toOver(c)/2000):1);
// вред усталости 0…1: до fatFrom% почти не мешает
const fatK=f=>Math.max(0,(f||0)-bal('fatFrom'))/(100-bal('fatFrom'));
const shN=()=>B(3)?(S.shift2||0):(S.night||0);
function service(c){if(!B(3)||!c||c.svc||c.b||S.over||S.preview)return false;const p=toPrice();if(S.money<p)return false;S.money-=p;c.svc=1;return true}
function serviceOverdue(){let n=0;S.fleet.filter(c=>B(3)&&toLeft(c)<0&&!c.b&&!c.svc).sort((a,b)=>toLeft(a)-toLeft(b)).forEach(c=>{if(service(c))n++});
  if(n){addLog(`ТО: на плановое обслуживание отправлено машин: ${n}.`);toast(`На ТО: ${n}`);sfx('coin');save();render()}else{toast('Нет денег или просроченных машин');sfx('bad')}}
const carValue=c=>{const M=MODELS[c.m];if(c.lease>0)return 0;return Math.round(M.resale*Math.max(.25,1-Math.max(0,c.km-M.km0)/300000)/500)*500};
const isBad=fx=>!!fx&&((fx.hold||0)>0||(fx.tdebt||0)>0||(fx.rel||0)<0||(fx.loy||0)<0||(fx.rep||0)<0||(fx.drivers||0)<0||(fx.broken||0)>0||(fx.cars||0)<0||(fx.news&&(NEWS.find(n=>n.id===fx.news)||{}).demand<1));

/* ================= ЦЕЛИ (бесконечный режим) ================= */
const GOALS=[
 {t:'Довести парк до 10 машин',v:()=>carsN(),n:10,rw:{money:20000}},
 {t:'Вывести на линию 10 экипажей',v:activeN,n:10,rw:{money:25000}},
 {t:'Купить первую новую машину',v:()=>S.fleet.filter(c=>MODELS[c.m].lease).length,n:1,rw:{rep:3}},
 {t:'Построить первое улучшение базы',v:()=>UPG_KEYS.filter(k=>S.upg[k]).length,n:1,rw:{money:20000}},
 {t:'Накопить 400 000 ₽ в кассе',v:()=>S.money,n:400000,rw:{rep:3}},
 {t:'Поднять репутацию до 75',v:()=>S.rep,n:75,rw:{money:40000}},
 {t:'Довести парк до 15 машин',v:()=>carsN(),n:15,rw:{money:50000}},
 {t:'Собрать две Камри',v:()=>countM('camry'),n:2,rw:{money:40000,rep:2}},
 {t:'Избавиться от всех Грант',v:()=>countM('granta')===0?1:0,n:1,rw:{rep:5}},
 {t:'Купить машину бизнес-класса',v:()=>S.fleet.filter(c=>MODELS[c.m].cls==='Бизнес').length,n:1,rw:{money:60000}},
 {t:'Открыть тариф «Минивэн»: 2 Carnival',v:()=>countM('carnival'),n:2,rw:{money:50000,rep:2}},
 {t:'Вывести на линию 18 экипажей',v:activeN,n:18,rw:{money:70000}},
 {t:'Довести парк до 25 машин',v:()=>carsN(),n:25,rw:{money:100000}},
];
function goalAt(i){
  if(i<GOALS.length)return GOALS[i];
  const k=i-GOALS.length,L=k>>2;
  switch(k%4){
    case 0:{const n=30+10*L;return{t:`Довести парк до ${n} машин`,v:()=>carsN(),n,rw:{money:120000+30000*L}}}
    case 1:{const n=800000+400000*L;return{t:`Накопить ${rub(n)} в кассе`,v:()=>S.money,n,rw:{rep:4}}}
    case 2:{const n=4+3*L;return{t:`Собрать ${n} Камри`,v:()=>countM('camry'),n,rw:{money:80000+20000*L}}}
    default:{const n=25+8*L;return{t:`Вывести на линию ${n} экипажей`,v:activeN,n,rw:{money:100000+30000*L,rep:2}}}
  }
}
const rwText=rw=>[rw.money?'+'+rub(rw.money):'',rw.rep?'+'+rw.rep+' к репутации':''].filter(Boolean).join(', ');
function checkGoals(){
  if(S.mode!=='endless'||S.over||S.preview)return;
  let g=goalAt(S.goal);
  while(g.v()>=g.n){
    S.money+=g.rw.money||0;S.rep=Math.min(100,S.rep+(g.rw.rep||0));
    addLog(`Цель ${S.goal+1} выполнена: ${g.t}. Награда: ${rwText(g.rw)}.`);
    toast(`Цель ${S.goal+1} выполнена! ${rwText(g.rw)}`);sfx('win');
    S.goal++;g=goalAt(S.goal);save();
  }
}
function checkAch(){
  if(S.preview)return;
  ACH.forEach(([id,name,,test])=>{if(!S.ach[id]&&test(S)){S.ach[id]=S.day;G.ach[id]=true;saveG();addLog(`Достижение: «${name}»`);toast(`★ Достижение: ${name}`);sfx('win')}});
}

/* ================= ХОЛДИНГ ================= */
/* ---- очки, дерево, франшизы, медали (G.hold; контракт — .omc/plans/holding.md) ---- */
const HOLD_BR=['fin','ppl','car'],HOLD_MED=['','бронза','серебро','золото'];
// цены ступеней — из BAL[7] без правки из админки; мусор → [1,2,3,4]
const holdCost=()=>{const c=BAL[7]&&BAL[7].tree&&BAL[7].tree.cost;return Array.isArray(c)&&c.length===4&&c.every(x=>x>0&&isFinite(x))?c:[1,2,3,4]};
const holdSpent=t=>HOLD_BR.reduce((a,b)=>a+holdCost().slice(0,Math.max(0,Math.min(4,t[b]|0))).reduce((x,y)=>x+y,0),0);
// чистая нормализация: любой мусор → корректный холдинг; потраченное не больше earned
function holdNorm(h){h=h&&typeof h==='object'?h:{};const n=x=>Math.max(0,Math.floor(+x)||0),t=h.tree&&typeof h.tree==='object'?h.tree:{},md=h.medals&&typeof h.medals==='object'?h.medals:{};
  const o={v:1,earned:n(h.earned),base:0,tree:{},treeAt:n(h.treeAt!=null?h.treeAt:h.at),resetAt:n(h.resetAt),fr:[],medals:{},at:n(h.at)},seen=new Set();
  HOLD_BR.forEach(k=>o.tree[k]=Math.min(4,n(t[k])));
  (Array.isArray(h.fr)?h.fr:[]).forEach(f=>{if(!f||typeof f.id!=='string'||!f.id||f.id.length>40||seen.has(f.id)||o.fr.length>=500)return;seen.add(f.id);o.fr.push({id:f.id,city:CITIES[f.city]?f.city:'home',val:n(f.val),day:n(f.day),at:n(f.at),pts:Math.min(1000,n(f.pts)),gid:typeof f.gid==='string'?f.gid.slice(0,40):''})});
  Object.keys(CITIES).forEach(k=>{const m=Math.min(3,n(md[k]));if(m)o.medals[k]=m});
  // base — очки из переноса престижа; без него (старый формат) = earned − очки франшиз − золото
  o.base=h.base!=null?n(h.base):Math.max(0,o.earned-o.fr.reduce((a,f)=>a+f.pts,0)-Object.values(o.medals).filter(m=>m>=3).length*bal('goldPts',7));
  while(holdSpent(o.tree)>o.earned){const k=HOLD_BR.reduce((a,b)=>o.tree[b]>o.tree[a]?b:a);o.tree[k]--}
  return o}
// G.hold с защитой от отсутствия; один раз переводит старый престиж в очки и старые франшизы в записи без оценки
function holdG(){G.hold=Object.assign(G.hold&&typeof G.hold==='object'?G.hold:{},holdNorm(G.hold));const h=G.hold;
  if(!G.holdMig){G.holdMig=1;const pr=Math.max(0,G.prestige|0);h.earned+=pr;h.base+=pr;for(let i=0;i<Math.min(500,Math.max(0,G.franchises|0));i++)h.fr.push({id:'old'+i,city:'home',val:0,day:0,at:0});saveG()}
  return h}
const holdFree=()=>{const h=holdG();return h.earned-holdSpent(h.tree)};
const holdSnap=()=>{const t=holdG().tree;return{fin:t.fin,ppl:t.ppl,car:t.car}};
function holdBuy(b){if(!HOLD_BR.includes(b))return false;const h=holdG(),l=h.tree[b];if(l>=4)return false;
  if(holdFree()<holdCost()[l]){toast('Не хватает очков холдинга');return false}
  h.tree[b]++;h.at=h.treeAt=Date.now();saveG();toast('Ступень куплена');return true}
// сброс бесплатный раз в сутки по Москве; идущая партия не меняется (бонусы сняты в S.hold при её старте), поэтому можно в любой момент
const mskDay=t=>Math.floor((t+3*36e5)/864e5);
function holdReset(){const h=holdG();if(!HOLD_BR.some(b=>h.tree[b]))return false;
  if(h.resetAt&&mskDay(h.resetAt)===mskDay(Date.now())){toast('Сбросить дерево можно раз в сутки (по Москве)');return false}
  HOLD_BR.forEach(b=>h.tree[b]=0);h.resetAt=h.at=h.treeAt=Date.now();saveG();toast('Дерево сброшено, очки вернулись');return true}
// слияние облака: earned — максимум; франшизы по id; медали — максимум; дерево — с более нового устройства (at), потраченное ≤ earned
function holdMerge(local,remote){const a=holdNorm(local),b=holdNorm(remote),fr=new Map(),md={};
  const gids=new Set();[...a.fr,...b.fr].forEach(f=>{if(fr.has(f.id)||(f.gid&&gids.has(f.gid)))return;if(f.gid)gids.add(f.gid);fr.set(f.id,f)});
  Object.keys(CITIES).forEach(k=>{const m=Math.max(a.medals[k]||0,b.medals[k]||0);if(m)md[k]=m});
  const base=Math.max(a.base,b.base),fp=[...fr.values()].reduce((s,f)=>s+f.pts,0),gp=Object.values(md).filter(m=>m>=3).length*bal('goldPts',7);
  return holdNorm({v:1,earned:base+fp+gp,base,tree:(b.treeAt>a.treeAt?b:a).tree,treeAt:Math.max(a.treeAt,b.treeAt),resetAt:Math.max(a.resetAt,b.resetAt),fr:[...fr.values()],medals:md,at:Math.max(a.at,b.at)})}
const holdId=()=>{try{return Array.from(crypto.getRandomValues(new Uint8Array(8)),x=>x.toString(36).padStart(2,'0')).join('')}catch(e){return'f'+Date.now().toString(36)}};
// отчисления: royK оценки каждой франшизы, всего не больше royCap (оба ×1,5 с «Финансы IV»)
function holdRoyalty(){const s=holdG().fr.reduce((a,f)=>a+f.val*bal('royK',7),0);if(s<=0)return 0;
  const m=hq('fin',4)?bal('royFin4',7):1,v=Math.round(Math.min(s,bal('royCap',7))*m/100)*100;S.money+=v;return v}
const holdFrN=(extra=0)=>holdG().fr.length+extra,holdGolds=()=>Object.values(holdG().medals).filter(m=>m>=3).length;
const holdCityOpen=(k,extra=0)=>{const C=CITIES[k];return!!C&&(C.need||0)<=holdFrN(extra)&&(C.gold||0)<=holdGolds()};
function holdMedal(city,lvl){const h=holdG();if(!CITIES[city]||!(lvl>(h.medals[city]||0))||lvl>3)return false;
  h.medals[city]=lvl;h.at=Date.now();const C=CITIES[city];let t=`Медаль «${HOLD_MED[lvl]}»: ${C.n}.`;
  if(lvl===3){const p=bal('goldPts',7),id='gold_'+city;h.earned+=p;G.ach[id]=true;if(S&&S.ach)S.ach[id]=S.day;t+=` +${p} очк. холдинга и раскраска «${LIVERY['gl_'+city]}».`}
  saveG();addLog(t);toast(t);sfx('win');return true}
// испытание города: только бесконечный bal 7 в этом городе; высшая достигнутая медаль
function holdTrials(){if(!S||S.mode!=='endless'||!B(7)||S.preview||S.over)return;const c=S.city||'home',T=TRIAL[c],th=bal('trials',7)[c];if(!T||!th)return;
  const v=T.v();for(let l=3;l>0;l--)if(v>=th[l-1]){holdMedal(c,l);break}}
// счётчики испытаний в конце дня: лето (июнь–август), прибавка от ночных смен, дни без забастовки при 20+ машинах
function holdDay(rev,nk){const c=S.cnt,m=dateOf(S.day).getMonth();if(m>=5&&m<=7){if(m===5&&dateOf(S.day).getDate()===1)c.sum=0;c.sum=(c.sum||0)+rev}if(nk>1)c.night=(c.night||0)+Math.round(rev*(1-1/nk));
  c.calm=strikeOn()||carsN()<20?0:(c.calm||0)+1;holdTrials()}

/* ================= НОВАЯ ИГРА ================= */
const START_FLEET=[['granta',190000],['granta',205000],['granta',170000],['granta',230000],['solaris',110000],['solaris',125000],['solaris',98000],['solaris',140000]];
function blankState(mode){
  return {mode,bal:BAL_NEW,startMoney:0,stars:0,goal:0,day:1,money:300000,rep:60,drivers:7,fleet:[],seq:0,decks:[[],[],[]],today:[0,0,0],done:[null,null,null],log:[],over:false,hired:false,
    rents:Object.assign({},MARKET),heads:[0,1,2].map(d=>({key:HEADS[d][0].key,name:HEADS[d][0].name})),staff:[1,1,1],train:[0,0,0],upg:{},spots:12,lotsPaid:[],loans:[],news:[],
    rivals:[{name:'Жёлтый ветер',style:'war',cars:10,rep:55},{name:'Шмель',style:'poach',cars:7,rep:60},{name:'Премиум Драйв',style:'prem',cars:5,rep:70}],
    nextRival:rand(6,9),nextInspect:rand(3,6),quest:null,nextQuest:3,queue:[],hist:[[],[],[]],cnt:{},ach:{},morning:[],
    diff:'normal',dlist:[],dseq:0,fuel:1,raid:null,nextRaid:rand(10,16),nextTax:rand(35,50),branches:[],strategy:null,nextMeeting:bal('meet',BAL_NEW),rank:0,lastMonth:-99,chapter:0,
    alloc:{center:30,sleep:40,air:15,rail:15},dmods:{center:1,sleep:1,air:1,rail:1},townAlloc:{},dnews:[],night:0,shift2:0,fat:0,weather:[],investors:[],union:false,unionDays:0,nextUnion:0,
    nextAuction:7,nextContract:rand(9,13),nextAgency:rand(10,15),contracts:[],lines:{},ads:null,school:[],agency:[],stat:[],wk:{rev:0,net:0,breaks:0,fines:0,fails:[]},
    custom:Object.assign({name:'ДСТ-24',color:'yellow',logo:'checker',avatar:0,livery:'none'},G.custom||{}),
    parts:10,crisis:null,nextCrisis:rand(25,40),extraHeads:[[],[],[]],moodMod:[0,0,0],nextCareer:rand(18,24),nextConflict:rand(14,20),lastParty:-99,strike:null,owned:{},dispDay:0,
    agg:'mig',aggAt:-99,aggNext:0,aggLast:0,lowDays:0,cscore:0,cstreak:0,war:null,ctLost:null,infl:1,mInfl:1,taxAcc:0,kpi:null,kpiStreak:0,kpiFails:0,tdebt:0,rel:{},relCd:{},city:'home',hold:null,gid:'',balPatch:null,balRev:0,netSeen:{},netRev:[],seed:0};
}
function fixState(v){const b=blankState(v.mode||'campaign');const o=Object.assign(b,v);o.bal=v.bal||1;if(!AGG[o.agg])o.agg='mig';
  if(!v.rivals){o.rivals=b.rivals;if(v.rival){o.rivals[0].name=v.rival.name;o.rivals[0].cars=v.rival.cars}}
  if(!v.rents)o.rents=Object.assign({},MARKET);delete o.rival;if(!o.weather||o.weather.length<3)o.weather=[0,1,2].map(i=>genWeather(o.day+i));return o}
function newDriver(){const t=Math.random()<.3?'rookie':TRAIT_KEYS[rand(0,TRAIT_KEYS.length-1)];
  return{id:++S.dseq,n:DNAMES[rand(0,DNAMES.length-1)]+' '+'АБВГДЕЖЗИКЛМНОПРСТУФХ'[rand(0,19)]+'.',r:+(4.55+Math.random()*.38).toFixed(2),xp:t==='rookie'?rand(1,3):rand(3,20),t,loy:rand(50,80)}}
function syncDrivers(){if(!S.dlist)S.dlist=[];while(S.dlist.length<S.drivers)S.dlist.push(newDriver());
  if(S.dlist.length>S.drivers){S.dlist.sort((a,b)=>a.loy-b.loy);S.dlist.splice(0,S.dlist.length-S.drivers)}}
function newGame(mode,heads,opts={}){
  if(S&&!S.over&&!S.preview&&S.day>1)recordResult('прервана');
  if(mode==='contest')ctUse(opts.seed,1);else ctSync(null);
  S=blankState(mode);S.hold=mode==='endless'&&B(7)?opts.hold||holdSnap():null;S.gid=Date.now().toString(36)+(()=>{try{return crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}catch(e){return''}})();if(!netOff){S.balRev=netRevNow();S.balPatch=netSnap()}hvToday=false;S.heads=heads;S.diff=opts.diff||'normal';S.chapter=opts.chapter||0;
  START_FLEET.forEach(([m,k])=>addCar(m,k));
  S.city=opts.city||'home';
  S.money=Math.round(S.money*(B(2)&&mode==='campaign'&&S.diff!=='easy'?bal('start')[S.diff]:dif().money)*(mode==='endless'?B(7)?1+(hq('fin',1)?bal('tree',7).fin.cap:0):prestCap(prestige()):1)*(cityDef().price||1)/1000)*1000;
  if(mode==='endless'&&(B(7)?hq('ppl',2):prestige()>=5))S.staff=S.staff.map(x=>x+bal('tree',7).ppl.staff);
  if(mode==='endless'&&(B(7)?hq('ppl',4):prestige()>=10))S.rank=1;
  if(hq('car',4)){addCar(bal('tree',7).car.gift,0);S.fleet[S.fleet.length-1].lease=0}
  const roy=mode==='endless'&&B(7)?holdRoyalty():0;
  if(mode==='story')CHAPTERS[S.chapter].setup(S);
  if(mode==='daily'){S.dailyKey=todayKey();S.dailyIdx=dailyIdx();DAILY_SC[S.dailyIdx].setup(S)}
  if(mode==='contest'){S.seed=opts.seed;S.dailyKey='c'+opts.cid;S.dailyIdx=opts.sc;DAILY_SC[S.dailyIdx].setup(S)}
  if(mode==='sandbox'){S.money=99999999;S.rank=3}
  S.startMoney=S.money;
  if(mode==='campaign')S.nextCrisis=S.diff==='easy'?1e9:rand(...bal('crisisFirst'));else if(mode==='endless')S.nextCrisis=rand(...bal('endCrisisFirst'));
  S.weather=[0,1,2].map(i=>genWeather(1+i));rollDistricts();
  syncDrivers();if(hq('ppl',1))S.dlist.forEach(d=>d.loy=Math.min(100,d.loy+bal('tree',7).ppl.loy));
  addLog(dailyLike()?`${mode==='contest'?'Соревнование недели':'Испытание дня'} «${DAILY_SC[S.dailyIdx].n}»: ${DAILY_SC[S.dailyIdx].d} 7 дней, наберите как можно больше очков.`:mode==='sandbox'?'Песочница: денег без счёта, стройте парк мечты.':mode==='story'?`${CHAPTERS[S.chapter].n}. ${CHAPTERS[S.chapter].d}`:`Вы приняли таксопарк «ДСТ-24»: 8 подержанных машин и 7 водителей.`+(mode==='endless'?' Режим без конца: растите сколько хотите.':''));
  if(roy)addLog(`Франшизы перечислили ${rub(roy)}.`);
  S.today=[0,1,2].map(nextEvent);
  if(G.loginPending&&mode!=='sandbox'){const lp=G.loginPending;
    if(lp.streak){const w=loginPay(lp.streak);addLog(`Награда за вход: ${rub(w.m)}${w.w?`, +${bal('loginParts')} запчасти, лояльность +${bal('loginLoy')}`:''}.`)}
    else{S.money+=lp;addLog(`Награда за вход: ${rub(lp)}.`)}
    G.loginPending=0;saveG()}
  if(G.netGift&&mode!=='sandbox'&&!dailyLike()){const g=Math.min(1e5,+G.netGift||0);S.money+=g;addLog(`Подарок от диспетчерской: ${rub(g)}.`);G.netGift=Math.max(0,(+G.netGift||0)-g);saveG()}
  save();render();
  if(mode==='story')showModal(`<span class="step">СЮЖЕТ</span><h2>${CHAPTERS[S.chapter].n}</h2><p>${CHAPTERS[S.chapter].d}</p><p><b>Цель:</b> ${CHAPTERS[S.chapter].goalTxt}.</p><button class="btn" id="chGo">Начать</button>`),$('chGo').onclick=()=>{hideModal();if(!G.tutDone)tutorial()};
  else if(dailyLike()){showModal(`<span class="step">${mode==='contest'?'СОРЕВНОВАНИЕ НЕДЕЛИ':'ИСПЫТАНИЕ ДНЯ'} · ${mode==='contest'?esc(S.dailyKey):todayKey()}</span><h2>${DAILY_SC[S.dailyIdx].n}</h2><p>${DAILY_SC[S.dailyIdx].d}</p><p>7 дней. Очки = касса + 50 000 ₽ за каждую машину + 2 000 ₽ за каждое очко репутации. Сегодня у всех игроков одинаковое испытание — сравните результат с друзьями.</p>${mode==='daily'&&G.daily&&G.daily.key===todayKey()?`<p class="note">Ваш лучший результат сегодня: ${G.daily.best.toLocaleString('ru-RU')} очков.</p>`:''}<button class="btn" id="dyGo">Поехали</button>`);$('dyGo').onclick=hideModal}
  else if(!G.tutDone)coachStart();
}
function recordResult(st){if(!S||S.preview||S.mode==='sandbox')return;
  const r={date:new Date().toLocaleDateString('ru-RU'),mode:S.mode,diff:S.diff||'normal',days:Math.max(0,S.day-1),cars:totalCars(),money:Math.round(S.money),rank:S.rank||0,st,bal:S.bal||1};if(S.stars)r.stars=S.stars;
  G.board=(G.board||[]).concat([r]).sort((a,b)=>(b.cars*20000+b.money)-(a.cars*20000+a.money)).slice(0,10);saveG();netSubmit(r,dailyLike()?dailyScore():r.cars*20000+r.money)}
function addCar(m,kmv){const M=MODELS[m],c={m,b:0,id:++S.seq,km:kmv!=null?kmv:(M.km0?M.km0+rand(-15000,15000):rand(0,40)),lease:M.lease?LEASE_DAYS:0};if(B(3))c.to=c.km+bal('toKm');S.fleet.push(c)}
function removeCar(){for(const k of MODEL_KEYS){const i=S.fleet.findIndex(c=>c.m===k&&!(c.lease>0));if(i>-1){S.fleet.splice(i,1);return}}if(S.fleet.length)S.fleet.shift()}
function breakCars(n){shuffle(S.fleet.filter(c=>!c.b&&!c.svc)).slice(0,n).forEach(c=>c.b=1)}
