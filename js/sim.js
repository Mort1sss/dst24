// Таксопарк «ДСТ-24» — бот-измеритель баланса (?sim)
/* ---- замер баланса ---- */
/* Только с ?sim в адресе: бот проходит партии без интерфейса и печатает таблицу. Ничего не пишет в localStorage. */
if(/[?&]sim\b/.test(location.search))(()=>{
const SIM_V='bot-13';
const mulberry=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const pct=(a,p)=>a.length?[...a].sort((x,y)=>x-y)[Math.min(a.length-1,Math.floor(p*a.length))]:null;
const SIM_STUBS=['save','saveG','toast','sfx','voice','triggerScene','coachStart','tutorial','drawFaces','pddExam'];
const SIM_PRI=['chGo','dpSkip','lzBuyAll','lzBackAll','cwGo','cwOk','vc0','iHonest','rdNone','txSelf','tdSelf','tdOk','unRent','ctNo','agNo','crNo','cfA','bmBurn','qtGo','a2Ok','ppOk','qOk','ecOk','lotDone','st_grow','iOk','next'];
let simOpen=false,simTax=false;
/* продажа с указанием причины: sellCar один на все правила, и без метки «почему парк молодой» не разобраться */
function simSell(c,why){if(!c)return;S.cnt=S.cnt||{};const b=S.cnt.soldBy=S.cnt.soldBy||{};b[why]=(b[why]||0)+1;sellCar(c.id)}
/* кнопка по умолчанию в открытом окне: по списку, иначе первая бесплатная, иначе первая */
function simPump(){const card=$('modalCard');
  for(const id of SIM_PRI){const b=card.querySelector('#'+id);if(b&&!b.disabled){b.click();return true}}
  const bs=[...card.querySelectorAll('button')].filter(b=>!b.disabled),b=bs.find(x=>!/₽/.test(x.textContent))||bs[0];
  if(!b)return false;b.click();return true}
function simMorning(r){let n=0;
  for(;(S.morning.length||simOpen)&&n<80;n++){if(simOpen){if(!simPump())simOpen=false}else runMorning()}
  if(S.morning.length||simOpen){r.stuck++;S.morning=[];simOpen=false}}
/* bot-2: покупка по окупаемости; в сюжете цель главы (ч2 — обогнать конкурентов, ч4 — 35 машин и филиал) важнее окупаемости */
function simBuy(cfg){cfg=cfg||{};
  // bot-13: cfg.target — заданный размер сети: замер «сколько приносит парк в 8 / 60 / 120 / 250 / 450 / 600 / 1000 машин».
  // Пока цель задана, все ростовые правила (замена, излишек, погоня за целью) выключены: иначе бот купает парк туда-сюда
  // и вместо экономики показывает перекупку, а цель должна держаться весь забег
  const T=cfg.target||0;
  // bot-11: резерв на 30 дней операционных расходов — разумный владелец не выгребает кассу под ноль
  const reserve=()=>endl()?Math.round(((payroll()+parkCost()+mgmtCost()+3000)*12)/100)*100:60000;
  // bot-12: цель бесконечного режима — то, что игрок читает в шапке и под что он подводит парк. Без этого бот стоит
  // на «избавьтесь от Грант» все 400 дней и цепочка целей в замерах невидима
  const g12=endl()?goalAt(S.goal):null,ban=g12&&g12.sell?g12.sell:null;
  // «избавиться от модели» нельзя играть встречкой: пока цель активна, её модель не покупаем нигде
  const MK=ban?MODEL_KEYS.filter(m=>m!==ban):MODEL_KEYS;
  // bot-10: ставки аренды держатся по рынку. Инфляция поднимает mk() каждые 30 дней, и игрок, который не
  // трогает ползунок «Финансы» → «Ставки», получает старые тарифы при новых издержках — бот делал то же самое
  if(B(2))CLASSES.forEach(cl=>{const m=mk(cl);if(S.rents[cl]!==m)S.rents[cl]=m});
  // bot-9: машина без ресурса не зарабатывает, но платит стоянку. Меняем парк плавно:
  // сначала покупаем замену, только потом продаём старьё — иначе на 400-й день весь парк истекает разом и партия тонет
  if(!T){const old=S.fleet.filter(c=>carWear(c)>.85).length, need=Math.min(old,S.fleet.length?2:0);
   for(let k=0;k<need;k++){const m=MK.filter(x=>!MODELS[x].lease&&(MODELS[x].rank||0)<=S.rank).sort((a,b)=>priceOf(a)-priceOf(b))[0];
     if(m&&S.money>priceOf(m)+200000&&carsN()<S.spots)buy(m)}
   S.fleet.filter(carDead).slice(0,4).forEach(c=>{if(S.money>priceOf(c.m))simSell(c,'dead');});}
  // bot-12: парк больше, чем водителей, — это пустые места, полная стоянка и ноль выручки. Разумный владелец излишек
  // продаёт; без этого правила замер бесконечного режима видит не экономику, а самоубийство покупками
  // bot-16: продаём самую БЕСПОЛЕЗНУЮ машину, а не самую уставшую. Работяга с 70 % износа кормит парк, а машина без
  // водителя не изнашивается вовсе — бракуя первых, бот делал весь парк вечно молодым, и ресурс «не наступал»
  if(endl()&&!T){const surplus=carsN()-(S.drivers+8);
    if(surplus>0)S.fleet.slice().filter(c=>c.lease<=0||S.money>leaseRet(c)).sort((a,b)=>carRev(a)-carRev(b)).slice(0,Math.min(surplus,2)).forEach(c=>simSell(c,'surplus'))}
  if(g12&&!T&&g12.buy&&countM(...g12.buy)<g12.n){const ms=g12.buy.filter(m=>MODELS[m]&&m!==ban&&(MODELS[m].rank||0)<=S.rank&&carsN()<S.spots&&S.money>priceOf(m)+reserve());
    if(ms.length)buy(ms.sort((a,b)=>priceOf(a)-priceOf(b))[0])}
  // замену готовим заранее: продаём по одной машине в день и только когда парку есть на что опереться
  if(ban&&!T){const bad=S.fleet.filter(c=>c.m===ban);
    if(bad.length){const rep=MK.filter(m=>!MODELS[m].lease&&(MODELS[m].rank||0)<=S.rank).sort((a,b)=>priceOf(a)-priceOf(b))[0];
      const bought=!!rep&&carsN()<S.spots&&S.money>priceOf(rep)+reserve();if(bought)buy(rep);
      if(bought||carsN()>bad.length)simSell(bad[0],'goal')}}
  // bot-8: сервис должен успевать за парком — иначе замер видит очередь в гараже, а не экономику
  // bot-12: норма берётся из brkRate() — фактических поломок за неделю. Старая оценка «carFail × failMult» не видит
  // вторую смену, погоду и усталость: на 400-й день бот думал, что хватает одного механика, пока стояло 34 машины в ремонте
  {const breaks=brkRate(),need=Math.max(1,Math.min(staffCap(),Math.ceil((breaks-3)/3)));
   if(S.staff[2]<need&&S.money>STAFF_PAY*need*10)staffChange(2,need-S.staff[2])}
  // bot-14: отдел «Подключение» — это пропускная способность найма (BAL[18]). Без него замер большого парка
  // показывает не экономику, а затычку: вольются 6-7 человек в неделю и всё, парк стоит.
  // Правило включено только в бесконечном режиме: в кампании те же сотрудники отдела подняли бы «Обычный»
  // с 57,3 % до 66,7 %, и выпуск перестал бы быть сравнимым с 49-м
  {const need0=endl()?Math.max(1,Math.min(staffCap(),Math.ceil(S.drivers/8))):S.staff[0];
   if(S.staff[0]<need0&&S.money>STAFF_PAY*need0*10)staffChange(0,need0-S.staff[0])}
  if(S.debt>=2&&S.loans.length<maxLoans()&&(!simpleOn()||tabOpen('fin')))takeLoan(0);
  const C=S.mode==='story'?S.chapter||0:-1,hz=S.mode==='endless'?120:dayLimit()-S.day,n=totalCars();
  const mg=k=>k<=15?0:Math.round(Math.pow(k-15,1.3)*70*inf()/100)*100;
  // кампании нужны ровно 15 машин — докупаем до цели, не глядя на окупаемость
  let need=S.mode==='campaign'?GOAL_CARS:0;if(C===1)need=Math.max(...S.rivals.map(r=>r.cars))+2;if(C===3)need=35;
  if(C===3&&!S.branches.length&&S.rank>=3&&S.money>=branchSite(0).price+60000)openBranch();
  // bot-13: в замере размера сеть финансируется иначе, чем в живой игре: резерв на 12 дней операционных расходов
  // при доходе 275 тыс. ₽/сут — это 2-3 млн ₽, и бот годами не покупал ни машины, а цель зависала на 118.
  // При заданной цели хватает запаса 15 % сверх цены — так строится кит, которого и измеряем
  const fund=pr=>T?Math.round(pr*1.15):pr+reserve();
  // bot-7: в бесконечном режиме филиалы — главная поздняя экономика; без них замер видел только спираль основного парка
  if(endl()&&!T&&S.rank>=3){const site=branchSite(S.branches.length);
    if(S.branches.length<BRANCH_MAX&&S.money>=site.price+reserve())openBranch();
    S.branches.forEach((b,i)=>{if(b.drivers<b.cars&&S.money>=400000)branchAct(i,'hire50');
      else if(b.drivers>=b.cars&&b.cars<BR_CAR_CAP&&S.money>=Math.round(50*BR_CAR_PRICE*inf()+reserve()))branchAct(i,'car50');
      else if(b.drivers>=b.cars&&b.cars<BR_CAR_CAP&&S.money>=Math.round(10*BR_CAR_PRICE*inf()+reserve()))branchAct(i,'car10')})}
  // bot-13: замер размера сети. Живое правило «сначала накопи резерв на 12 дней» здесь мешает: при доходе 380 тыс. ₽/сут
  // резерв — 2-3 млн, и сеть застревает в ловушке «на пачку водителей не хватает, машину купить нельзя» на 151 машине.
  // Поэтому при заданной цели филиал достраивается по доступности денег: берётся максимальная пачка, которую оплачивают касса
  if(T&&endl()&&S.rank>=3&&n<T){const site=branchSite(S.branches.length),car=BR_CAR_PRICE*inf();let left=T-n;
    if(S.branches.length<BRANCH_MAX&&S.money>=site.price*1.15){const c0=totalCars();openBranch();left-=totalCars()-c0}
    S.branches.forEach((b,i)=>{if(left<=0)return;const c0=totalCars();
      if(b.drivers<b.cars){const g=b.cars-b.drivers;
        if(g>=50&&S.money>=50*6000*1.15)branchAct(i,'hire50');
        else if(g>=10&&S.money>=10*6000*1.15)branchAct(i,'hire10');
        else if(S.money>=6000*1.15)branchAct(i,'hire')}
      else{const want=Math.min(50,BR_CAR_CAP-b.cars,left);
        if(want>=50&&S.money>=50*car*1.15)branchAct(i,'car50');
        else if(want>=10&&S.money>=10*car*1.15)branchAct(i,'car10');
        else if(want>=1&&S.money>=car*1.15)branchAct(i,'car')}
      left-=totalCars()-c0})}
  // цель ниже текущего размера — сбрасываем парк до неё (филиал по частям не ужимается, там потолок задан покупкой)
  if(T&&n>T){const over=n-T;S.fleet.slice().filter(c=>c.lease<=0||S.money>leaseRet(c)).sort((a,b)=>carWear(b)-carWear(a)).slice(0,Math.min(over,2)).forEach(c=>simSell(c,'target'))}
  const cap=T||(S.mode==='campaign'?GOAL_CARS:need||1e9),force=T?n<T:n<need;
  // в бесконечном режиме сверяемся с реальным чистым доходом последних 7 дней на машину
  const st7=S.stat.slice(-7),avg=st7.length?st7.reduce((a,x)=>a+x.net,0)/st7.length:0;
  if(carsN()<cap&&n<cap&&(force||hz>=(C===0||C===2?10:1))){const ok=m=>(MODELS[m].rank||0)<=S.rank,by=f=>MK.filter(m=>ok(m)&&f(MODELS[m]));
    const eco=by(M=>M.cls==='Эконом'&&!M.lease).sort((a,b)=>carRevM(b)/priceOf(b)-carRevM(a)/priceOf(a))[0];
    const ls=by(M=>M.lease>0).sort((a,b)=>priceOf(a)-priceOf(b))[0];
    const lot=carsN()>=S.spots?lotPrice():0;
    // окупится ли ещё одна машина до горизонта; в замере размера окупаемость не смотрим, но водителей бережём:
    // парк в 1000 машин при 200 водителях — это не размер сети, а способ обанкротиться, и так играет только бот-самоубийца
    const pays=m=>{if(T)return carsN()<S.drivers+3;const M=MODELS[m],lz=M.lease>0;
      if(S.mode==='endless'&&!force&&!(avg>0&&avg/Math.max(1,n)*hz>priceOf(m)+lot))return false;
      return force||hz*(carRevM(m)*(.5+S.rep/100)-parkMarg()-(mg(n+1)-mg(n)))-(lz?M.lease*Math.min(hz,LEASE_DAYS):0)>priceOf(m)+lot};
    const m=[eco,ls].find(m=>m&&S.money>=fund(priceOf(m)+lot)&&pays(m));
    if(m){if(lot)buyLot();if(carsN()<S.spots)buy(m)}}
  // нехватка больше пяти экипажей — вакансия с продвижением: 20 000 ₽ вместо 8 000 ₽, но откликов 3-4 вместо 2-3.
  // Только в бесконечном режиме: в кампании это правило поднимало «Обычный» с 57,3 % до 66,7 %, и замер стал бы
  // про сравнение ботов, а не про баланс игры
  {const gap=carsN()-brokenN()-S.drivers,H=bal('hire'),big=endl()&&gap>5;
   for(let k=0;k<hirePerDay()&&(S.hireDayN||0)<hirePerDay()&&gap>0&&S.money>=(big?H.cost+H.boost:H.cost)+20000;k++)hire(big)}}
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
  // накопительно за партию: сколько машин ХОТЬ РАЗ доели ресурс и хоть раз перешагнули 70 % износа.
  // Снимок в конце партии ничего не показывает: умирающую машину бот продаёт в тот же день
  let deadEver=0,wornEver=0;const seenD=new Set(),seenW=new Set();
  S=null;G.tutDone=1;G.a2hs=1;G.loginPending=0;G.simple=cfg.simple;simOpen=false;G.hold=null;G.holdMig=1;
  newGame(cfg.mode,[0,1,2].map(d=>({key:HEADS[d][0].key,name:HEADS[d][0].name})),{diff:cfg.diff,chapter:cfg.chapter||0,city:cfg.city,hold:cfg.hold});
  if(simOpen)simPump();
  if(B(4))S.agg=cfg.agg||'mig';
  const C=S.mode==='story'?CHAPTERS[S.chapter]:null,cap=S.mode==='endless'?(cfg.days||120):dayLimit()+10;
  for(let i=0;i<cap;i++){
    simTax=false;simMorning(r);
    r.heavy=Math.max(r.heavy,(S.crisis?1:0)+(S.raid?1:0)+(S.strike||S.news.some(n=>n.id==='strike')?1:0)+(simTax?1:0)+(B(2)&&taxOn()&&isTaxDay(S.day)&&S.taxAcc>0?1:0));
    if(simTax)r.tax++;if(S.crisis&&S.crisis!==crisis0)r.crises++;crisis0=S.crisis;
    simBuy(cfg);simShift(cfg.strat);simDesks();
    const day=S.day;endDay();r.fails=S.cnt.brk||0;r.fat=S.fat||0;clock+=864e5;
    S.fleet.forEach(c=>{if(carDead(c)&&!seenD.has(c.id)){seenD.add(c.id);deadEver++}if(carWear(c)>.7&&!seenW.has(c.id)){seenW.add(c.id);wornEver++}});
    if(r.goalDay===null&&(C?C.goal(S):goalMet()))r.goalDay=day;
    const lose=S.mode!=='sandbox'&&((S.money<0&&S.debt>=5)||S.rep<=0||S.drivers===0),fin=hasLimit()&&day>=dayLimit();
    if(lose||fin||day===stopDay||(S.mode==='endless'&&i===cap-1)){r.money=Math.round(S.money);r.cars=carsN();r.rep=S.rep;r.profit=Math.round(profit());r.poach=S.cnt.poach||0;r.tr=TRIAL[S.city]?TRIAL[S.city].v():0;r.wars=S.cnt.wars||0;r.cs=S.cscore||0;
      // сеть целиком: филиалы живут по своим правилам, и без них замер бесконечного режима слепой
      r.total=totalCars();r.br=(S.branches||[]).length;r.brCars=(S.branches||[]).reduce((a,b)=>a+b.cars,0);r.brDrv=(S.branches||[]).reduce((a,b)=>a+b.drivers,0);r.gi=S.goal;
      // сколько машин в конце партии действительно доели свой ресурс — без этого «срок эксплуатации» можно включить и не заметить
      r.dead=S.fleet.filter(carDead).length;r.worn=S.fleet.filter(c=>carWear(c)>.7).length;r.maxWear=S.fleet.length?Math.round(100*Math.max(...S.fleet.map(carWear))):0;
      r.deadEver=deadEver;r.wornEver=wornEver;r.soldBy=S.cnt&&S.cnt.soldBy||{};
      {const ks=S.fleet.map(c=>c.km).sort((x,y)=>x-y);r.maxKm=ks.length?ks[ks.length-1]:0;r.medKm=ks.length?ks[Math.floor(ks.length/2)]:0;r.age=S.fleet.length?Math.round(S.fleet.reduce((a,c)=>a+(S.day-(c.bought||1)),0)/S.fleet.length):0}
      // сутки как их видит игровое окно «ИТОГИ ДНЯ»: выручка и чистыми за последний день партии
      {const st=S.stat[S.stat.length-1]||{};r.rev=Math.round(st.rev||0);r.net=Math.round(st.net||0);r.drv=S.drivers}
      if(lose)r.died=S.day;
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
    totalP50:pct(rs.map(r=>r.total||0),.5),brP50:pct(rs.map(r=>r.br||0),.5),brCarsP50:pct(rs.map(r=>r.brCars||0),.5),brDrvP50:pct(rs.map(r=>r.brDrv||0),.5),diedP50:pct(rs.filter(r=>r.died).map(r=>r.died),.5),giP50:pct(rs.map(r=>r.gi||0),.5),deadP50:pct(rs.map(r=>r.dead||0),.5),wornP50:pct(rs.map(r=>r.worn||0),.5),deadEverP50:pct(rs.map(r=>r.deadEver||0),.5),wornEverP50:pct(rs.map(r=>r.wornEver||0),.5),soldBy:rs.reduce((a,r)=>{for(const k in r.soldBy)a[k]=(a[k]||0)+r.soldBy[k];return a},{}),maxWearP90:pct(rs.map(r=>r.maxWear||0),.9),medKmP50:pct(rs.map(r=>r.medKm||0),.5),maxKmP90:pct(rs.map(r=>r.maxKm||0),.9),revP50:pct(rs.map(r=>r.rev||0),.5),netP50:pct(rs.map(r=>r.net||0),.5),drvP50:pct(rs.map(r=>r.drv||0),.5),
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
  const r=simBatch({diff,mode,seeds,simple,strat:o.strat,agg:o.agg,chapter:o.chapter||0,days:o.days,city:o.city,hold:o.hold,target:o.target});console.table([simFlat(r)]);return r});
window.__balanceSim.all=(n=100)=>simGuard(()=>{const rs=['easy','normal','hard'].map(diff=>simBatch({diff,mode:'campaign',seeds:n,simple:false,chapter:0}));console.table(rs.map(simFlat));return rs});
window.__balanceSim.story=(n=100)=>simGuard(()=>{const rs=CHAPTERS.map((C,i)=>simBatch({diff:'normal',mode:'story',seeds:n,simple:false,chapter:i}));console.table(rs.map(simFlat));return rs});
window.__balanceSim.free=(hours=24,streak=1)=>simGuard(()=>{
  const r=simRun({diff:'normal',mode:'campaign',simple:false},1,8);Date.now=()=>0;G.lastSeen=-hours*36e5;
  const last=S.stat.slice(-7),avgNet=last.length?Math.round(last.reduce((a,x)=>a+x.net,0)/last.length):0,m0=S.money;
  const off=offlineIncome(),out={SIM_V,hours,streak,avgNet,offline:off||0,offlineShare:avgNet>0?+((off||0)/avgNet).toFixed(2):0,login:bal('loginDay')*Math.min(streak,7)+(streak%7===0?bal('loginBonus'):0),loginParts:streak%7===0?bal('loginParts'):0,loginLoy:streak%7===0?bal('loginLoy'):0,moneyBefore:Math.round(m0)};
  console.table([out]);return out});
})();
