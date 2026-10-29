// Таксопарк «ДСТ-24» — бот-измеритель баланса (?sim)
/* ---- замер баланса ---- */
/* Только с ?sim в адресе: бот проходит партии без интерфейса и печатает таблицу. Ничего не пишет в localStorage. */
if(/[?&]sim\b/.test(location.search))(()=>{
const SIM_V='bot-5';
const mulberry=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const pct=(a,p)=>a.length?[...a].sort((x,y)=>x-y)[Math.min(a.length-1,Math.floor(p*a.length))]:null;
const SIM_STUBS=['save','saveG','toast','sfx','voice','triggerScene','coachStart','tutorial','drawFaces','pddExam'];
const SIM_PRI=['chGo','iHonest','rdNone','txSelf','unRent','ctNo','agNo','crNo','cfA','bmBurn','qtGo','a2Ok','ppOk','qOk','ecOk','lotDone','st_grow','iOk','next'];
let simOpen=false,simTax=false;
/* кнопка по умолчанию в открытом окне: по списку, иначе первая бесплатная, иначе первая */
function simPump(){const card=$('modalCard');
  for(const id of SIM_PRI){const b=card.querySelector('#'+id);if(b&&!b.disabled){b.click();return true}}
  const bs=[...card.querySelectorAll('button')].filter(b=>!b.disabled),b=bs.find(x=>!/₽/.test(x.textContent))||bs[0];
  if(!b)return false;b.click();return true}
function simMorning(r){let n=0;
  for(;(S.morning.length||simOpen)&&n<80;n++){if(simOpen){if(!simPump())simOpen=false}else runMorning()}
  if(S.morning.length||simOpen){r.stuck++;S.morning=[];simOpen=false}}
/* bot-2: покупка по окупаемости; в сюжете цель главы (ч2 — обогнать конкурентов, ч4 — 35 машин и филиал) важнее окупаемости */
function simBuy(){
  if(S.debt>=2&&S.loans.length<maxLoans()&&(!simpleOn()||tabOpen('fin')))takeLoan(0);
  const C=S.mode==='story'?S.chapter||0:-1,hz=S.mode==='endless'?45:dayLimit()-S.day,n=totalCars();
  const mg=k=>k<=15?0:Math.round(Math.pow(k-15,1.3)*70*inf()/100)*100;
  // кампании нужны ровно 15 машин — докупаем до цели, не глядя на окупаемость
  let need=S.mode==='campaign'?GOAL_CARS:0;if(C===1)need=Math.max(...S.rivals.map(r=>r.cars))+2;if(C===3)need=35;
  if(C===3&&!S.branches.length&&S.rank>=3&&S.money>=branchSite(0).price+60000)openBranch();
  const cap=S.mode==='campaign'?GOAL_CARS:need||1e9,force=n<need;
  // в бесконечном режиме сверяемся с реальным чистым доходом последних 7 дней на машину
  const st7=S.stat.slice(-7),avg=st7.length?st7.reduce((a,x)=>a+x.net,0)/st7.length:0;
  if(carsN()<cap&&n<cap&&(force||hz>=(C===0||C===2?10:1))){const ok=m=>(MODELS[m].rank||0)<=S.rank,by=f=>MODEL_KEYS.filter(m=>ok(m)&&f(MODELS[m]));
    const eco=by(M=>M.cls==='Эконом'&&!M.lease).sort((a,b)=>carRevM(b)/priceOf(b)-carRevM(a)/priceOf(a))[0];
    const ls=by(M=>M.lease>0).sort((a,b)=>priceOf(a)-priceOf(b))[0];
    const lot=carsN()>=S.spots?lotPrice():0;
    // окупится ли ещё одна машина до горизонта
    const pays=m=>{if(S.mode==='endless'&&!force&&!(avg>0&&avg/Math.max(1,n)*hz>priceOf(m)+lot))return false;const M=MODELS[m],lz=M.lease>0,net=carRevM(m)*(.5+S.rep/100)-PARKING*inf()*(S.lotOwned?.4:1)-(mg(n+1)-mg(n));
      return force||hz*net-(lz?M.lease*Math.min(hz,LEASE_DAYS):0)>priceOf(m)+lot};
    const m=[eco,ls].find(m=>m&&S.money>=priceOf(m)+lot+60000&&pays(m));
    if(m){if(lot)buyLot();if(carsN()<S.spots)buy(m)}}
  if(!S.hired&&carsN()-brokenN()>S.drivers&&S.money>=HIRE_COST+20000)hire()}
/* bot-3: вторая смена и ТО; strat: 'none' — смена 0 и без ТО, 'max' — смена на максимуме, ТО как у основного */
function simShift(strat){if(!B(3))return;
  S.shift2=strat==='none'?0:strat==='max'?bal('shiftMax'):S.fat<50?30:0;
  if(strat!=='none'){if(!S.upg.mech&&carsN()>=10&&S.money>=upgPrice('mech')+80000)buyUpg('mech');
    S.fleet.filter(c=>!c.b&&!c.svc&&toLeft(c)<500).sort((a,b)=>toLeft(a)-toLeft(b)).forEach(c=>{if(S.money>toPrice()+30000)service(c)})}}
function simDesks(){
  for(let d=0;d<3;d++){if(S.done[d])continue;const g=getEv(d,S.today[d]).c.findIndex(c=>c.game);if(g>-1)choose(d,g,Math.random()<.6)}
  if(!simpleOn()||S.day>=10)autoResolve();
  for(let d=0;d<3;d++)if(!S.done[d])choose(d,0)}
/* одна партия; stopDay — остановиться после конца этого дня (для free) */
function simRun(cfg,seed,stopDay){
  Math.random=mulberry(seed);let clock=Date.UTC(2026,10,1,12);Date.now=()=>clock;
  const r={seed,fat:0,fails:0,win:false,why:'',money:0,goalDay:null,heavy:0,stuck:0,tax:0,crises:0};let crisis0=null;
  S=null;G.tutDone=1;G.a2hs=1;G.loginPending=0;G.simple=cfg.simple;simOpen=false;G.hold=null;G.holdMig=1;
  newGame(cfg.mode,[0,1,2].map(d=>({key:HEADS[d][0].key,name:HEADS[d][0].name})),{diff:cfg.diff,chapter:cfg.chapter||0,city:cfg.city,hold:cfg.hold});
  if(simOpen)simPump();
  if(B(4))S.agg=cfg.agg||'mig';
  const C=S.mode==='story'?CHAPTERS[S.chapter]:null,cap=S.mode==='endless'?(cfg.days||120):dayLimit()+10;
  for(let i=0;i<cap;i++){
    simTax=false;simMorning(r);
    r.heavy=Math.max(r.heavy,(S.crisis?1:0)+(S.raid?1:0)+(S.strike||S.news.some(n=>n.id==='strike')?1:0)+(simTax?1:0)+(B(2)&&taxOn()&&isTaxDay(S.day)&&S.taxAcc>0?1:0));
    if(simTax)r.tax++;if(S.crisis&&S.crisis!==crisis0)r.crises++;crisis0=S.crisis;
    simBuy();simShift(cfg.strat);simDesks();
    const day=S.day;endDay();r.fails=S.cnt.brk||0;r.fat=S.fat||0;clock+=864e5;
    if(r.goalDay===null&&(C?C.goal(S):goalMet()))r.goalDay=day;
    const lose=S.mode!=='sandbox'&&((S.money<0&&S.debt>=5)||S.rep<=0||S.drivers===0),fin=hasLimit()&&day>=dayLimit();
    if(lose||fin||day===stopDay||(S.mode==='endless'&&i===cap-1)){r.money=Math.round(S.money);r.cars=carsN();r.rep=S.rep;r.profit=Math.round(profit());r.poach=S.cnt.poach||0;r.tr=TRIAL[S.city]?TRIAL[S.city].v():0;r.wars=S.cnt.wars||0;r.cs=S.cscore||0;
      if(lose)r.why=S.money<0?'банкротство':S.rep<=0?'репутация':'водители';
      else if(fin){r.win=C?!!C.goal(S):goalMet()&&carsN()>=GOAL_CARS&&S.rep>=50;if(!r.win)r.why='не взята цель'}
      else r.why='стоп';r.cars=carsN();r.rep=S.rep;
      return r}
    $('next').click();
  }
  r.money=Math.round(S.money);r.why='завис';return r}
function simBatch(cfg){
  const rs=[],errors=[],why={};let stuck=0;
  for(let s=1;s<=cfg.seeds;s++){try{const r=simRun(cfg,s);rs.push(r);stuck+=r.stuck;if(!r.win)why[r.why]=(why[r.why]||0)+1}catch(e){errors.push({seed:s,msg:String(e&&e.stack||e).split('\n').slice(0,2).join(' | ')})}}
  const cash=rs.map(r=>r.money),gd=rs.filter(r=>r.goalDay!==null).map(r=>r.goalDay);
  return{SIM_V,diff:cfg.diff,mode:cfg.mode,chapter:cfg.mode==='story'?cfg.chapter:undefined,runs:cfg.seeds,played:rs.length,
    winPct:+(100*rs.filter(r=>r.win).length/cfg.seeds).toFixed(1),
    lose:{банкротство:why['банкротство']||0,репутация:why['репутация']||0,водители:why['водители']||0,'не взята цель':why['не взята цель']||0,завис:(why['завис']||0)},
    cashP10:pct(cash,.1),cashP50:pct(cash,.5),cashP90:pct(cash,.9),carsP50:pct(rs.map(r=>r.cars||0),.5),repP50:pct(rs.map(r=>r.rep||0),.5),taxP50:pct(rs.map(r=>r.tax),.5),crisesP50:pct(rs.map(r=>r.crises),.5),goalMedian:pct(gd,.5),goalP30:pct(gd,.3),
    profitP50:pct(rs.map(r=>r.profit||0),.5),poachP50:pct(rs.map(r=>r.poach||0),.5),warsP50:pct(rs.map(r=>r.wars||0),.5),trialP50:pct(rs.map(r=>r.tr||0),.5),trialP90:pct(rs.map(r=>r.tr||0),.9),cscoreP50:pct(rs.map(r=>r.cs||0),.5),gradeP50:cGrade(pct(rs.map(r=>r.cs||0),.5)),fatP50:pct(rs.map(r=>r.fat),.5),failsP50:pct(rs.map(r=>r.fails),.5),goalBy25Pct:+(100*gd.filter(d=>d<25).length/cfg.seeds).toFixed(1),heavyMax:rs.reduce((a,r)=>Math.max(a,r.heavy),0),profits:rs.map(r=>[r.seed,r.profit||0]),stuck,errors}}
const simFlat=r=>Object.assign({},r,{lose:Object.entries(r.lose).map(([k,v])=>k+':'+v).join(' '),errors:r.errors.length});
/* подмена всего на время прогона и возврат в finally */
function simGuard(fn){
  ctSync(null);
  const ls=JSON.stringify(localStorage),S0=S===undefined?undefined:JSON.stringify(S),G0=JSON.stringify(G),card=[...$('modalCard').childNodes];
  const mod={uiTab,shopTab,mgTimer,mgRaf,mgKey,paused,scn,parts,movers,shownMoney,freshDesks};
  const orig={},fns=[...SIM_STUBS,'showModal','hideModal','render','taxAudit'],rnd=Math.random,now=Date.now,mg=[...MINIGAMES],lg=Object.assign({},LINE_GAMES);
  fns.forEach(n=>orig[n]=window[n]);netOff=true;
  try{
    SIM_STUBS.forEach(n=>window[n]=()=>{});
    window.showModal=h=>{$('modalCard').innerHTML=h;simOpen=true};window.hideModal=()=>{simOpen=false};
    window.render=()=>{if(!S)return;if(!S.weather||S.weather.length<3)S.weather=[0,1,2].map(i=>genWeather(S.day+i));if(!S.dmods)rollDistricts();syncDrivers();checkGoals();checkRank();checkAch()};
    window.taxAudit=function(){simTax=true;return orig.taxAudit.apply(this,arguments)};
    for(let i=0;i<3;i++)MINIGAMES[i]=(fi,cb)=>{let ok=0;for(let k=0;k<3;k++)if(Math.random()<.6)ok++;cb(ok*10-12,'бот-замер')};
    Object.keys(LINE_GAMES).forEach(k=>LINE_GAMES[k]=cb=>cb(Math.random()<.6));
    return fn();
  }finally{
    fns.forEach(n=>window[n]=orig[n]);MINIGAMES.splice(0,3,...mg);Object.assign(LINE_GAMES,lg);
    Math.random=rnd;Date.now=now;netOff=false;
    S=S0===undefined?undefined:JSON.parse(S0);G=JSON.parse(G0);ctSync(S);
    ({uiTab,shopTab,mgTimer,mgRaf,mgKey,paused,scn,parts,movers,shownMoney,freshDesks}=mod);
    try{if(JSON.stringify(localStorage)!==ls){const o=JSON.parse(ls);localStorage.clear();for(const k in o)localStorage.setItem(k,o[k])}}catch(e){}
    $('modalCard').replaceChildren(...card);simOpen=false;
    if(S)render();
  }}
window.__balanceSim=(o={})=>simGuard(()=>{const {diff='normal',mode='campaign',seeds=100,simple=false}=o;
  if(!['campaign','story','endless'].includes(mode))throw new Error('замер: только campaign, story или endless');
  const r=simBatch({diff,mode,seeds,simple,strat:o.strat,agg:o.agg,chapter:o.chapter||0,days:o.days,city:o.city,hold:o.hold});console.table([simFlat(r)]);return r});
window.__balanceSim.all=(n=100)=>simGuard(()=>{const rs=['easy','normal','hard'].map(diff=>simBatch({diff,mode:'campaign',seeds:n,simple:false,chapter:0}));console.table(rs.map(simFlat));return rs});
window.__balanceSim.story=(n=100)=>simGuard(()=>{const rs=CHAPTERS.map((C,i)=>simBatch({diff:'normal',mode:'story',seeds:n,simple:false,chapter:i}));console.table(rs.map(simFlat));return rs});
window.__balanceSim.free=(hours=24,streak=1)=>simGuard(()=>{
  const r=simRun({diff:'normal',mode:'campaign',simple:false},1,8);Date.now=()=>0;G.lastSeen=-hours*36e5;
  const last=S.stat.slice(-7),avgNet=last.length?Math.round(last.reduce((a,x)=>a+x.net,0)/last.length):0,m0=S.money;
  const off=offlineIncome(),out={SIM_V,hours,streak,avgNet,offline:off||0,offlineShare:avgNet>0?+((off||0)/avgNet).toFixed(2):0,login:bal('loginDay')*Math.min(streak,7)+(streak%7===0?bal('loginBonus'):0),loginParts:streak%7===0?bal('loginParts'):0,loginLoy:streak%7===0?bal('loginLoy'):0,moneyBefore:Math.round(m0)};
  console.table([out]);return out});
})();
