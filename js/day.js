// Таксопарк «ДСТ-24» — события дня, автосалон и найм, конец дня, утро
/* ================= СОБЫТИЯ ДНЯ ================= */
const getEv=(d,ref)=>typeof ref==='string'?CHAINS[ref].ev:EVENTS[d][ref];
// забастовка из «Ультиматума» не должна совпасть с другим ударом: тогда дилемма уходит в очередь
// событие, где один из ответов — забастовка («Ультиматум», его продолжение, переход агрегатора), ждёт, пока 2 дня свободны от ударов
const ultBlocked=(d,i)=>B(2)&&getEv(d,i).c.some(c=>c.fx&&c.fx.news==='strike')&&(!heavyDays(S.day,2)||hvToday)&&(S.queue.push({d,id:i,at:S.day+2}),true);
function nextEvent(d){
  const qi=S.queue.findIndex(q=>q.d===d&&q.at<=S.day);
  if(qi>-1){const q=S.queue.splice(qi,1)[0],e=getEv(d,q.id);if((!e.need||typeof q.id==='string'||e.need(S))&&!ultBlocked(d,q.id))return q.id}
  const funnyP=d===1?(hasHead('gena')?.7:.45):0;
  for(let tries=0;tries<40;tries++){
    if(!S.decks[d].length)S.decks[d]=shuffle(EVENTS[d].map((_,i)=>i));
    const i=S.decks[d].pop(),ev=EVENTS[d][i];
    if(ev.need&&!ev.need(S)||S.queue.some(q=>q.d===d&&q.id===i))continue;
    if(ultBlocked(d,i))continue;
    if(!ev.dl&&S.day>=3&&Math.random()<(S.day>=6?.45:.3)&&S.decks[d].some(j=>EVENTS[d][j].dl&&(!EVENTS[d][j].need||EVENTS[d][j].need(S)))){S.decks[d].unshift(i);continue}
    if(funnyP&&!ev.f&&Math.random()<funnyP*.5&&S.decks[d].some(j=>EVENTS[d][j].f)){S.decks[d].unshift(i);continue}
    return i;
  }
  return 0;
}
function snap(){return{money:S.money,rep:S.rep,drivers:S.drivers,cars:carsN(),broken:brokenN()}}
/* ---- забастовка: пикет во дворе, сценки начала и конца, последствия ---- */
const strikeOn=()=>S.news.find(n=>n.id==='strike');
function strikeBegins(){if(S.strike)return;S.strike={day:S.day,lost:0};addLog('Водители бастуют: половина парка стоит у здания с плакатами.');if(!scn)triggerScene('strikeStart')}
/* последствия, когда срок забастовки истёк: журнал, рейтинг, отношения, газета, риск повтора */
function strikeEnds(notes){const days=Math.max(1,S.day-S.strike.day+1),lost=Math.round(S.strike.lost/1000)*1000;
  S.dlist.forEach(x=>x.r=Math.max(4,+(x.r-.03).toFixed(3)));relAdd(0,-1);S.wk.strike={days,lost};
  const msg=`Забастовка закончилась: ${days} дн., упущено ≈${rub(lost)}. Водители работают нервно — рейтинг немного просел, начальник «Подключения» недоволен.`;notes.push(msg);addLog(msg);
  const al=S.dlist.length?S.dlist.reduce((a,x)=>a+x.loy,0)/S.dlist.length:60,ui=EVENTS[0].findIndex(e=>e.t==='Ультиматум водителей');
  if(al<50&&ui>-1&&Math.random()<.35){S.queue.push({d:0,id:ui,at:S.day+rand(5,9)});const m2='Водители всё ещё недовольны — забастовка может повториться.';notes.push(m2);addLog(m2)}
  if(!scn)triggerScene('strikeEnd');S.strike=null}
function apply(fx={},d){
  fx=Object.assign({},fx);
  if(d===0&&hasHead('lena')&&fx.rep<0)fx.rep=Math.ceil(fx.rep/2);
  if(d===2&&hasHead('olga')&&fx.broken>0){let b=0;for(let i=0;i<fx.broken;i++)if(Math.random()<.5)b++;fx.broken=b}
  S.money+=fx.money||0;
  if(fx.rep>0&&S.rep>50){const g=fx.rep*Math.max(.3,1-(S.rep-50)/70);fx.rep=Math.floor(g)+(Math.random()<g%1?1:0)}
  S.rep=Math.max(0,Math.min(100,S.rep+(fx.rep||0)));
  S.drivers=Math.max(0,S.drivers+(fx.drivers||0));
  if(fx.cars>0)for(let i=0;i<fx.cars;i++)addCar('solaris');
  if(fx.cars<0)for(let i=0;i<-fx.cars;i++)removeCar();
  if(fx.broken>0)breakCars(fx.broken);
  if(fx.upg){S.upg[fx.upg]=true;if(fx.upg==='office')S.rep=Math.min(100,S.rep+5)}
  if(fx.cnt)S.cnt[fx.cnt]=(S.cnt[fx.cnt]||0)+1;
  if(fx.staff&&d!=null)S.staff[d]=Math.max(0,S.staff[d]+fx.staff);
  if(fx.loy&&S.dlist)S.dlist.forEach(x=>x.loy=Math.max(0,Math.min(100,x.loy+fx.loy)));
  if(fx.angry)S.angry=1;
  if(fx.contract&&S.contracts.length<3)S.contracts.push(Object.assign({},fx.contract,{fails:0}));
  if(fx.rel&&d!=null&&S.heads)relAdd(d,fx.rel);
  if(fx.tdebt)S.tdebt=Math.max(0,(S.tdebt||0)+fx.tdebt);
  if(fx.rent)CLASSES.forEach(cl=>{if(S.rents[cl])S.rents[cl]=Math.round(S.rents[cl]*(1+fx.rent/100)/50)*50});
  if(fx.rival&&S.rivals&&S.rivals.length){const r=[...S.rivals].sort((a,b)=>b.cars-a.cars)[0];r.cars+=fx.rival}
  if(fx.lot)S.lotOwned=1;
  if(fx.parts)S.parts=Math.max(0,(S.parts||0)+fx.parts);
  if(fx.fix)S.fleet.filter(c=>c.b&&!c.h).slice(0,fx.fix).forEach(c=>c.b=0);
  if(fx.hold){const c=S.fleet.find(c=>!c.b&&!c.svc);if(c){c.b=1;c.h=fx.hold}}
  if(fx.news){const N=NEWS.find(x=>x.id===fx.news);if(N){S.news=S.news.filter(n=>n.id!==N.id);S.news.push({id:N.id,days:N.days});if(N.id==='strike')strikeBegins()}}
}
const evCost=(c,d)=>{let v=typeof c.cost==='function'?c.cost(S)*inf():(c.cost||0)*costScale();if(d===1&&hasHead('timur'))v*=.8;return Math.round(v/100)*100};
const scx=fx=>fx&&fx.money?Object.assign({},fx,{money:Math.round(fx.money*(fx.money<0?negScale():costScale())/100)*100}):fx;
function choose(d,i,gameRes){
  if(S.done[d]||S.over||S.preview)return;
  const ev=getEv(d,S.today[d]),c=ev.c[i];
  if(c.game&&gameRes===undefined){LINE_GAMES[c.game](ok=>choose(d,i,ok));return}
  if(S.mode==='contest')ctUse(S.seed,S.day*10+d);
  const before=snap();
  const hp=headPick(d,ev);
  S.money-=evCost(c,d);apply(scx(c.fx),d);
  let msg=c.m,bad=isBad(c.fx);
  if(c.game){const o=gameRes?c.win:c.lose;apply(scx(o.fx),d);msg=o.m;bad=!gameRes;if(gameRes&&c.game==='race')S.cnt.vip=(S.cnt.vip||0)+1}
  if(c.r){const rb=isBad(c.r.fx);let p=rb?c.r.p*rm(d):Math.min(.95,c.r.p/rm(d));
    if(d===0&&hasHead('artur')&&!rb)p=Math.min(.95,p*1.3);
    if(rb&&S.day<=7)p*=.7;
    if(Math.random()<p){apply(scx(c.r.fx),d);msg=c.r.m;bad=rb}
    else{if(c.bonus&&Math.random()<c.bonus.p)apply(scx(c.bonus.fx),d);if(rb&&!evCost(c,d)){S.tdebt=(S.tdebt||0)+1}}}
  if(d===2&&evCost(c,d)>0&&!c.r)S.tdebt=Math.max(0,(S.tdebt||0)-1);
  if(c.chain)S.queue.push({d:CHAINS[c.chain].d,id:c.chain,at:S.day+rand(2,4)});
  if(c.e){S.later=S.later||[];S.later.push({at:S.day+rand(c.e.in[0],c.e.in[1]),d,t:ev.t,l:c.l,from:S.day,p:c.e.p,fx:c.e.fx,m:c.e.m,alt:c.e.else||null})}
  if(hp>-1){const hn=esc(S.heads[d].name.split(' ')[0]),k=ev.dl?2:1;
    if(i===hp){if(Math.random()<.2*k){relAdd(d,1);msg+=` <i class="relnote up">${hn} одобряет ваше решение.</i>`}}
    else if(Math.random()<.13*k){relAdd(d,-1);msg+=` <i class="relnote down">${hn} недоволен(а), что совет не послушали.</i>`}}
  S.hist[d].push(bad?-1:1);S.hist[d]=S.hist[d].slice(-8);
  const a=snap(),delta={};for(const k in a)delta[k]=a[k]-before[k];
  S.done[d]={choice:i,msg,delta};
  if(S.quest&&S.quest.type==='noneg'&&delta.rep<0)S.quest.failed=true;
  if(bad&&S.wk){S.wk.fails.push(msg);S.wk.fails=S.wk.fails.slice(-10)}
  {const tt=ev.t+' '+msg;if(/Гус/.test(tt))triggerScene('geese');else if(/ДТП|занесло|столб|авари|Авари/.test(tt))triggerScene('crash');else if(/эвакуат|Эвакуат|штрафстоянк/.test(tt))triggerScene('tow')}
  addLog(DEPTS[d].name+': '+msg);sfx(bad?'bad':delta.money>0?'coin':'click');
  save();render(before);
}

/* ================= АВТОСАЛОН, ПАРК, НАЙМ ================= */
const priceOf=m=>Math.round(MODELS[m].price*inf()*(cityDef().price||1)*dif().price*(stratOn('grow')?.9:1)*(hasHead('logist')?.9:1)/500)*500;
const rankName=r=>RANKS[r]?RANKS[r].n:'';
function buy(m){
  const M=MODELS[m];if(S.over)return;
  if(S.rank<(M.rank||0)){toast(`Откроется на звании «${rankName(M.rank)}»`);sfx('bad');return}
  if(carsN()>=S.spots){toast('Стоянка заполнена. Расширьте её во вкладке «База»');sfx('bad');return}
  const pr=priceOf(m);if(S.money<pr){toast('Не хватает денег в кассе');sfx('bad');return}
  const before=snap();S.money-=pr;S.taxAcc=Math.max(0,(S.taxAcc||0)-pr*.5);addCar(m);if(M.rep)S.rep=Math.min(100,S.rep+M.rep);S.cnt.bought=(S.cnt.bought||0)+1;
  addLog(`Автосалон: ${M.name} (${M.kind}) за ${rub(pr)}${M.lease?`, лизинг ${rub(M.lease)}/день на ${LEASE_DAYS} дн.`:''}.`);
  toast(`${M.name} в парке! Машин: ${carsN()}`);sfx('car');triggerScene('newcar');save();render(before);
}
function sellCar(id){
  const i=S.fleet.findIndex(c=>c.id===id);if(i<0||S.over)return;
  const c=S.fleet[i],M=MODELS[c.m],before=snap(),v=carValue(c),lr=c.lease>0?leaseRet(c):0;
  if(lr&&S.money<lr){toast('Не хватает денег на возврат лизинга');return}
  S.fleet.splice(i,1);S.money+=v-lr;
  addLog(c.lease>0?`Вернули ${M.name} лизинговой компании${lr?` (−${rub(lr)})`:''}. Платежи прекращены.`:`Продали ${M.name} (${km(c.km)}) за ${rub(v)}.`);
  toast(c.lease>0?'Машина возвращена в лизинг':`Продано за ${rub(v)}`);sfx('coin');save();render(before);
}
function hire(){
  if(S.hired||S.over)return;
  if(S.money<HIRE_COST){toast('Не хватает денег в кассе');return}
  const before=snap();S.money-=HIRE_COST;S.hired=true;
  const r=Math.random()*(hasHead('artur')?.75:1),n=r<.25?2:r<.8?1:0;S.drivers+=n;
  const msg=n===2?'Откликнулись двое, оба вышли на линию.':n?'Пришёл один водитель.':'Звонили одни перекупщики. Никого.';
  addLog('Вакансия: '+msg);toast(msg);sfx(n?'coin':'bad');syncDrivers();save();render(before);
  if(n>0)pddExam(S.dlist.slice(-n));
}
function buyUpg(k){
  const U=UPGRADES[k];if(S.upg[k]||S.over)return;
  if(S.rank<(U.rank||0)){toast(`Откроется на звании «${rankName(U.rank)}»`);return}
  if((U.cars||0)>carsN()){toast(`Нужно машин в парке: ${U.cars}`);return}
  const up=upgPrice(k);if(S.money<up){toast('Не хватает денег в кассе');sfx('bad');return}
  const before=snap();S.money-=up;apply({upg:k});addLog(`База: построили «${U.name}».`);toast(`Построено: ${U.name}`);sfx('win');save();render(before);
}
const upgPrice=k=>Math.round(UPGRADES[k].price*inf()*(stratOn('save')?1.2:1)/1000)*1000;
const lotPrice=()=>Math.round((30000+12000*((S.spots-12)/8))*inf()/1000)*1000;
// продаются только купленные расширения (места от выкупа конкурента не в счёт): возвращается доля уплаченного
const lotBack=()=>{const L=S.lotsPaid||[];return L.length?Math.round(L[L.length-1]*bal('lotBack')/1000)*1000:0};
function sellLot(){if(S.over||S.preview||!B(6)||!(S.lotsPaid||[]).length||S.spots-8<12||S.spots-carsN()<8){toast('Продать можно 8 свободных мест, но не меньше 12 на стоянке');sfx('bad');return}
  const p=lotBack(),before=snap();S.money+=p;S.spots-=8;S.lotsPaid.pop();addLog(`База: продано 8 мест стоянки, вернулось ${rub(p)}. Теперь ${S.spots} мест.`);toast(`Стоянка: ${S.spots} мест, +${rub(p)}`);sfx('coin');save();render(before)}
function buyLot(){if(S.over)return;const p=lotPrice();if(S.money<p){toast('Не хватает денег в кассе');sfx('bad');return}
  const before=snap();S.money-=p;S.spots+=8;S.lotsPaid=(S.lotsPaid||[]).concat(p);addLog(`База: стоянка расширена до ${S.spots} мест.`);toast(`Стоянка: ${S.spots} мест`);sfx('coin');save();render(before)}
function staffChange(d,delta){const n=S.staff[d]+delta;if(n<0||n>8||S.over)return;S.staff[d]=n;addLog(`${DEPTS[d].name}: ${delta>0?'нанят сотрудник':'сотрудник уволен'}. Теперь ${n}.`);sfx('click');save();render()}
const trainPrice=d=>Math.round(15000*(S.train[d]+1)*inf()/1000)*1000;
function train(d){if(S.train[d]>=3||S.over)return;const p=trainPrice(d);if(S.money<p){toast('Не хватает денег в кассе');sfx('bad');return}
  const before=snap();S.money-=p;S.train[d]++;addLog(`${DEPTS[d].name}: обучение команды, уровень ${S.train[d]}.`);toast('Команда прошла обучение');sfx('win');save();render(before)}
function changeHead(d,key,free){
  const h=availHeads(d).find(x=>x.key===key);if(!h)return;
  if(!free){if(S.money<15000){toast('Не хватает денег на выходное пособие');sfx('bad');return}S.money-=15000}
  const nm=G.pins[d]&&G.pins[d].key===key?G.pins[d].name:h.name;
  addLog(`${DEPTS[d].name}: новый начальник — ${nm}.`);S.heads[d]={key,name:nm};sfx('click');save();render();
}
function renameHead(d){const v=($('nm'+d).value||'').trim().slice(0,40);if(!v)return;S.heads[d].name=v;if(G.pins[d]&&G.pins[d].key===S.heads[d].key){G.pins[d].name=v;saveG()}toast('Имя сохранено');save();render()}
function pinHead(d,on){G.pins[d]=on?{key:S.heads[d].key,name:S.heads[d].name}:null;saveG();toast(on?'Начальник закреплён для новых игр':'Закрепление снято');render()}
function saveFounders(){G.founders=[0,1,2].map(i=>(($('fn'+i).value||'').trim().slice(0,40))||FOUNDERS[i].name);saveG();toast('Имена учредителей сохранены');render()}
function rentInfo(){const{o,u}=rentDev(),out=[];
  if(o>0)out.push(`<span class="neg">Водители уходят чаще: примерно ${((.003+o*.19)*100).toFixed(1)}% в день каждый</span>`);
  if(u>0)out.push(`<span class="pos">К вам охотнее идут: шанс нового водителя ${Math.min(95,Math.round(u/.1875*60))}% в день</span>`);
  return out.join('<br>')||'Все ставки по рынку: водители не уходят и не приходят из-за цены';}
// можно ли взять кредит i: при A третий — только после двух, при D — только малый
const loanOk=i=>{const n=S.loans.length;if(!B(5))return i<2&&n<2;const g=cGrade();return n<maxLoans()&&(g==='D'?i===0:g==='A'?(n>=2?i===2:i<2):i<2)};
function repayLoan(k){const l=S.loans[k];if(!B(5)||!l||S.over)return;const c=l.pay*l.left;if(S.money<c){toast(`Не хватает денег: нужно ${rub(c)}`);return}
  const before=snap();S.money-=c;S.loans.splice(k,1);S.cnt.loanPaid=(S.cnt.loanPaid||0)+1;if(cOn()&&(l.took==null||S.day-l.took>=bal('cHold')))cAdd(bal('cOk')+bal('cEarly')); // рейтинг не купить: бонус только если кредит прожил cHold дней
  addLog(`Банк: кредит погашен досрочно за ${rub(c)}.`);toast('Кредит погашен');sfx('coin');save();render(before)}
function takeLoan(i){const L=loanOffer(i),m=maxLoans();if(S.over)return;if(S.loans.length>=m){toast(B(5)?`С рейтингом ${cGrade()} банк даёт не больше ${m} ${m===1?'кредита':'кредитов'}`:'Банк не даст больше двух кредитов');return}
  if(!loanOk(i)){toast(`С рейтингом ${cGrade()} этот кредит недоступен`);return}
  const before=snap();S.money+=L.amount;S.loans.push(Object.assign({amount:L.amount,pay:loanPay(L),left:L.days},B(5)?{took:S.day}:{}));
  addLog(`Банк: кредит ${rub(L.amount)} на ${L.days} дней.`);toast(`Получено ${rub(L.amount)}`);sfx('coin');save();render(before)}

/* ================= КОНЕЦ ДНЯ ================= */
const premiumN=()=>S.fleet.filter(c=>MODELS[c.m].cls!=='Эконом').length;
function endDay(){
  if(S.mode==='contest')ctUse(S.seed,S.day*2+1);
  const date=dateOf(S.day),sea=season(date),hol=HOLIDAYS[mmdd(date)];
  syncDrivers();
  const fat0=B(3)?S.fat||0:0;
  if(B(3)&&S.upg.mech){const m=S.fleet.filter(c=>!c.b&&!c.svc&&toLeft(c)<0).sort((a,b)=>toLeft(a)-toLeft(b))[0];if(m)m.svc=1}
  const working=S.fleet.filter(c=>!c.b&&!c.svc).sort((a,b)=>carRev(b)-carRev(a));
  const crewD=[...S.dlist].sort((a,b)=>drvQ(b)-drvQ(a));
  const active=Math.min(S.drivers,working.length), factor=0.5+S.rep/100;
  const notes=[];
  // рейд ГАИ
  let stops=0,raidFine=0;
  if(S.raid&&S.raid.days>0){const p=.08*(1-S.raid.prep)*rm(1)*(hasHead('yurist')?.5:1)*(1+shN()/100*.6);
    for(let i=0;i<active;i++)if(Math.random()<p*(crewD[i]&&crewD[i].t==='racer'?1.7:1))stops++;
    raidFine=stops*5000;S.raid.fines=(S.raid.fines||0)+stops;S.raid.days--;
    notes.push(stops?`Рейд ГАИ: остановили ${stops} маш., штрафы ${rub(raidFine)}, смены потеряны.`:'Рейд ГАИ: проверки прошли без замечаний.');
    if(S.raid.days<=0){if(!S.raid.fines)S.cnt.raidClean=(S.cnt.raidClean||0)+1;notes.push('Рейды ГАИ закончились.');S.raid=null}}
  const crews=Math.max(0,active-stops);
  const Wt=WEATHER[S.weather[0]]||WEATHER.clear;const mood=Wt.demand,moodNote=Wt.demand!==1?`Погода: ${Wt.n.toLowerCase()} — спрос ×${Wt.demand}.`:null;
  // контракты: часть экипажей работает на компании
  let cAvail=crews,cRev=0,cPen=0;S.contracts.forEach(c=>{const sv=Math.min(cAvail,c.cars);cAvail-=sv;cRev+=sv*c.pay;if(sv<c.cars){cPen+=(c.cars-sv)*c.pen;c.fails++}c.days--});
  const regular=cAvail;
  const rivalAvg=S.rivals.reduce((a,r)=>a+r.rep,0)/S.rivals.length;
  const share=1+Math.max(-.08,Math.min(.08,(S.rep-rivalAvg)/100*.2));
  const nightK=B(3)?1+(S.shift2||0)/100*bal('shiftRev'):1+(S.night||0)/100*.25,distK=distFactor();
  const shB=shashBad();
  const tk=townK();if(tk!==1)notes.push(`Город: ×${tf2(tk)} к выручке.`);
  const demand=cityDemand()*(crisisOn('giant')?.85:1)*(crisisOn('cyber')?.75:1)*mood*sea.demand*newsMod('demand')*(hol?hol[0]:1)*share*RANK_BONUS[S.rank||0]*prestRev()*(warOn()?bal('warK'):1)*ownRev()*netRevK()*tk;
  const base=working.slice(0,regular).reduce((a,c,i)=>a+carRev(c)*drvQ(crewD[i]),0);
  const sat=satK(),mgmt=mgmtCost();
  const revK=B(2)&&camp()&&bal('rev')[S.diff]||1,AG=B(4)?aggDef():null,aggM=AG?AG.ord*(shB?bal('shashOrd'):1)*(S.aggNext===S.day?bal('aggIdle'):1):1;
  let revenue=Math.round(base*factor*demand*nightK*distK*sat*revK*aggM/100)*100,aggFee=0;
  if(AG){const gr=Math.round(revenue/bal('grossK')/100)*100,nt=Math.round(revenue*(1-AG.fee)/bal('grossK')/100)*100;aggFee=gr-nt;revenue=nt;S.aggLast=aggFee}
  {const sN=strikeOn();if(sN){if(!S.strike)S.strike={day:S.day,lost:0};const k=newsDef(sN).demand||1;if(k<1)S.strike.lost+=Math.round(revenue*(1-k)/k)}}
  const adsRev=(S.ads?carsN()*300:0)+(S.upg.gas?carsN()*150:0);
  const parking=Math.round(carsN()*PARKING*inf()*(S.lotOwned?.4:1)), lease=leaseSum(), pay=payroll(), loans=loanSum(), office=Math.round(OFFICE*inf()*(ownHas('office')?.95:1));
  if(hol){notes.push(`Праздник: ${hol[1]}! Спрос ×${hol[0]}.`);if(hol[1]==='Новогодняя ночь'&&active>0)S.cnt.nye=1}
  if(moodNote)notes.push(moodNote);
  working.slice(0,crews).forEach(c=>c.km+=rand(300,450));
  // водители: рейтинг, опыт, лояльность, штрафы
  const careIds=new Set();let drvFines=0;const devR=rentDev();
  crewD.slice(0,crews).forEach((dr,i)=>{const T=TRAITS[dr.t];
    dr.r=Math.max(4.3,Math.min(5,+(dr.r+T.rate+(Math.random()-.5)*(T.swing?.06:.016)).toFixed(3)));
    if(dr.t==='neat'&&working[i])careIds.add(working[i].id);
    if(dr.t==='racer'&&Math.random()<.06){const fn=B(3)?Math.round(2500*(1+fatK(fat0)*bal('fatFine'))/100)*100:2500;drvFines+=fn;notes.push(`${dr.n} снова превысил скорость: штраф ${rub(fn)}.`)}
    if(dr.t==='rookie'&&Math.random()<.04){dr.t=['neat','vet','night','star'][rand(0,3)];notes.push(`${dr.n} освоился и больше не новичок: теперь «${TRAITS[dr.t].n}».`)}});
  if(shB)S.dlist.forEach(d=>d.r=Math.max(4.3,+(d.r-bal('shashDrop')).toFixed(3)));
  S.dlist.forEach(dr=>{dr.loy=Math.max(0,Math.min(100,dr.loy+(devR.o>0?-devR.o*25:.4)+(stratOn('people')?.5:0)-(B(3)?fatK(fat0)*bal('fatLoy'):(S.night||0)/100*1.5)+(dr.t==='night'?shN()/100:0)))});
  if(B(3)){const nf=S.dlist.filter(d=>d.t!=='night').length/Math.max(1,S.dlist.length);
    S.fat=Math.max(0,Math.min(100,Math.round(((S.shift2||0)>0?fat0+(S.shift2||0)/100*bal('fatUp')*nf:fat0-bal('fatDown'))*10)/10));
    if(fat0>bal('fatLeaveAt')&&Math.random()<bal('fatLeaveP')){const t=S.dlist.filter(d=>d.t!=='night').sort((a,b)=>a.loy-b.loy)[0];if(t){S.dlist=S.dlist.filter(d=>d!==t);S.drivers=S.dlist.length;notes.push(`${t.n} ушёл: выгорел на второй смене.`)}}}
  const lowLoy=S.dlist.filter(dr=>dr.loy<20&&Math.random()<.15);
  if(lowLoy.length){S.dlist=S.dlist.filter(dr=>!lowLoy.includes(dr));S.drivers=S.dlist.length;notes.push(`Ушли недовольные: ${lowLoy.map(x=>x.n).join(', ')}.`)}
  if(S.day%3===0&&crews>0){const avg=crewD.slice(0,crews).reduce((a,x)=>a+x.r,0)/crews;
    if(avg>4.85){S.rep=Math.min(100,S.rep+1);notes.push(`Средний рейтинг водителей ${avg.toFixed(2)} — пассажиры довольны, +1 к репутации.`)}
    else if(avg<4.65){S.rep=Math.max(0,S.rep-1);notes.push(`Средний рейтинг водителей ${avg.toFixed(2)} — низковат, −1 к репутации.`)}}
  // ремонт: мощность сервиса
  let cap=repairCap();S.fleet.filter(c=>c.b&&!c.h).forEach(c=>{if(cap>0){c.b=0;cap--}});
  S.fleet.forEach(c=>{if(c.h){c.h--;if(c.h<=0){c.h=0;c.b=0}}});
  const stuck=S.fleet.filter(c=>c.b&&!c.h).length;if(stuck)notes.push(`Сервис не успел починить ${stuck} маш. — очередь. Нужно больше механиков.`);
  // ночные поломки
  let repair=0,breaks=0;const fm=failMult(),rmul=repairMult(),names={};
  const fmx=fm*Wt.fail*(B(3)?1+fatK(fat0)*bal('fatFail'):1+(S.night||0)/100*.3)*(S.lines.delivery?1.04:1);
  let usedParts=0,noParts=0;
  S.fleet.forEach(c=>{if(!c.b&&!c.svc&&Math.random()<carFail(c)*fmx*(careIds.has(c.id)?.6:1)*(crisisOn('roads')?1.25:1)){c.b=1;breaks++;let pm=1;if(MODELS[c.m].repair){if(S.parts>0){S.parts--;usedParts++;pm=.6}else{noParts++;pm=crisisOn('parts')?1.8:1.3}}repair+=MODELS[c.m].repair*rmul*pm;names[MODELS[c.m].name]=(names[MODELS[c.m].name]||0)+1}});
  repair=Math.round(repair/100)*100;
  if(usedParts)notes.push(`Со склада ушло запчастей: ${usedParts}. Осталось ${S.parts}.`);if(noParts)notes.push(`<span class="neg">На складе нет запчастей — ${noParts} ремонт(а) обошлись дороже.</span>`);
  S.fleet.forEach(c=>{if(c.svc){c.svc=0;c.to=c.km+bal('toKm')}});
  const bn=Object.entries(names);
  if(bn.length)notes.push('Ночью сломались: '+bn.map(([n,k])=>k>1?`${n} ×${k}`:n).join(', ')+'.');
  S.fleet.forEach(c=>{if(c.lease>0){c.lease--;if(c.lease===0)notes.push(`Лизинг за ${MODELS[c.m].name} выплачен — машина ваша.`)}});
  const grade0=cGrade();S.loans.forEach(l=>l.left--);const paidOff=S.loans.filter(l=>l.left<=0);if(paidOff.length){if(cOn())cAdd(bal('cOk')*paidOff.length);S.cnt.loanPaid=(S.cnt.loanPaid||0)+paidOff.length;notes.push('Кредит полностью выплачен.')}
  S.loans=S.loans.filter(l=>l.left>0);
  // водители
  const leaveMul=(ownHas('gym')?.97:1)*(hasHead('marina')?.6:1)*(S.upg.call?.8:1)*(stratOn('people')?.6:1)*(1+load01(0));
  const dev=devR,leaveP=(.003+dev.o*.19+newsMod('leave')+Math.max(0,S.fuel-1)*.04*(S.upg.gas?.3:1)+(crisisOn('fuel')?.02:0))*leaveMul;
  let gone=0;for(let i=0;i<S.drivers;i++)if(Math.random()<leaveP)gone++;
  const idle=Math.max(0,S.drivers-gone-carsN());let idleGone=0;for(let i=0;i<idle;i++)if(Math.random()<.35*leaveMul)idleGone++;
  if(gone)notes.push(`${gone} вод. ушли: ${dev.o>0?'аренда слишком высокая':'нашли другую работу'}.`);
  if(idleGone)notes.push(`${idleGone} вод. ушли: простаивали без машины.`);
  S.drivers-=gone+idleGone;
  if(S.rep<30&&S.drivers>0&&Math.random()<.4*leaveMul){S.drivers--;notes.push('Водитель ушёл: у парка плохая репутация.')}
  if(S.drivers<carsN()+1&&dev.u>0&&Math.random()<dev.u/.1875*.6){S.drivers++;notes.push('Пришёл водитель: у вас выгодная аренда.')}
  if(S.drivers<carsN()&&S.rep>=75&&Math.random()<.35){S.drivers++;notes.push('Сам пришёл водитель: слышал, что у вас хорошо.')}
  S.moodMod=(S.moodMod||[0,0,0]).map(v=>Math.abs(v)<.01?0:v*.9);
  if(S.upg.gas)S.dlist.forEach(x=>x.loy=Math.min(100,x.loy+.2));
  if(S.upg.wash&&S.day%3===0)S.rep=Math.min(100,S.rep+1);
  if(B(6))Object.entries(OWNER_ITEMS).forEach(([k,I])=>{if(!I.ev||!ownHas(k)||S.day%I.ev[0])return;const[,t,v]=I.ev;if(t==='rep')S.rep=Math.min(100,S.rep+v);else S.dlist.forEach(x=>x.loy=Math.min(100,x.loy+v));notes.push(`${I.n}: +${v} к ${t==='rep'?'репутации':'лояльности водителей'}.`)});
  // задание агрегатора
  if(S.quest){const q=S.quest;q.days--;
    if(q.type==='shifts')q.prog+=active;
    if(q.type==='revenue')q.prog+=revenue;
    if(q.type==='nobreak'){q.prog+=breaks;if(q.prog>q.target)q.failed=true}
    if(q.type==='rep'&&S.rep<q.target)q.failed=true;
    if(q.type==='lineup'&&active<q.target)q.failed=true;
    if(q.type==='fair'&&S.rents['Эконом']>mk('Эконом'))q.failed=true;
    questProg();
    const ok=QMODE[q.type]==='reach'?q.prog>=q.target:(q.days<=0&&!q.failed);
    if(ok){S.money+=q.reward;S.news.push({id:'prio',t:'Приоритет от агрегатора',d:'выручка +10%',demand:1.1,days:5});S.cnt.quests=(S.cnt.quests||0)+1;notes.push(`Задание агрегатора выполнено! +${rub(q.reward)} и приоритет на 5 дней.`);S.quest=null;S.nextQuest=S.day+3}
    else if(q.failed||q.days<=0){notes.push('Задание агрегатора провалено. −2 к репутации.');S.rep=Math.max(0,S.rep-2);S.quest=null;S.nextQuest=S.day+4}}
  // новости
  S.news.forEach(n=>n.days--);S.news=S.news.filter(n=>n.days>0);
  if(S.strike&&!strikeOn())strikeEnds(notes);
  if(S.news.length<2&&Math.random()<.3){const pool=NEWS.filter(n=>!n.ev&&!S.news.some(x=>x.id===n.id));const n=pool[Math.random()*pool.length|0];if(n){S.news.push({id:n.id,days:n.days});notes.push(`Новости города: ${n.t} (${n.d}).`)}}
  // конкурент
  const myCars=totalCars();let poached=0;
  S.rivals.forEach(r=>{const g={war:.5,poach:.4,prem:.3,calm:.35}[r.style]||.4;if(Math.random()<g)r.cars++;
    if(myCars>r.cars&&S.mode!=='sandbox'){const gap=Math.min(1,(myCars-r.cars)/20);if(Math.random()<.45*gap)r.cars+=rand(1,2);if(myCars>=(B(4)?bal('poachFrom'):25)&&S.drivers>3&&Math.random()<.06*gap*(r.style==='poach'?2:1)*(B(4)?aggDef().poach:1)){S.drivers--;poached++;S.cnt.poach=(S.cnt.poach||0)+1;notes.push(`«${r.name}» переманил вашего водителя: у лидера рынка все хотят забрать людей.`)}}if(r.aggr&&Math.random()<.6)r.cars++;if(S.rep<40&&Math.random()<.3)r.cars++;
    r.rep=Math.max(30,Math.min(95,r.rep+rand(-2,2)))});
  if(B(4)&&S.mode!=='sandbox'&&featOpen('rival')){
    S.lowDays=!S.war&&rentAvg()<=-bal('warLow')?(S.lowDays||0)+1:0; // во время войны демпинг не копится
    if(S.war&&S.day>=S.war.at+S.war.len-1){S.war=null}
    else if(S.war&&S.day===S.war.at)notes.push(`«${esc(S.war.by)}» начал ценовую войну: спрос ×${bal('warK')} на ${S.war.len} дн. Подтяните ставки к рынку.`);
    if(!S.war&&S.lowDays>=bal('warDays')&&Math.random()<bal('warP')){const rv=S.rivals.find(r=>r.style==='war')||S.rivals[rand(0,S.rivals.length-1)];S.war={at:S.day+bal('warAt'),len:bal('warLen'),by:rv.name};S.lowDays=0;S.cnt.wars=(S.cnt.wars||0)+1}
    if(S.ctLost&&S.day>S.ctLost.day){const L=S.ctLost;S.ctLost=null;
      if(Math.random()<bal('lostP')){const rv=S.rivals[rand(0,S.rivals.length-1)];rv.cars+=rand(1,2);rv.rep=Math.min(95,rv.rep+2);addLog(`Контракт с ${esc(L.co)} достался «${esc(rv.name)}».`);notes.push(`Контракт с ${esc(L.co)}, от которого вы отказались, забрал «${esc(rv.name)}».`)}}}
  // бензин
  S.fuel=Math.max(.85,Math.min(1.35,S.fuel*(1+rand(-25,30)/1000)));
  // филиалы
  let brNet=0;S.branches.forEach(b=>{const act=Math.min(b.cars,b.drivers);
    const rev=act*(B(6)?bal('brRev'):3300)*b.bonus*(.5+S.rep/100)*demand*(.85+.05*b.mgr),cost=3000+b.cars*600+b.mgr*1500;let br=0;for(let i=0;i<b.cars;i++)if(Math.random()<.03*dif().fail)br+=7000;
    let lv=0;for(let i=0;i<b.drivers;i++)if(Math.random()<.01)lv++;b.drivers-=lv;
    const net=Math.round((rev-cost-br)/100)*100;b.last=net;brNet+=net});
  // профсоюз
  const avgLoy=S.dlist.length?S.dlist.reduce((a,x)=>a+x.loy,0)/S.dlist.length:60;
  if(!S.union){if(avgLoy<40){S.unionDays++;if(S.unionDays>=3){S.union=true;S.nextUnion=S.day+1;notes.push('<b class="neg">Водители создали профсоюз! Скоро будут требования.</b>')}}else S.unionDays=0}
  else if(avgLoy>65){S.union=false;S.unionDays=0;notes.push('Водители довольны — профсоюз распущен.')}
  // школа водителей
  const grads=S.school.filter(x=>x.ready<=S.day);if(grads.length){S.school=S.school.filter(x=>x.ready>S.day);grads.forEach(()=>{S.drivers++;const nd=newDriver();nd.t=['neat','vet','star'][rand(0,2)];nd.r=4.85;nd.loy=85;nd.xp=0;S.dlist.push(nd);notes.push(`Выпускник школы водителей ${nd.n} вышел на линию.`)})}
  if(hasHead('oleg')&&S.day%5===0){S.drivers++;notes.push('Олег Наймов привёл нового водителя по знакомству.')}
  if(hasHead('robot')&&Math.random()<.05){breakCars(1);notes.push('«Гайка-3000» заглючил и разобрал не ту машину.')}
  if(S.lines.kids&&S.day%5===0)S.rep=Math.min(100,S.rep+1);
  if(S.ads&&S.day%5===0){S.rep=Math.max(0,S.rep-1);notes.push(`Реклама ${S.ads.brand} на машинах: часть пассажиров недовольна, −1 к репутации.`)}
  // контракты: итоги
  S.contracts.filter(c=>c.days<=0).forEach(c=>{notes.push(`Контракт с ${c.co} завершён${c.fails?` (сорвано дней: ${c.fails})`:' без срывов: +2 к репутации'}.`);if(!c.fails)S.rep=Math.min(100,S.rep+2)});
  S.contracts=S.contracts.filter(c=>c.days>0);
  if(cPen)notes.push(`Не хватило машин на контракты: неустойка ${rub(cPen)}.`);
  const gross=revenue+cRev+adsRev-office-mgmt-pay-parking-lease-loans-repair-raidFine-drvFines-cPen+brNet;
  const invCut=gross>0?Math.round(gross*invShare()/10000)*100:0;
  const net=gross-invCut;
  S.money+=net;
  if(S.mode==='sandbox')S.money=Math.max(S.money,99999999);
  // кризисы
  if(S.crisis){S.crisis.days--;if(S.crisis.days<=0){notes.push(`Кризис «${CRISES[S.crisis.id].n}» позади. Парк выстоял: +2 к репутации.`);S.rep=Math.min(100,S.rep+2);S.cnt.crisis=(S.cnt.crisis||0)+1;S.crisis=null}}
  else if(!dailyLike()&&S.day>=S.nextCrisis&&S.day>=(B(2)&&camp()?bal('crisisMin'):20)&&(!B(2)||!simpleOn()||S.day>=FEATURE_DAY.raid)){
    const ks=Object.keys(CRISES),k=ks[rand(0,ks.length-1)],len=B(2)&&camp()?Math.min(CRISES[k].days,bal('crisisMax')):CRISES[k].days;
    if(B(2)&&!heavyDays(S.day+1,len))S.nextCrisis=S.day+rand(2,4);
    else{S.crisis={id:k,days:len};S.nextCrisis=B(2)&&camp()?1e9:B(2)&&endl()?S.day+rand(...bal('endCrisisNext')):S.day+rand(45,70);
    if(k==='fuel')S.fuel=Math.max(S.fuel,1.3);if(k==='giant')S.rivals.forEach(r=>r.cars+=2);if(k==='roads')S.dmods.center=.7;
    notes.unshift(`<b class="neg">КРИЗИС: ${CRISES[k].n}!</b> ${CRISES[k].d}. Продлится ${len} дн.`)}}
  if(crisisOn('fuel'))S.fuel=Math.max(S.fuel,1.3);
  // погода и районы на завтра
  S.weather.shift();while(S.weather.length<3)S.weather.push(genWeather(S.day+1+S.weather.length));
  // статистика и неделя
  if(S.rep>75&&S.day%2===0)S.rep--;
  if(S.kpi)S.kpi.acc+=revenue+cRev+adsRev;
  S.taxAcc=Math.max(0,(S.taxAcc||0)+net);
  let taxPaid=0;if(taxOn()&&isTaxDay(S.day)&&S.taxAcc>0){taxPaid=Math.round(Math.min(S.taxAcc*TAX_RATE,Math.max(0,S.money)*.5)/100)*100;S.money-=taxPaid;S.taxAcc=0;notes.unshift(`${B(2)&&camp()?'Налог':'Квартальный налог'} с прибыли: ${rub(taxPaid)}.`)}
  if(B(2)&&camp()?S.day===bal('inflDay'):S.day%(B(2)&&endl()?bal('endInfl'):30)===0){const r=rand(...(B(2)&&camp()?bal('inflPct'):[2,4]))/100;S.infl=(S.infl||1)*(1+r);S.mInfl=(S.mInfl||1)*(1+r*.6);notes.push(`Инфляция: цены выросли на ${Math.round(r*100)}%. Рыночные ставки аренды подросли — проверьте ставки во «Финансах».`)}
  if(cOn()){if(S.money<0){cAdd(-1);S.cstreak=0}else if(++S.cstreak>=bal('cStreak')){cAdd(1);S.cstreak=0}
    if(cGrade()!==grade0)notes.unshift(`Кредитный рейтинг: ${grade0} → <b class="${cGrade()<grade0?'pos':'neg'}">${cGrade()}</b>.`)}
  S.stat.push({d:S.day,rev:revenue+cRev+adsRev,net,money:Math.round(S.money),cars:totalCars(),rep:S.rep});S.stat=S.stat.slice(-90);
  S.wk.rev+=revenue+cRev+adsRev;S.wk.net+=net;S.wk.breaks+=breaks;S.cnt.brk=(S.cnt.brk||0)+breaks;S.wk.fines+=raidFine+drvFines;
  const lines=[['Экипажей на линии',crews+(stops?` (−${stops} на рейде)`:'')+(crews-regular?`, ${crews-regular} на контрактах`:'')],[`Аренда (реп. ×${factor.toFixed(2)}, спрос ×${demand.toFixed(2)}, районы ×${distK.toFixed(2)}${revK!==1?`, сложность ×${revK}`:''}${B(3)?(S.shift2?`, вторая смена ×${nightK.toFixed(2)}`:''):S.night?`, ночь ×${nightK.toFixed(2)}`:''}${sat<1?`, рынок ×${sat.toFixed(2)}`:''})`,rub(revenue+aggFee)],['Офис',rub(-office)],...(mgmt?[['Управление большим парком',rub(-mgmt)]]:[]),['Зарплаты начальников и команд',rub(-pay)],['Стоянка и страховка',rub(-parking)]];
  if(aggFee)lines.splice(2,0,[`Комиссия «${AGG[S.agg||'mig'].n}» (${Math.round(AG.fee*100)}%)`,rub(-aggFee)]);
  if(lease)lines.push(['Лизинг',rub(-lease)]);
  if(loans)lines.push(['Кредиты',rub(-loans)]);
  if(repair)lines.push(['Ремонт ночных поломок',rub(-repair)]);
  if(B(3)&&fat0>=bal('fatFrom'))lines.push([`Усталость ${Math.round(fat0)}% — поломок больше`,`×${(1+fatK(fat0)*bal('fatFail')).toFixed(2)}`]);
  if(raidFine)lines.push(['Штрафы на рейде ГАИ',rub(-raidFine)]);
  if(drvFines)lines.push(['Штрафы водителей',rub(-drvFines)]);
  if(S.branches.length)lines.push([`Филиалы (${S.branches.length})`,(brNet>=0?'+':'')+rub(brNet)]);
  if(cRev)lines.splice(2,0,['Корпоративные контракты',rub(cRev)]);
  if(adsRev)lines.splice(2,0,[S.upg.gas&&S.ads?'Реклама и своя АЗС':S.upg.gas?'Своя АЗС':'Реклама на машинах',rub(adsRev)]);
  if(cPen)lines.push(['Неустойка по контрактам',rub(-cPen)]);
  if(typeof taxPaid!=='undefined'&&taxPaid)lines.push(['Квартальный налог',rub(-taxPaid)]);
  if(invCut)lines.push([`Доля инвесторов (${invShare()}%)`,rub(-invCut)]);
  addLog(`Итог дня: ${net>=0?'+':''}${rub(net)}.`);
  const finished=hasLimit()&&S.day>=dayLimit();S.day++;
  if(S.mode==='endless'){const R=G.rec;R.days=Math.max(R.days,S.day-1);R.cars=Math.max(R.cars,carsN());R.money=Math.max(R.money,S.money);R.goals=Math.max(R.goals,S.goal);saveG()}
  save();cloudPush();
  if(S.money<0){S.debt=(S.debt||0)+1;if(S.debt<5)notes.unshift(`<b class="neg">Касса в минусе! Если за ${5-S.debt} дн. не выйти в плюс, парк закроют за долги. Можно взять кредит во вкладке «Деньги» → «Финансы».</b>`)}else S.debt=0;
  const lose=S.mode!=='sandbox'&&((S.money<0&&S.debt>=5)||S.rep<=0||S.drivers===0);
  sfx(net>=0?'coin':'bad');
  showModal(`<span class="step">ИТОГИ ДНЯ ${S.day-1}</span><div class="bignet ${net>=0?'pos':'neg'}">${net>=0?'+':''}${rub(net)}</div>
    <p class="note" style="text-align:center">чистыми за день · в кассе ${rub(S.money)}</p>
    ${notes.slice(0,3).map(n=>`<p class="note">${n}</p>`).join('')}
    <details class="more"><summary>Подробнее: доходы и расходы${notes.length>3?` и ещё ${notes.length-3} событ.`:''}</summary>
    ${notes.slice(3).map(n=>`<p class="note">${n}</p>`).join('')}
    <div class="rows">${lines.map(([a,b])=>`<div class="row"><span>${a}</span><b>${b}</b></div>`).join('')}
    <div class="row total"><span>Чистыми за день</span><b class="${net>=0?'pos':'neg'}">${net>=0?'+':''}${rub(net)}</b></div></div>
    </details>
    ${!lose&&!finished?`<div class="tease"><b>Завтра:</b> ${tomorrowTease()}</div>`:''}
    <button class="btn" id="next">${lose?'Чем всё кончилось':finished?'Подвести итоги':'Начать день '+S.day}</button>`);
  $('next').onclick=()=>{hideModal();if(lose)gameOver();else if(finished)finale();else startDay()};
  $('next').focus();
}

/* ================= УТРО: проверки, конкурент, задания ================= */
function startDay(){
  ctSync(S);const nn=netDay();townDay();
  S.done=[null,null,null];S.hired=false;rollDistricts();
  // B(2): проверку откладываем, если идёт удар; рейд и профсоюз не стартуют в один день с ней и друг с другом
  let tx=(S.taxAt&&S.taxAt.includes(S.day))||(S.mode==='endless'&&S.day>=S.nextTax);
  if(B(2)&&tx&&(S.crisis||S.raid||S.strike||S.news.some(n=>n.id==='strike')||isTaxDay(S.day))){tx=false;if(S.taxAt&&S.taxAt.includes(S.day))S.taxAt=S.taxAt.map(t=>t===S.day?t+rand(2,4):t);else S.nextTax=S.day+rand(2,4)}
  const rd=S.day>=S.nextRaid&&!S.raid&&(!B(2)||!tx&&heavyGate('nextRaid',3)),un=S.union&&S.day>=S.nextUnion&&(!B(2)||!tx&&!rd&&heavyGate('nextUnion',2));
  hvToday=B(2)&&!!(tx||rd||un);
  S.today=[0,1,2].map(nextEvent);
  const m=[];
  if(S.day>1&&S.day%7===1)m.push('paper');
  if(S.day>=S.nextMeeting)m.push('meeting');
  if(S.day>=S.nextInspect)m.push('inspect');
  if(tx)m.push('tax');
  if(rd)m.push('raid');
  if(S.branches.length&&Math.random()<.15)m.push('branch');
  if(un)m.push('union');
  if(S.day>=S.nextAuction)m.push('auction');
  if(S.day>=S.nextContract&&S.contracts.length<3)m.push('contract');
  if(S.day>=S.nextCareer)m.push('career');
  if(S.day>=3&&!G.a2hs&&canA2HS())m.push('a2hs');
  if((S.tdebt||0)>=8)m.push('boom');
  if(S.day>=10&&Math.random()<.025)m.push('rare');
  if([0,1,2].some(d=>relOf(d)<=-5)&&Math.random()<.3)m.push('quit');
  if(S.day>=S.nextConflict)m.push('conflict');
  if(S.day>=S.nextAgency&&HEADS.some(h=>h.some(x=>x.hidden&&!S.agency.includes(x.key))))m.push('agency');
  if(S.day>=S.nextRival)m.push('rival');
  if(!S.quest&&S.day>=S.nextQuest)m.push('quest');
  let mm=m.filter(k=>featOpen(k));
  if(simpleOn()){mm.sort((a,b)=>MORNING_PRIO.indexOf(a)-MORNING_PRIO.indexOf(b));mm=mm.slice(0,1)}
  // новые вкладки
  const opened=MTABS.filter(([k])=>simpleOn()&&S.day===(TAB_DAY[k]||1)&&S.day>1).map(([k,l])=>l);
  if(opened.length){toast(`Открыто: ${opened.join(', ')}`);addLog(`Новые возможности: ${opened.join(', ')}.`)}
  S.later=S.later||[];const due=S.later.filter(x=>x.at<=S.day);if(due.length){S.later=S.later.filter(x=>x.at>S.day);S.echoDue=due;mm.unshift('echo')}
  if(nn)mm.push('netnews');
  S.morning=mm;freshDesks=true;save();render();runMorning();netGifts();netMailRun();
}
function runMorning(){
  if(!S.morning.length||S.over){save();render();return}
  const k=S.morning.shift();save();
  ({inspect:inspection,rival:rivalEvent,quest:newQuest,meeting:meeting,tax:taxAudit,raid:raidEvent,branch:branchEvent,paper:newspaper,career:careerEvent,a2hs:a2hsEvent,boom:debtBoom,rare:rareEvent,echo:echoEvent,quit:quitEvent,conflict:conflictEvent,union:unionEvent,auction:auction,contract:contractOffer,agency:agencyEvent,netnews:netNewsEv}[k]||runMorning)();
}
const fName=i=>G.founders[i]||FOUNDERS[i].name;
function inspection(){
  triggerScene('founder');
  const fi=rand(0,2),d=rand(0,2),F=FOUNDERS[fi];
  S.nextInspect=S.day+rand(5,9);save();
  showModal(`<div class="who"><canvas class="face big" width="16" height="16" data-face="founder:${fi}"></canvas><div><span class="step">ПРОВЕРКА УЧРЕДИТЕЛЯ</span><h2>${esc(fName(fi))}</h2></div></div>
    <p>${esc(fName(fi))} ${F.g==='f'?'приехала':'приехал'} без предупреждения и хочет проверить отдел <b style="color:${DEPTS[d].hex}">«${DEPTS[d].name}»</b>. Этот учредитель ${F.about}.</p>
    <p class="note">Начальник отдела: ${esc(S.heads[d].name)}. Сотрудников: ${S.staff[d]}, обучение: ${S.train[d]}/3.</p>
    <div class="modes"><button class="mode" id="iHonest"><b>ПРОЙТИ ПРОВЕРКУ</b><span>${MG_INFO[d]}</span></button>
    <button class="mode" id="iShow"><b>УСТРОИТЬ ПОКАЗУХУ (−8 000 ₽)</b><span>Покрасить бордюры, раздать сотрудникам галстуки. Если раскроют — будет хуже.</span></button></div>`);
  drawFaces();sfx('alert');
  $('iHonest').onclick=()=>MINIGAMES[d](fi,(bonus,sum)=>inspectResult(fi,d,false,bonus,sum));
  $('iShow').onclick=()=>inspectResult(fi,d,true);
}
function inspectResult(fi,d,show,bonus=0,sum=''){mgStop();
  const F=FOUNDERS[fi],h=headDef(d),fem=F.g==='f';
  let sc=48+S.staff[d]*5+S.train[d]*8+h.skill*7-load01(d)*40+S.hist[d].slice(-6).reduce((a,b)=>a+(b>0?4:-7),0)+rand(-12,12);
  if(S.upg.office)sc+=8;
  if(S.angry){sc-=10;S.angry=0}
  const relB=relOf(d)>=5;if(relB)sc+=6;
  if(F.focus==='money')sc+=S.money>250000?8:S.money<80000?-10:0;
  if(F.focus==='rep')sc+=Math.round((S.rep-60)/2);
  if(F.focus==='cars')sc+=-5*brokenN()+(S.upg.diag?5:0)+(S.upg.tire?4:0);
  sc+=bonus;
  let exposed=false;
  if(show){S.money-=8000;if(Math.random()<.3){exposed=true;sc-=25}else sc+=14}
  const before=snap();let res,cls,text;
  if(sc>=70){relAdd(d,1);res='ОТЛИЧНО';cls='pos';S.rep=Math.min(100,S.rep+4);S.money+=25000;S.cnt.insGood=(S.cnt.insGood||0)+1;
    text=`${esc(fName(fi))} довол${fem?'ьна':'ен'}: отдел работает как часы. Премия отделу +25 000 ₽ и +4 к репутации.`}
  else if(sc>=45){res='НОРМАЛЬНО';cls='';text=`${esc(fName(fi))} сделал${fem?'а':''} пару замечаний, но в целом всё в порядке.`}
  else{res='ПЛОХО';cls='neg';S.rep=Math.max(0,S.rep-4);S.money-=15000;
    text=`${esc(fName(fi))} недовол${fem?'ьна':'ен'}. Штраф 15 000 ₽ и −4 к репутации.`}
  const fire=sc<28;
  if(relB)text+=` ${esc(S.heads[d].name)} прикрыл(а) вас: вы давно ладите.`;
  if(exposed)text='Показуху раскрыли: под свежей краской нашли старые проблемы. '+text;
  addLog(`Проверка: ${fName(fi)} → «${DEPTS[d].name}»: ${res.toLowerCase()}.`);
  showModal(`<div class="who"><canvas class="face big" width="16" height="16" data-face="founder:${fi}"></canvas><div><span class="step">ИТОГ ПРОВЕРКИ · ${DEPTS[d].name.toUpperCase()}</span><h2 class="${cls}">${res}</h2></div></div>
    ${sum?`<p class="note">Испытание: ${sum} <b class="${bonus>0?'pos':bonus<0?'neg':''}">(${bonus>0?'+':''}${bonus} к оценке)</b></p>`:''}
    <p>${text}</p>${fire?`<p class="neg">Учредитель требует сменить начальника отдела «${DEPTS[d].name}».</p>`:''}
    <button class="btn" id="iOk">${fire?'Выбрать нового начальника':'Продолжить'}</button>`);
  drawFaces();sfx(cls==='pos'?'win':cls==='neg'?'bad':'click');save();render(before);
  $('iOk').onclick=()=>{if(fire)pickHead(d,()=>runMorning(),false);else{hideModal();runMorning()}};
}
