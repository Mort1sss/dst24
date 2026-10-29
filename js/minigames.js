// Таксопарк «ДСТ-24» — мини-игры проверок и на линии, диспетчер
/* ================= МИНИ-ИГРЫ ПРОВЕРОК ================= */
const MG_INFO=['Учредитель позвонит в поддержку под видом клиента. Ответьте правильно.','Учредитель листает документы. Найдите просроченные, пока он не заметил.','Учредитель смотрит, как механик работает. Затяните гайки точно в нужный момент.'];
let mgTimer=null,mgRaf=null,mgKey=null;
function mgStop(){clearInterval(mgTimer);mgTimer=null;cancelAnimationFrame(mgRaf);mgRaf=null;if(mgKey){document.removeEventListener('keydown',mgKey);mgKey=null}}
/* ---- пауза: таймеры мини-игр, анимация и музыка стоят; время паузы не засчитывается ---- */
let paused=false,mgSkew=0,mgPrev=0;
/* кадры мини-игр: в паузе не идут, а разрыв больше 0,1 с (пауза, подвисание) сжимается до одного кадра */
function mgRAF(cb){return requestAnimationFrame(function f(ts){if(paused){mgRaf=requestAnimationFrame(f);return}
  let t=ts-mgSkew;if(mgPrev&&t-mgPrev>100){mgSkew+=t-mgPrev-16;t=mgPrev+16}mgPrev=t;cb(t)})}
function setPause(on){if(paused===on)return;paused=on;$('pause').hidden=!on;
  try{AC&&(on?AC.suspend():AC.resume())}catch(e){}if(on)$('pauseGo').focus()}
const QUIZ=[
 {q:'«Я забыл в такси рюкзак с ноутбуком!»',a:['Найти водителя по номеру поездки и договориться о возврате','Сказать, что парк за вещи не отвечает','Посоветовать обратиться в полицию']},
 {q:'Водитель: «Агрегатор заблокировал аккаунт, не понимаю за что»',a:['Проверить причину в кабинете агрегатора и помочь подать апелляцию','Сказать, что само разблокируется','Предложить поработать без аккаунта']},
 {q:'«Водитель мне нагрубил, накажите его!»',a:['Извиниться, записать жалобу и запросить объяснение у водителя','Сразу уволить водителя','Сказать, что пассажир сам виноват']},
 {q:'Кандидат: «Какие документы нужны, чтобы к вам устроиться?»',a:['Паспорт, водительское удостоверение и оформленная самозанятость','Только паспорт','Никаких, оформим потом']},
 {q:'Водитель после ДТП звонит в панике',a:['Успокоить, убедиться, что все целы, и объяснить, как оформить ДТП','Сказать, чтобы уезжал с места','Попросить перезвонить завтра']},
 {q:'«С меня списали деньги за поездку дважды!»',a:['Проверить поездку и оформить возврат через агрегатор','Сказать, что виноват банк','Пообещать скидку без проверки']},
 {q:'Водитель хочет в отпуск на две недели',a:['Согласовать даты и найти подмену на его машину','Запретить отпуск','Отпустить, а машина пусть постоит']},
 {q:'Агрегатор упал, водители спрашивают, что делать',a:['Предупредить всех в чате и переключить на резервный агрегатор','Отправить всех домой','Ничего не отвечать, само починится']},
 {q:'«В машине грязно, сиденье липкое!»',a:['Извиниться, вернуть часть оплаты и отправить машину на мойку','Сказать, что так у всех','Попросить пассажира протереть самому']},
];
function mgQuiz(fi,done){
  const qs=shuffle([...QUIZ]).slice(0,3);let i=0,ok=0;
  const step=()=>{
    if(i>=qs.length){const b=ok*6-(3-ok)*4;done(b,`звонки в поддержку — правильных ответов ${ok} из 3`);return}
    const Q=qs[i],ans=shuffle(Q.a.map((t,k)=>({t,k})));
    showModal(`<span class="step">ПРОВЕРКА · ЗВОНОК ${i+1} ИЗ 3</span><h2>${esc(fName(fi))} на линии</h2><p class="mg-q">${Q.q}</p>
      <div class="modes">${ans.map((a,j)=>`<button class="mode" id="qa${j}" data-k="${a.k}"><span style="color:var(--ink)">${a.t}</span></button>`).join('')}</div><p class="note" id="qaMsg"></p>`);
    let answered=false;
    ans.forEach((a,j)=>$('qa'+j).onclick=()=>{if(answered)return;answered=true;const right=a.k===0;if(right)ok++;sfx(right?'coin':'bad');
      $('qaMsg').innerHTML=right?'<span class="pos">Верно! Учредитель кивнул.</span>':`<span class="neg">Не то. Правильно: ${Q.a[0]}.</span>`;
      $('qa'+j).classList.add(right?'mg-ok':'mg-bad');
      const nb=document.createElement('button');nb.className='btn';nb.textContent=i<2?'Следующий звонок':'Итог';nb.onclick=()=>{i++;step()};$('qaMsg').after(nb);nb.focus()});
  };step();
}
function mgDocs(fi,done){
  const today=dateOf(S.day),L='АВЕКМНОРСТУХ',pick=()=>L[rand(0,L.length-1)];
  const n=8,bad=new Set(shuffle([...Array(n).keys()]).slice(0,3));
  const MF=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'],MS=['янв.','февр.','мар.','апр.','мая','июн.','июл.','авг.','сент.','окт.','нояб.','дек.'];
  const fmt=d=>`${d.getDate()} ${MS[d.getMonth()]} ${d.getFullYear()}`;
  const docs=[...Array(n).keys()].map(k=>{const d=new Date(today),off=bad.has(k)?-rand(1,40):rand(2,240);d.setDate(d.getDate()+off);
    return{ago:-off,plate:`${pick()}${rand(100,999)}${pick()}${pick()} ${['77','97','177','799','50','750'][rand(0,5)]}`,doc:['ОСАГО','Диагн. карта','Разрешение'][rand(0,2)],date:fmt(d),bad:bad.has(k)}});
  const sel=new Set();let left=15;
  showModal(`<span class="step">ПРОВЕРКА ДОКУМЕНТОВ</span><h2>Найдите просроченные</h2>
    <div class="mg-today">Сегодня: ${today.getDate()} ${MF[today.getMonth()]} ${today.getFullYear()}</div>
    <p>Отметьте машины, у которых срок документа уже истёк. Просрочен — если дата раньше сегодняшней. Просроченных — три.</p>
    <div class="row2"><span class="mg-timer" id="mgT">⏱ ${left} сек</span><button class="buy sm" id="mgDone">Готово</button></div>
    <div class="mg-docs">${docs.map((x,k)=>`<button class="mg-doc" data-k="${k}"><b>${x.plate}</b><span>${x.doc} до ${x.date}</span><small class="ago"></small></button>`).join('')}</div>`);
  document.querySelectorAll('.mg-doc').forEach(b=>b.onclick=()=>{const k=+b.dataset.k;if(sel.has(k)){sel.delete(k);b.classList.remove('on')}else{sel.add(k);b.classList.add('on')}sfx('click')});
  const finish=()=>{mgStop();let hit=0,miss=0,wrong=0;docs.forEach((x,k)=>{if(x.bad&&sel.has(k))hit++;else if(x.bad)miss++;else if(sel.has(k))wrong++});
    document.querySelectorAll('.mg-doc').forEach(b=>{const k=+b.dataset.k;b.disabled=true;if(docs[k].bad){b.classList.add(sel.has(k)?'mg-ok':'mg-bad');b.querySelector('.ago').textContent=`просрочен ${docs[k].ago} дн. назад`}else if(sel.has(k))b.classList.add('mg-bad')});
    const bonus=hit*5-miss*4-wrong*4;sfx(bonus>0?'coin':'bad');
    $('mgDone').textContent='Итог';$('mgDone').onclick=()=>done(bonus,`документы — найдено ${hit} из 3${wrong?`, лишних отметок ${wrong}`:''}`,hit,wrong)};
  $('mgDone').onclick=finish;
  mgTimer=setInterval(()=>{if(paused)return;left--;const t=$('mgT');if(t)t.textContent=`⏱ ${left} сек`;if(left<=0)finish()},1000);
}
function mgTiming(fi,done){
  let tries=0,hits=0,pos=0,dir=1,speed=.6,zone=0,zw=.2,lastT=0,locked=false;
  showModal(`<span class="step">ПРОВЕРКА СЕРВИСА · ПОПЫТКА <span id="mgN">1</span> ИЗ 3</span><h2>Затяните гайку</h2>
    <p>Нажмите кнопку, когда стрелка в зелёной зоне. С каждой попыткой стрелка быстрее.</p>
    <canvas id="mgG" class="mg-gauge" width="120" height="64"></canvas>
    <p class="note" id="mgMsg">Попаданий: 0</p>
    <div class="btns"><button class="btn" id="mgHit">Затянуть! (пробел)</button></div>`);
  const newZone=()=>{zw=Math.max(.1,.22-tries*.04);zone=Math.random()*(1-zw)};
  newZone();
  // циферблат: дуга с зелёной зоной, стрелка-ключ и гайка, которая поворачивается вместе со стрелкой
  const gc=$('mgG'),g=gc.getContext('2d');crisp(gc);const CX=60,CY=58,RR=50;let flash=0,flashOk=true;
  const gauge=()=>{g.fillStyle='#1c1838';g.fillRect(0,0,120,64);
    for(let y=0;y<=CY;y++)for(let x=0;x<120;x++){const dx=x-CX,dy=y-CY,d=Math.hypot(dx,dy);if(d<RR-7||d>RR)continue;const p=(Math.atan2(dy,dx)+Math.PI)/Math.PI;
      const inZ=p>=zone&&p<=zone+zw,tick=Math.abs(p*10-Math.round(p*10))<.04;g.fillStyle=inZ?(d>RR-2?'#b8f0a0':'#86e06f'):tick?'#2a2450':(d>RR-2?'#5a5285':'#4a4570');g.fillRect(x,y,1,1)}
    const an=Math.PI+pos*Math.PI;for(let r=10;r<RR-3;r++){const x=Math.round(CX+Math.cos(an)*r),y=Math.round(CY+Math.sin(an)*r);g.fillStyle=r>RR-9?'#ffe27a':'#c6bfe4';g.fillRect(x,y,r>RR-9?2:1,r>RR-9?2:1)}
    const rot=pos*Math.PI*2,P=[...Array(6)].map((_,i)=>[CX+Math.cos(rot+i*Math.PI/3)*8,CY+Math.sin(rot+i*Math.PI/3)*8]);
    for(let y=CY-9;y<=CY+4;y++)for(let x=CX-9;x<=CX+9;x++){let inside=true;for(let i=0;i<6;i++){const [x1,y1]=P[i],[x2,y2]=P[(i+1)%6];if((x2-x1)*(y-y1)-(y2-y1)*(x-x1)<0){inside=false;break}}
      if(inside){const d=Math.hypot(x-CX,y-CY);g.fillStyle=d<3?'#0e0b1c':d<4?'#5a5285':(y<CY-3?'#e8e2d0':'#a8a0cc');g.fillRect(x,y,1,1)}}
    if(flash>0){g.globalAlpha=flash;g.fillStyle=flashOk?'#86e06f':'#ff4d4d';g.fillRect(0,0,120,64);g.globalAlpha=1}};
  const frame=ts=>{const dt=lastT?(ts-lastT)/1000:0;lastT=ts;if(!locked){pos+=dir*speed*dt;if(pos>1){pos=1;dir=-1}if(pos<0){pos=0;dir=1}}flash=Math.max(0,flash-dt*1.5);gauge();mgRaf=mgRAF(frame)};
  mgRaf=mgRAF(frame);
  const hit=()=>{if(locked||tries>=3)return;locked=true;const ok=pos>=zone&&pos<=zone+zw;tries++;if(ok)hits++;sfx(ok?'coin':'bad');flash=.45;flashOk=ok;
    $('mgMsg').innerHTML=`${ok?'<span class="pos">Точно!</span>':'<span class="neg">Сорвал резьбу!</span>'} Попаданий: ${hits}`;
    if(tries>=3){mgStop();flash=0;gauge();const b=$('mgHit');b.textContent='Итог';b.onclick=()=>done(hits*6-(3-hits)*3,`гайки — точных попаданий ${hits} из 3`);b.focus();return}
    setTimeout(()=>{speed+=.35;newZone();$('mgN').textContent=tries+1;locked=false},700)};
  $('mgHit').onclick=hit;$('mgHit').focus();
  mgKey=e=>{if(e.code==='Space'){e.preventDefault();hit()}};document.addEventListener('keydown',mgKey);
}
const MINIGAMES=[mgQuiz,mgDocs,mgTiming];
function rivalEvent(){
  S.nextRival=S.day+rand(5,9);save();
  const R=S.rivals[rand(0,S.rivals.length-1)];
  const opts={war:['war','sale'],poach:['poach','poach','sale'],prem:['vip','vip','sale'],calm:['sale','poach']}[R.style]||['sale'];
  if(totalCars()>R.cars+3)opts.push('buyout');
  const k=opts[Math.random()*opts.length|0];
  let body,btns;
  if(k==='poach'){const n=Math.min(3,Math.max(1,S.drivers>>2)),cost=n*6000;
    body=`«${esc(R.name)}» обещает вашим водителям золотые горы. ${n} вод. уже собирают вещи.`;
    btns=[[`Удержать (−${rub(cost)})`,()=>{S.money-=cost;S.dlist.forEach(d=>d.loy=Math.min(100,d.loy+5));return'Водители остались и стали лояльнее.'}],['Отпустить',()=>{S.drivers=Math.max(0,S.drivers-n);R.cars++;return`${n} вод. ушли к конкуренту.`}]]}
  else if(k==='sale'){body=`«${esc(R.name)}» распродаёт три б/у Kia Rio за 160 000 ₽ все сразу. Обычная цена — 240 000 ₽.`;
    btns=[['Купить три Rio (−160 000 ₽)',()=>{if(S.money<160000)return'Не хватило денег. Машины ушли другому.';if(carsN()+3>S.spots)return'Некуда ставить: стоянка заполнена.';S.money-=160000;for(let i=0;i<3;i++)addCar('rio');R.cars=Math.max(3,R.cars-3);S.cnt.bought=(S.cnt.bought||0)+1;return'Три Kia Rio теперь ваши.'}],['Отказаться',()=>'Конкурент продал машины кому-то ещё.']]}
  else if(k==='war'){body=`«${esc(R.name)}» начал ценовую войну: возит пассажиров почти даром.`;
    btns=[['Ответить скидками (спрос −10% на 5 дней)',()=>{S.news.push({id:'war',t:'Ценовая война',d:'выручка −10%',demand:.9,days:5});R.cars=Math.max(3,R.cars-2);R.rep-=3;return'Вы ответили. Конкурент потерял пару машин.'}],['Игнорировать',()=>{S.rep=Math.max(0,S.rep-4);R.cars+=2;return'Часть пассажиров ушла к конкуренту. −4 к репутации.'}]]}
  else if(k==='vip'){body=`«${esc(R.name)}» переманивает ваших бизнес-клиентов: обещает только новые машины и воду в салоне.`;
    btns=[['Рекламная кампания (−20 000 ₽)',()=>{S.money-=20000;S.rep=Math.min(100,S.rep+2);R.rep-=4;return'Клиенты остались с вами. Конкурент недоволен.'}],['Не реагировать',()=>{S.news.push({id:'vipl',t:'Клиенты ушли к конкуренту',d:'выручка −7%',demand:.93,days:4});R.rep+=3;return'Часть бизнес-клиентов ушла на несколько дней.'}]]}
  else{const price=R.cars*55000;body=`Владелец «${esc(R.name)}» устал и предлагает продать вам весь парк: ${R.cars} машин, водителей и стоянку за ${rub(price)}.`;
    btns=[[`Выкупить (−${rub(price)})`,()=>{if(S.money<price)return'Не хватает денег. Сделка сорвалась.';S.money-=price;for(let i=0;i<R.cars;i++)addCar(Math.random()<.5?'granta':'solaris');S.spots+=R.cars;S.drivers+=Math.round(R.cars*.7);S.cnt.rival=1;
      const old=R.name,used=S.rivals.map(r=>r.name),nn=RIVAL_POOL.find(x=>!used.includes(x))||'Новичок';const st=['war','poach','prem','calm'][rand(0,3)];
      Object.assign(R,{name:nn,style:st,cars:6,rep:55,aggr:0});return`«${old}» теперь часть «ДСТ-24»! На рынке появился новый конкурент — «${nn}».`}],['Отказаться',()=>'Конкурент обиделся, но работает дальше.']]}
  showModal(`<span class="step">КОНКУРЕНТ · «${esc(R.name.toUpperCase())}» · ${R.cars} МАШИН · ${RIVAL_STYLES[R.style]}</span><h2>Ход конкурента</h2><p>${body}</p>
    <div class="modes">${btns.map((b,i)=>`<button class="mode" id="rv${i}"><b>${b[0].toUpperCase()}</b></button>`).join('')}</div>`);
  sfx('alert');
  btns.forEach((b,i)=>$('rv'+i).onclick=()=>{const before=snap();const msg=b[1]();addLog('Конкурент: '+msg);
    showModal(`<h2>Конкурент</h2><p>${msg}</p><button class="btn" id="rvOk">Продолжить</button>`);$('rvOk').onclick=()=>{hideModal();runMorning()};save();render(before)});
}

/* ---- собрание учредителей ---- */
function meeting(){
  const per=bal('meet'),perTxt=per===30?'месяц':`${per} дней`;S.nextMeeting=S.day+per;save();
  let kpiMsg='';
  if(S.kpi){const ok=S.kpi.acc>=S.kpi.rev;
    if(ok){const b=Math.round(S.kpi.rev*.05*(ownHas('watch')?1.1:1)/1000)*1000;S.money+=b;S.rep=Math.min(100,S.rep+2);S.kpiStreak=(S.kpiStreak||0)+1;S.kpiFails=0;S.cnt.kpi=(S.cnt.kpi||0)+1;kpiMsg=`<p class="pos">План выполнен: ${rub(S.kpi.acc)} из ${rub(S.kpi.rev)}. Премия ${rub(b)} и +2 к репутации.</p>`}
    else{const f=Math.round(S.kpi.rev*.03/1000)*1000;S.money-=f;S.rep=Math.max(0,S.rep-3);S.kpiStreak=0;S.kpiFails=(S.kpiFails||0)+1;kpiMsg=`<p class="neg">План провален: ${rub(S.kpi.acc)} из ${rub(S.kpi.rev)}. Штраф ${rub(f)} и −3 к репутации.${S.kpiFails>=2?' Второй провал подряд — учредители требуют перемен!':''}</p>`}}
  const last30=S.stat.slice(-per),rev30=last30.reduce((a,x)=>a+x.rev,0);
  S.kpi={rev:Math.max(Math.round(bal('plan')*inf()/1000)*1000,Math.round(rev30*1.08/1000)*1000),acc:0,from:S.day};
  kpiMsg+=`<p class="note">Новый план на ${perTxt}: выручка ${rub(S.kpi.rev)}.</p>`;
  S._kpiMsg=kpiMsg;
  const votes={};FOUNDERS.forEach((F,i)=>{const v=Math.random()<.25?'prem':FOCUS_STRAT[F.focus];(votes[v]=votes[v]||[]).push(i)});
  const best=[...S.dlist].sort((a,b)=>b.r-a.r)[0];
  showModal(`<span class="step">СОБРАНИЕ УЧРЕДИТЕЛЕЙ · ДЕНЬ ${S.day}</span><h2>Стратегия на ${perTxt}</h2>
    ${S._kpiMsg||''}<p>Учредители проголосовали. Решающий голос — ваш. Стратегия действует ${per} дн.</p>
    <div class="modes">${Object.entries(STRATS).map(([k,v])=>`<button class="mode" id="st_${k}"><b>${v.n.toUpperCase()}</b><span>${v.d}</span>
      <span class="votes">${(votes[k]||[]).map(i=>`<canvas class="face" width="16" height="16" data-face="founder:${i}" title="${esc(fName(i))}"></canvas>`).join('')||'<small>голосов нет</small>'}</span></button>`).join('')}</div>
    ${best?`<p class="note">Лучший водитель месяца по рейтингу: ${esc(best.n)} (★${best.r.toFixed(2)}). Наградить его можно во вкладке «Водители».</p>`:''}`);
  drawFaces();sfx('alert');
  Object.keys(STRATS).forEach(k=>$('st_'+k).onclick=()=>{const n=(votes[k]||[]).length;S.strategy={id:k,until:S.day+per};
    let msg=`Стратегия «${STRATS[k].n}» принята.`;
    const last30=S.stat.slice(-30),avgNet=last30.length?last30.reduce((a,x)=>a+x.net,0)/last30.length:0;
    if(invShare()&&avgNet<0){S.rep=Math.max(0,S.rep-3);msg+=' Инвесторы недовольны убытками: −3 к репутации.'}
    if(n>=2){S.rep=Math.min(100,S.rep+2);msg+=' Учредители единодушны: +2 к репутации.'}
    else if(n===0){S.angry=1;msg+=' Вы пошли против всех учредителей: на следующей проверке будут придираться.'}
    addLog('Собрание: '+msg);save();render();
    const force=S.kpiFails>=2;if(force)S.kpiFails=0;
    showModal(`<h2>Собрание</h2><p>${msg}</p>${force?'<p class="neg">Учредители требуют сменить одного из начальников.</p>':''}<button class="btn" id="stOk">Продолжить</button>`);$('stOk').onclick=()=>{if(force)pickHead(rand(0,2),()=>runMorning(),false);else{hideModal();runMorning()}}});
}

/* ---- налоговая проверка ---- */
function taxAudit(){
  S.nextTax=S.day+rand(40,60);save();
  showModal(`<span class="step">НАЛОГОВАЯ ПРОВЕРКА</span><h2>Пришли инспекторы</h2>
    <p>Налоговая проверяет документы парка за полгода: путевые листы, договоры с водителями, кассу. Штраф при нарушениях — 60 000 ₽.</p>
    <div class="modes"><button class="mode" id="txSelf"><b>ОТКРЫТЬ ВСЕ ДОКУМЕНТЫ</b><span>Шанс пройти зависит от порядка в автопарке и офиса.</span></button>
    <button class="mode" id="txPro"><b>НАНЯТЬ КОНСУЛЬТАНТА (−25 000 ₽)</b><span>Почти наверняка без штрафа.</span></button></div>`);
  sfx('alert');
  const res=pro=>{let p=pro?.92:Math.max(.25,Math.min(.95,.95-rm(1)*.35+(S.upg.office?.1:0)+(hasHead('yurist')?.25:0)));if(pro)S.money-=25000;const before=snap();
    const ok=Math.random()<p;let msg;if(ok){S.cnt.taxOk=(S.cnt.taxOk||0)+1;msg='Проверка прошла без нарушений. Инспекторы уехали довольные.'}
    else{S.money-=60000;S.rep=Math.max(0,S.rep-2);msg='Нашли нарушения в путевых листах. Штраф 60 000 ₽.'}
    addLog('Налоговая: '+msg);save();render(before);sfx(ok?'win':'bad');
    showModal(`<h2 class="${ok?'pos':'neg'}">${ok?'Без нарушений':'Штраф'}</h2><p>${msg}</p><button class="btn" id="txOk">Продолжить</button>`);$('txOk').onclick=()=>{hideModal();runMorning()}};
  $('txSelf').onclick=()=>res(false);$('txPro').onclick=()=>res(true);
}

/* ---- рейды ГАИ ---- */
function raidEvent(){
  S.nextRaid=S.day+rand(14,22);save();
  const cost=carsN()*400;
  showModal(`<span class="step">ГАИ</span><h2>Рейды на такси</h2>
    <p>ГАИ объявила рейды на такси на ближайшие 3 дня: проверяют ОСАГО, диагностические карты, разрешения и самих водителей. За каждое нарушение — штраф 5 000 ₽ и потерянная смена.</p>
    <div class="modes"><button class="mode" id="rdGame"><b>ПРОВЕРИТЬ ДОКУМЕНТЫ САМИМ</b><span>Мини-игра: найдите просроченные документы. Чем точнее — тем меньше штрафов.</span></button>
    <button class="mode" id="rdPay"><b>СРОЧНЫЙ ТЕХОСМОТР ВСЕХ МАШИН (−${rub(cost)})</b><span>Почти все машины будут чистыми.</span></button>
    <button class="mode" id="rdNone"><b>РАБОТАТЬ КАК ЕСТЬ</b><span>Рискнуть.</span></button></div>`);
  sfx('alert');
  const start=(prep,msg)=>{triggerScene('police');sfx('siren');S.raid={days:3,prep,fines:0};S.news.push({id:'raidgai',t:'Рейды ГАИ',d:'проверки такси',days:3});addLog('ГАИ: '+msg);save();render();
    showModal(`<h2>Рейды ГАИ</h2><p>${msg}</p><button class="btn" id="rdOk">Продолжить</button>`);$('rdOk').onclick=()=>{hideModal();runMorning()}};
  $('rdGame').onclick=()=>mgDocs(0,(b,sum,hit,wrong)=>{mgStop();const prep=Math.max(0,Math.min(.9,(hit||0)/3*.9-(wrong||0)*.1));start(prep,`Вы проверили документы: ${sum}. Подготовка к рейду — ${Math.round(prep*100)}%.`)});
  $('rdPay').onclick=()=>{S.money-=cost;start(.85,`Все машины прошли техосмотр за ${rub(cost)}. Подготовка — 85%.`)};
  $('rdNone').onclick=()=>start(0,'Работаем как есть. Удачи на дорогах.');
}

/* ---- филиалы ---- */
function openBranch(){
  if(S.rank<3){toast('Филиалы откроются на звании «Владелец сети»');return}
  const site=branchSite(S.branches.length);if(S.money<site.price){toast('Не хватает денег в кассе');sfx('bad');return}
  const before=snap();S.money-=site.price;S.branches.push({n:site.n,cars:3,drivers:3,mgr:1,bonus:site.bonus,last:0});
  addLog(`Открыт филиал «${site.n}»: 3 машины и 3 водителя.`);toast(`Филиал «${site.n}» открыт!`);sfx('win');save();render(before);
}
function branchAct(i,a){const b=S.branches[i];if(!b||S.over)return;const before=snap();
  if(a==='car'){if(S.money<75000){toast('Не хватает денег');return}S.money-=75000;b.cars++;toast(`«${b.n}»: +1 машина`)}
  if(a==='hire'){if(S.money<6000){toast('Не хватает денег');return}S.money-=6000;const n=Math.random()<.7?(Math.random()<.3?2:1):0;b.drivers+=n;toast(n?`«${b.n}»: +${n} вод.`:'Никто не откликнулся')}
  if(a==='mgr'){const c=40000*b.mgr;if(b.mgr>=3)return;if(S.money<c){toast('Не хватает денег');return}S.money-=c;b.mgr++;toast(`«${b.n}»: директор филиала прошёл обучение`)}
  sfx('coin');save();render(before)}
function branchEvent(){
  const b=S.branches[rand(0,S.branches.length-1)];
  const E=[
   {x:`В филиале «${b.n}» затопило гараж после ливня.`,o:[['Откачать и просушить (−20 000 ₽)',()=>{S.money-=20000;return'Гараж высушили за день.'}],['Подождать',()=>{b.cars=Math.max(0,b.cars-1);return'Одна машина утонула в луже по самые пороги. Списана.'}]]},
   {x:`Водители филиала «${b.n}» грозят забастовкой: хотят премию к праздникам.`,o:[['Выплатить премию (−15 000 ₽)',()=>{S.money-=15000;return'Забастовки не будет. Водители довольны.'}],['Отказать',()=>{b.drivers=Math.max(0,b.drivers-2);return'Двое водителей филиала ушли.'}]]},
   {x:`Филиал «${b.n}» перевыполнил план. Директор просит отметить успех.`,o:[['Корпоратив (−8 000 ₽)',()=>{S.money-=8000;S.rep=Math.min(100,S.rep+2);b.mgr=Math.min(3,b.mgr+(Math.random()<.3?1:0));return'Отметили. Команда филиала заряжена.'}],['Ограничиться грамотой',()=>'Грамоту повесили на стену. Скромно, но приятно.']]},
   {x:`В филиале «${b.n}» кто-то из сотрудников сливал бензин из машин.`,o:[['Поставить камеры (−12 000 ₽)',()=>{S.money-=12000;return'Камеры поймали виновника. Больше не сливают.'}],['Разобраться без камер',()=>Math.random()<.5?'Виновника нашли сами.':(S.money-=15000,'Не нашли. Слив продолжался ещё неделю: −15 000 ₽.')]]}][rand(0,3)];
  showModal(`<span class="step">ФИЛИАЛ «${esc(b.n.toUpperCase())}»</span><h2>Новости филиала</h2><p>${E.x}</p>
    <div class="modes">${E.o.map((o,i)=>`<button class="mode" id="bo${i}"><b>${o[0].toUpperCase()}</b></button>`).join('')}</div>`);
  sfx('alert');
  E.o.forEach((o,i)=>$('bo'+i).onclick=()=>{const before=snap();const msg=o[1]();addLog(`Филиал «${b.n}»: ${msg}`);save();render(before);
    showModal(`<h2>Филиал «${esc(b.n)}»</h2><p>${msg}</p><button class="btn" id="boOk">Продолжить</button>`);$('boOk').onclick=()=>{hideModal();runMorning()}});
}

/* ---- водители: действия ---- */
function drvAct(id,a){const d=S.dlist.find(x=>x.id===id);if(!d||S.over)return;const before=snap();
  if(a==='prem'){if(S.money<3000){toast('Не хватает денег');return}S.money-=3000;d.loy=Math.min(100,d.loy+15);d.r=Math.min(5,+(d.r+.02).toFixed(3));toast(`${d.n} получил премию`);sfx('coin')}
  if(a==='talk'){if(d.talked===S.day){toast('Уже говорили сегодня');return}d.talked=S.day;d.loy=Math.min(100,d.loy+6);toast(`Поговорили с ${d.n}`);sfx('click')}
  if(a==='fire'){if(d.fireArm!==S.day){d.fireArm=S.day;toast(`Нажмите «Уволить» ещё раз, чтобы уволить ${d.n}`);render();return}
    S.dlist=S.dlist.filter(x=>x!==d);S.drivers=S.dlist.length;S.dlist.forEach(x=>x.loy=Math.max(0,x.loy-3));addLog(`Уволен водитель ${d.n}.`);toast(`${d.n} уволен`);sfx('bad')}
  if(a==='month'){if(S.day-S.lastMonth<30){toast('Водителя месяца можно выбрать раз в 30 дней');return}if(S.money<5000){toast('Не хватает денег');return}
    S.money-=5000;S.lastMonth=S.day;d.loy=100;d.r=Math.min(5,+(d.r+.05).toFixed(3));S.rep=Math.min(100,S.rep+2);S.cnt.month=(S.cnt.month||0)+1;
    addLog(`Водитель месяца — ${d.n}! Премия 5 000 ₽, +2 к репутации.`);toast(`★ Водитель месяца: ${d.n}`);sfx('win')}
  save();render(before)}

/* ---- мини-игры на линии ---- */
/* ---- машина сверху для мини-игр: 14×16, перёд вверху ---- */
const TOPCAR=[
"..kkkkkkkkkk..",
".khyyyyyyyyhk.",
".kyyyyyyyyyyk.",
"okyyyyyyyyyyko",
"okyWwwwwwwwyko",
"okywwwwwwwwyko",
".kylllttlllyk.",
".kyllllllllyk.",
".kyllllllllyk.",
".kynnnnnnnnyk.",
".kyyyyyyyyyyk.",
"okyyyyyyyyyyko",
"okyyyyyyyyyyko",
"okyyyyyyyyyyko",
".krryyyyyyrrk.",
"..kkkkkkkkkk.."];
const topPal=(c,taxi)=>({y:c,l:shade(c,1.18),k:'#1a1530',h:'#fff6a8',r:'#ff4d4d',W:'#e8f6ff',w:'#9fd3ff',n:'#3a4a78',t:taxi?'#fff6a8':shade(c,1.18),o:'#0e0b1c'});
/* поворот на 90°: перёд смотрит влево */
function sprRot(g,s,x,y,pal){const n=s[0].length;for(let r=0;r<s.length;r++)for(let c=0;c<n;c++){const ch=s[r][c];if(ch==='.')continue;g.fillStyle=pal[ch]||PAL[ch];g.fillRect(x+r,y+n-1-c,1,1)}}
function lgRace(cb){
  showModal(`<span class="step">МИНИ-ИГРА · VIP В АЭРОПОРТ</span><h2>Довезите за 20 секунд</h2>
    <p>Уворачивайтесь от машин. Три столкновения — и клиент опоздал. Стрелки ← → или кнопки.</p>
    <canvas id="lgC" class="lg-canvas" width="80" height="90"></canvas>
    <div class="row2"><span class="mg-timer" id="lgInfo"></span></div>
    <div class="btns"><button class="btn" id="lgL">◀</button><button class="btn" id="lgR">▶</button></div>`);
  const cv2=$('lgC'),g=cv2.getContext('2d');crisp(cv2);let lane=1,obs=[],t=0,last=0,spawn=.6,lives=3,hitT=0,fin=false,dist=0,sparks=[];
  const LX=[13,33,53],night=sceneDark>.5,me=topPal('#f7c331',1);const move=dx=>{lane=Math.max(0,Math.min(2,lane+dx))};
  $('lgL').onclick=()=>move(-1);$('lgR').onclick=()=>move(1);
  cv2.onpointerdown=e=>{const r=cv2.getBoundingClientRect();move(e.clientX-r.left<r.width/2?-1:1)};
  mgKey=e=>{if(e.code==='ArrowLeft'){e.preventDefault();move(-1)}if(e.code==='ArrowRight'){e.preventDefault();move(1)}};document.addEventListener('keydown',mgKey);
  const F=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)};
  const add=(fn)=>{g.globalCompositeOperation='lighter';fn();g.globalCompositeOperation='source-over'};
  const frame=ts=>{const dt=last?Math.min(.05,(ts-last)/1000):0;last=ts;t+=dt;const sp=45+t*3.2;dist+=sp*dt;
    spawn-=dt;if(spawn<=0){spawn=Math.max(.32,.85-t*.025);obs.push({l:rand(0,2),y:-18,p:topPal(['#e66fa8','#4fc7b0','#ff8a4c','#d9dde8','#4a88c8'][rand(0,4)])})}
    obs.forEach(o=>o.y+=sp*dt);
    obs=obs.filter(o=>{if(o.l===lane&&o.y>56&&o.y<86){lives--;hitT=.5;sfx('bad');for(let i=0;i<10;i++)sparks.push({x:LX[lane]+7,y:70,vx:(Math.random()-.5)*60,vy:-Math.random()*50,l:.4});return false}return o.y<95});
    hitT=Math.max(0,hitT-dt);
    const shake=hitT>0?Math.round(Math.sin(t*90)*hitT*4):0;g.save();g.translate(shake,0);
    // обочины с деревьями и фонарями
    F(-4,0,14,90,night?'#1a3324':'#2e5a3a');F(70,0,14,90,night?'#1a3324':'#2e5a3a');
    for(let i=0;i<5;i++){const y=(i*24+dist*.9)%120-18;F(3,y+6,2,4,'#5a3a20');F(1,y,6,6,night?'#24603a':'#3a9a5a');F(2,y+1,3,2,night?'#2e7a44':'#5ab06a');
      const ly=(i*24+12+dist*.9)%120-18;F(74,ly,1,9,'#8a83b0');F(72,ly,3,1,'#8a83b0');F(72,ly+1,2,1,night?'#fff6a8':'#c6bfe4');
      if(night)add(()=>{for(let k=1;k<4;k++){g.fillStyle=`rgba(255,240,170,${.12/k})`;g.fillRect(72-k*3,ly+1,3+k*5,3+k*4)}})}
    // дорога, бордюры, разметка
    F(10,0,60,90,night?'#1e1c30':'#2a2740');
    for(let i=0;i<14;i++)F(12+(i*29)%56,(i*37+dist)%96-3,1,1,night?'#28263c':'#33304a');
    for(let y=-(dist%8)-8;y<90;y+=8){F(9,y,1,4,'#e8e2d0');F(70,y,1,4,'#e8e2d0');F(9,y+4,1,4,'#ff4d4d');F(70,y+4,1,4,'#ff4d4d')}
    for(let y=-(dist%12);y<90;y+=12){F(30,y,1,6,'#f7c331');F(50,y,1,6,'#f7c331')}
    // финиш: клетчатая линия подъезжает к машине ровно к 20-й секунде, над ней пролетает самолёт
    const fy=70-(20-t)*sp;if(fy>-6&&fy<90)for(let x=10;x<70;x+=3){F(x,fy,3,2,(x/3|0)%2?'#f3ecdc':'#0e0b1c');F(x,fy+2,3,2,(x/3|0)%2?'#0e0b1c':'#f3ecdc')}
    if(t>14){const px=-14+(t-14)/6*100;F(px,8,11,2,'#e8eef8');F(px+3,5,3,8,'#e8eef8');F(px+9,6,2,2,'#e8eef8');F(px,7,1,1,'#ff4d4d')}
    // машины: тень, затем спрайт
    obs.forEach(o=>{g.globalAlpha=.35;F(LX[o.l]+2,o.y+2,14,16,'#0e0b1c');g.globalAlpha=1;spr(g,TOPCAR,LX[o.l],o.y,false,o.p);
      if(night)add(()=>{g.fillStyle='rgba(255,60,60,.25)';g.fillRect(LX[o.l]+1,o.y+15,4,3);g.fillRect(LX[o.l]+9,o.y+15,4,3)})});
    if(night)add(()=>{for(let k=0;k<6;k++){g.fillStyle=`rgba(255,240,180,${(.12-k*.017).toFixed(3)})`;g.fillRect(LX[lane]+2-k,70-4-k*5,10+k*2,5)}});
    if(!(hitT>0&&((t*20)|0)%2)){g.globalAlpha=.35;F(LX[lane]+2,72,14,16,'#0e0b1c');g.globalAlpha=1;spr(g,TOPCAR,LX[lane],70,false,me)}
    sparks=sparks.filter(p=>{p.l-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=120*dt;F(p.x,p.y,1,1,p.l>.2?'#fff6a8':'#ff8a4c');return p.l>0});
    if(hitT>.3){g.fillStyle=`rgba(255,77,77,${((hitT-.3)*1.5).toFixed(2)})`;g.fillRect(-4,0,88,90)}
    g.restore();
    const left=Math.max(0,20-t);$('lgInfo').textContent=`⏱ ${left.toFixed(1)} сек · ♥ ${'■'.repeat(Math.max(0,lives))}`;
    if(lives<=0||t>=20){if(fin)return;fin=true;mgStop();const ok=lives>0;sfx(ok?'win':'bad');
      $('lgInfo').innerHTML=ok?'<span class="pos">Успели!</span>':'<span class="neg">Опоздали…</span>';
      const b=$('lgR');b.textContent='Итог';b.onclick=()=>{hideModal();cb(ok)};$('lgL').hidden=true;return}
    mgRaf=mgRAF(frame)};
  mgRaf=mgRAF(frame);
}
function lgPark(cb){
  let pos=0,speed=.42,tries=0,hits=0,go=true,last=0;const slot=.55+Math.random()*.3,sw=.09;
  showModal(`<span class="step">МИНИ-ИГРА · ПАРКОВКА</span><h2>Встаньте точно в место</h2>
    <p>Машина сдаёт назад. Нажмите «Стоп», когда она точно напротив свободного места. Две попытки, нужна одна точная.</p>
    <canvas id="pkC" class="mg-gauge" width="128" height="48"></canvas>
    <p class="note" id="pkMsg">Попытка 1 из 2</p><div class="btns"><button class="btn" id="pkStop">Стоп! (пробел)</button></div>`);
  // стоянка сверху: ряд мест с машинами, одно свободно; зелёные метки на бордюре — точная зона
  const gc=$('pkC'),g=gc.getContext('2d');crisp(gc);const X=v=>8+v*112,me=topPal('#f7c331',1);
  const tc=X(slot+sw/2),cols=['#e66fa8','#4fc7b0','#ff8a4c','#d9dde8','#4a88c8','#86c4e0'];
  const spots=[];for(let x=tc-9-18*8;x<130;x+=18)if(x+18>0)spots.push(x);
  const F=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)};
  const draw=()=>{F(0,0,128,48,'#2a2740');for(let i=0;i<20;i++)F((i*37)%128,(i*17)%48,1,1,'#33304a');
    spots.forEach((x,i)=>{F(x,1,1,19,'#d8d0e8');const free=Math.abs(x+9-tc)<1;if(free){g.globalAlpha=.25;F(x+1,1,17,19,'#86e06f');g.globalAlpha=1;F(x+6,6,6,8,'#86e06f');F(x+7,7,4,6,'#2a2740');F(x+7,7,3,3,'#86e06f')}
      else{g.globalAlpha=.35;F(x+3,4,14,16,'#0e0b1c');g.globalAlpha=1;spr(g,TOPCAR,x+2,2,false,topPal(cols[i%cols.length]))}});
    F(0,21,128,2,'#8a83b0');F(X(slot),21,Math.max(1,Math.round(sw*112)),2,'#86e06f');
    for(let x=-((pos*112)%8);x<128;x+=8)F(x,35,4,1,'#f7c33188');
    const cx=X(pos)-8;g.globalAlpha=.35;F(cx+2,28,16,14,'#0e0b1c');g.globalAlpha=1;sprRot(g,TOPCAR,cx,26,me);
    if(go&&(Date.now()>>7)%2){F(cx+15,28,2,2,'#f3ecdc');F(cx+15,36,2,2,'#f3ecdc')}
    F(X(pos),24,1,2,'#ffe27a')};
  const frame=ts=>{const dt=last?(ts-last)/1000:0;last=ts;if(go){pos+=speed*dt;if(pos>=1){pos=1;stop()}}draw();mgRaf=mgRAF(frame)};
  const stop=()=>{if(!go)return;go=false;tries++;const ok=pos>=slot&&pos<=slot+sw;if(ok)hits++;sfx(ok?'coin':'bad');draw();
    $('pkMsg').innerHTML=ok?'<span class="pos">Идеально в разметку!</span>':'<span class="neg">Мимо!</span>';
    if(hits||tries>=2){mgStop();draw();const b=$('pkStop');b.textContent='Итог';b.onclick=()=>{hideModal();cb(hits>0)};return}
    setTimeout(()=>{pos=0;speed+=.12;last=0;go=true;$('pkMsg').textContent='Попытка 2 из 2'},700)};
  $('pkStop').onclick=stop;mgKey=e=>{if(e.code==='Space'){e.preventDefault();stop()}};document.addEventListener('keydown',mgKey);
  mgRaf=mgRAF(frame);
}
const DASH=[
 {f:['10:02:11 — такси стоит у обочины, двигатель заглушен','10:02:30 — пассажир открывает заднюю дверь, не глядя назад','10:02:31 — мимо проезжает самокат и цепляет дверь'],a:['Пассажир: открыл дверь, не посмотрев','Водитель такси: встал не там','Самокатчик: ехал по тротуару']},
 {f:['18:40:02 — такси перестраивается с включённым поворотником','18:40:04 — соседняя машина резко ускоряется','18:40:05 — касание зеркалами'],a:['Водитель соседней машины: ускорился и не пропустил','Водитель такси: перестраивался','Никто: зеркала сами сложились']},
 {f:['07:15:40 — пассажир просит остановить «прямо здесь» под знаком','07:15:44 — водитель отвечает, что здесь нельзя, и едет дальше','07:16:10 — пассажир пишет жалобу «не остановил»'],a:['Водитель прав: остановка под знаком запрещена','Пассажир прав: надо было остановиться','Оба неправы']}];
function lgDash(cb){const D=DASH[rand(0,DASH.length-1)],ans=shuffle(D.a.map((t,k)=>({t,k})));
  showModal(`<span class="step">МИНИ-ИГРА · ЗАПИСЬ РЕГИСТРАТОРА</span><h2>Кто виноват?</h2>
    <div class="dash">${D.f.map(x=>`<p>▶ ${x}</p>`).join('')}</div>
    <div class="modes">${ans.map((a,j)=>`<button class="mode" id="ds${j}"><span style="color:var(--ink)">${a.t}</span></button>`).join('')}</div><p class="note" id="dsMsg"></p>`);
  let done=false;ans.forEach((a,j)=>$('ds'+j).onclick=()=>{if(done)return;done=true;const ok=a.k===0;sfx(ok?'win':'bad');$('ds'+j).classList.add(ok?'mg-ok':'mg-bad');
    $('dsMsg').innerHTML=ok?'<span class="pos">Верно, запись это подтверждает.</span>':`<span class="neg">Нет. Правильно: ${D.a[0]}.</span>`;
    const nb=document.createElement('button');nb.className='btn';nb.textContent='Итог';nb.onclick=()=>{hideModal();cb(ok)};$('dsMsg').after(nb);nb.focus()})}
const LINE_GAMES={race:lgRace,park:lgPark,dash:lgDash};

/* ---- газета «Вестник» ---- */
function newspaper(){
  const w=S.wk,best=[...S.dlist].sort((a,b)=>b.r-a.r)[0],top=[...S.rivals].sort((a,b)=>b.cars-a.cars)[0],fail=w.fails.length?w.fails[rand(0,w.fails.length-1)]:'Провалов не было. Подозрительно.';
  const wt=S.weather.map(k=>WEATHER[k].n.toLowerCase()).join(', ');
  showModal(`<div class="paper"><div class="paper-head">ВЕСТНИК «${esc(parkName().toUpperCase())}»</div><div class="paper-sub">Еженедельная газета таксопарка · выпуск №${Math.floor(S.day/7)} · ${dateOf(S.day).toLocaleDateString('ru-RU')}</div>
    <h3>${w.net>=0?'Парк в плюсе':'Тяжёлая неделя'}: ${w.net>=0?'+':''}${rub(w.net)} за неделю</h3>
    <p>Выручка — ${rub(w.rev)}, ночных поломок — ${w.breaks}, штрафов на ${rub(w.fines)}. Машин в сети: ${totalCars()}.</p>
    ${best?`<h3>Водитель недели</h3><p>${esc(best.n)} с рейтингом ★${best.r.toFixed(2)}. Характер — «${TRAITS[best.t].n.toLowerCase()}».</p>`:''}
    ${w.strike?`<h3>Забастовка в парке</h3><p>Водители бастовали ${w.strike.days} дн. Парк упустил около ${rub(w.strike.lost)} выручки.</p>`:''}
    <h3>Провал недели</h3><p>${fail}</p>
    ${Object.keys(S.owned).length?`<h3>Светская хроника</h3><p>Владелец парка замечен ${['с новыми золотыми часами','у своей новой машины','на даче у озера','на палубе яхты'][rand(0,3)]}. Водители обсуждают.</p>`:''}
    ${S.crisis?`<h3>Кризис</h3><p>${CRISES[S.crisis.id].n}: ещё ${S.crisis.days} дн. Держимся!</p>`:''}
    <h3>Конкуренты</h3><p>«${esc(top.name)}» вырос до ${top.cars} машин. ${top.cars>totalCars()?'Пора догонять!':'Но мы всё равно больше.'}</p>
    <h3>Рубрика «Гена недели»</h3><p>${GENA_LINES[rand(0,GENA_LINES.length-1)]}</p>
    <h3>Прогноз погоды</h3><p>На три дня: ${wt}.</p></div>
    <button class="btn" id="ppOk">Отложить газету</button>`);
  sfx('alert');S.wk={rev:0,net:0,breaks:0,fines:0,fails:[]};save();$('ppOk').onclick=()=>{hideModal();runMorning()};
}
/* ---- профсоюз ---- */
function unionEvent(){
  S.nextUnion=S.day+5;save();const pay=S.drivers*1500;
  showModal(`<span class="step">ПРОФСОЮЗ ВОДИТЕЛЕЙ</span><h2>Требования профсоюза</h2><p>Профсоюз требует улучшить условия. Если отказать — забастовка на два дня.</p>
    <div class="modes"><button class="mode" id="unRent"><b>СНИЗИТЬ ВСЕ СТАВКИ НА 5%</b><span>Водители платят меньше, лояльность +15.</span></button>
    <button class="mode" id="unPay"><b>ПРЕМИЯ ВСЕМ (−${rub(pay)})</b><span>Разовая выплата, лояльность +12.</span></button>
    <button class="mode" id="unNo"><b>ОТКАЗАТЬ</b><span>Забастовка: спрос −45% на 2 дня, лояльность −5.</span></button></div>`);
  sfx('alert');
  const fin=msg=>{addLog('Профсоюз: '+msg);save();render();showModal(`<h2>Профсоюз</h2><p>${msg}</p><button class="btn" id="unOk">Продолжить</button>`);$('unOk').onclick=()=>{hideModal();runMorning()}};
  $('unRent').onclick=()=>{CLASSES.forEach(c=>S.rents[c]=Math.round(S.rents[c]*.95/100)*100);apply({loy:15});fin('Ставки снижены на 5%. Водители довольны.')};
  $('unPay').onclick=()=>{S.money-=pay;apply({loy:12});fin('Премия выплачена. Профсоюз доволен.')};
  $('unNo').onclick=()=>{S.news=S.news.filter(n=>n.id!=='strike');S.news.push({id:'strike',t:'Забастовка водителей',d:'спрос −45%',demand:.55,days:2});strikeBegins();apply({loy:-5});fin('Водители бастуют. Два дня парк почти не работает.')};
}
/* ---- аукцион конфиската ---- */
function auction(){
  S.nextAuction=S.day+7;
  const lots=[0,1,2].map(()=>{const m=AUCTION_MODELS[rand(0,AUCTION_MODELS.length-1)],M=MODELS[m],bad=Math.random()<.35;
    return{m,km:M.km0+rand(bad?90000:-30000,bad?200000:40000),bad,price:Math.round(priceOf(m)*(.5+Math.random()*.2)/500)*500,seen:false,sold:false}});
  S.lots=lots;save();auctionShow();
}
function auctionShow(){const L=S.lots;
  showModal(`<span class="step">АУКЦИОН КОНФИСКАТА · ДЕНЬ ${S.day}</span><h2>Машины с торгов</h2><p>Дёшево, но без истории. Осмотр стоит 2 000 ₽ и покажет пробег и состояние.</p>
    <div class="modes">${L.map((l,i)=>{const M=MODELS[l.m];return `<div class="mode lot"><b>${M.name.toUpperCase()} · ${rub(l.price)}</b>
      <span>${l.sold?'<span class="pos">Куплено</span>':l.seen?`Пробег ${km(l.km)}, состояние: ${l.bad?'<span class="neg">плохое, нужен ремонт</span>':'<span class="pos">хорошее</span>'}`:'Пробег и состояние неизвестны'}</span>
      ${l.sold?'':`<div class="btns">${l.seen?'':`<button class="buy sm alt" id="lotSee${i}">Осмотреть −2 000</button>`}<button class="buy sm" id="lotBuy${i}">Купить</button></div>`}</div>`}).join('')}</div>
    <button class="btn" id="lotDone">Уйти с аукциона</button>`);
  L.forEach((l,i)=>{if(l.sold)return;if($('lotSee'+i))$('lotSee'+i).onclick=()=>{if(S.money<2000)return toast('Не хватает денег');S.money-=2000;l.seen=true;save();render();auctionShow()};
    $('lotBuy'+i).onclick=()=>{if(S.money<l.price)return toast('Не хватает денег');if(carsN()>=S.spots)return toast('Стоянка заполнена');S.money-=l.price;addCar(l.m,l.km);if(l.bad)S.fleet[S.fleet.length-1].b=1;l.sold=true;S.cnt.bought=(S.cnt.bought||0)+1;
      addLog(`Аукцион: куплен ${MODELS[l.m].name} за ${rub(l.price)}${l.bad?' — оказался в плохом состоянии':''}.`);sfx(l.bad?'bad':'coin');save();render();auctionShow()}});
  $('lotDone').onclick=()=>{S.lots=null;save();hideModal();runMorning()};
}
/* ---- корпоративные контракты ---- */
function contractOffer(){
  S.nextContract=S.day+rand(9,14);
  const co=COMPANIES[rand(0,COMPANIES.length-1)],cars=rand(2,Math.max(2,Math.floor(carsN()/4))),days=rand(7,14),pay=rand(42,52)*100,pen=6000;
  save();
  showModal(`<span class="step">КОРПОРАТИВНЫЙ КОНТРАКТ</span><h2>${co}</h2><p>Компания хочет ${cars} маш. каждый день на ${days} дней для своих сотрудников. Оплата ${rub(pay)} за машину в день — независимо от погоды и спроса.</p>
    <p class="note">Эти экипажи не работают на обычных заказах. Если машин не хватит, неустойка ${rub(pen)} за каждую. Одновременно — до трёх контрактов.</p>
    <div class="modes"><button class="mode" id="ctYes"><b>ПОДПИСАТЬ</b></button><button class="mode" id="ctNo"><b>ОТКАЗАТЬСЯ</b></button></div>`);
  sfx('alert');
  $('ctYes').onclick=()=>{S.contracts.push({co,cars,days,pay,pen,fails:0});addLog(`Подписан контракт с ${co}: ${cars} маш. на ${days} дн.`);save();render();hideModal();runMorning()};
  $('ctNo').onclick=()=>{if(B(4))S.ctLost={co,day:S.day};hideModal();runMorning()};
}
/* ---- кадровое агентство ---- */
function agencyEvent(){
  S.nextAgency=S.day+rand(12,18);
  const pool=[];HEADS.forEach((hs,d)=>hs.forEach(h=>{if(h.hidden&&!S.agency.includes(h.key))pool.push([d,h])}));
  if(!pool.length){save();return runMorning()}
  const [d,h]=pool[rand(0,pool.length-1)];save();
  showModal(`<span class="step">КАДРОВОЕ АГЕНТСТВО</span><div class="who"><canvas class="face big" width="16" height="16" data-face="cand:${d}:${h.key}"></canvas><div><h2>${esc(h.name)}</h2><span class="perk">Кандидат в начальники отдела «${DEPTS[d].name}»</span></div></div>
    <p><b style="color:var(--taxi)">${h.perk}.</b> ${h.desc}. Зарплата ${rub(h.pay)}/день.</p>
    <div class="modes"><button class="mode" id="agYes"><b>ВЗЯТЬ РЕЗЮМЕ (−5 000 ₽)</b><span>Кандидат появится в списке «Сменить на» во вкладке «Отделы».</span></button><button class="mode" id="agNo"><b>НЕ СЕЙЧАС</b></button></div>`);
  drawFaces();sfx('alert');
  $('agYes').onclick=()=>{S.money-=5000;S.agency.push(h.key);addLog(`Кадровое агентство: ${h.name} в резерве кандидатов отдела «${DEPTS[d].name}».`);save();render();hideModal();runMorning()};
  $('agNo').onclick=()=>{hideModal();runMorning()};
}
/* ---- действия: районы, смены, бизнес, тюнинг, школа, стиль ---- */
function sellShare(){if(invShare()>=40)return toast('Больше 40% продавать нельзя');const v=Math.round(valuation()*.1/1000)*1000;const before=snap();
  S.money+=v;S.investors.push({name:INV_NAMES[S.investors.length%INV_NAMES.length],share:10});addLog(`Продано 10% парка за ${rub(v)}. Инвесторы будут получать долю прибыли.`);toast(`+${rub(v)} от инвестора`);sfx('coin');save();render(before)}
function buyBack(){if(!S.investors.length)return;const v=Math.round(valuation()*.1*1.25/1000)*1000;if(S.money<v)return toast('Не хватает денег на выкуп');const before=snap();
  S.money-=v;const inv=S.investors.pop();addLog(`Выкупили 10% у «${inv.name}» за ${rub(v)}.`);toast('Доля выкуплена');sfx('coin');save();render(before)}
function buyLine(k){const L=LINES[k];if(S.lines[k]||S.over)return;if(S.rank<(L.rank||0))return toast(`Откроется на звании «${rankName(L.rank)}»`);if(S.money<L.price)return toast('Не хватает денег');
  const before=snap();S.money-=L.price;S.lines[k]=true;addLog(`Запущено направление «${L.n}».`);toast(`Новое направление: ${L.n}`);sfx('win');save();render(before)}
function toggleAds(){const before=snap();if(S.ads){S.ads=null;addLog('Реклама с машин снята.');toast('Реклама снята')}else{S.ads={brand:ADS[rand(0,ADS.length-1)]};addLog(`На машинах реклама ${S.ads.brand}: +300 ₽ с машины в день.`);toast(`Реклама: ${S.ads.brand}`)}sfx('click');save();render(before)}
function tuneCar(id,k){const c=S.fleet.find(x=>x.id===id);if(!c||S.over)return;c.tune=c.tune||{};if(c.tune[k])return;const pr=tunePrice(k);if(S.money<pr)return toast('Не хватает денег');
  const before=snap();S.money-=pr;c.tune[k]=1;let msg=`${MODELS[c.m].name}: ${TUNE[k].n.toLowerCase()}.`;
  const cls=c.up||MODELS[c.m].cls;if(Object.keys(TUNE).every(x=>c.tune[x])&&CLS_UP[cls]){c.up=CLS_UP[cls];c.tune={};msg+=` Машина переведена в класс «${c.up}»!`}
  addLog('Тюнинг: '+msg);toast(msg);sfx('coin');save();render(before)}
function buyParts(n){const pr=n>=30?Math.round(partPrice()*.89):partPrice(),tot=pr*n;if(S.parts+n>partsCap())return toast(`Склад вмещает ${partsCap()}`);if(S.money<tot)return toast('Не хватает денег');
  const before=snap();S.money-=tot;S.parts+=n;addLog(`Склад: закуплено ${n} запчастей за ${rub(tot)}.`);toast(`+${n} запчастей на складе`);sfx('cash');save();render(before)}
function corpParty(){const cost=5000+S.drivers*500;if(S.day-S.lastParty<30)return toast(`Следующий корпоратив через ${30-(S.day-S.lastParty)} дн.`);if(S.money<cost)return toast('Не хватает денег');
  const before=snap();S.money-=cost;S.lastParty=S.day;apply({loy:15});S.rep=Math.min(100,S.rep+1);S.cnt.party=(S.cnt.party||0)+1;const st=PARTY_STORIES[rand(0,PARTY_STORIES.length-1)];
  addLog(`Корпоратив! ${st}`);triggerScene('party');sfx('party');save();render(before);
  showModal(`<span class="step">КОРПОРАТИВ</span><h2>Праздник удался</h2><p>Все водители и сотрудники довольны: лояльность +15, репутация +1.</p><p class="note">Главная история вечера: ${st}</p><button class="btn" id="cpOk">Отлично</button>`);$('cpOk').onclick=hideModal}
function buyOwner(k){const I=OWNER_ITEMS[k];if(S.owned[k]||S.over)return;if(S.money<I.price)return toast('Не хватает денег');const before=snap();S.money-=I.price;S.owned[k]=1;
  addLog(`Владелец купил: ${I.n}.`);toast(`Куплено: ${I.n}`);sfx('cash');save();render(before)}
function pddExam(list){const qs=shuffle([...PDD]).slice(0,3);let i=0,ok=0;const names=list.map(d=>d.n).join(' и ');
  const step=()=>{if(i>=3){const r=+(4.6+ok*.12).toFixed(2);list.forEach(d=>{d.r=r;if(ok===3)d.loy=Math.min(100,d.loy+10)});
      addLog(`Экзамен ПДД: ${names} — ${ok} из 3. Стартовый рейтинг ★${r}.`);save();render();
      showModal(`<span class="step">ЭКЗАМЕН ПДД</span><h2>${ok} из 3</h2><p>${esc(names)} ${list.length>1?'начинают':'начинает'} работу с рейтингом ★${r}.${ok===3?' Отличный результат!':''}</p><button class="btn" id="exOk">Готово</button>`);$('exOk').onclick=hideModal;return}
    const Q=qs[i],ans=shuffle(Q.a.map((t,k)=>({t,k})));
    showModal(`<span class="step">ЭКЗАМЕН ПДД · ВОПРОС ${i+1} ИЗ 3</span><h2>${esc(names)}</h2><p class="mg-q">${Q.q}</p>
      <div class="modes">${ans.map((a,j)=>`<button class="mode" id="ex${j}"><span style="color:var(--ink)">${a.t}</span></button>`).join('')}</div><p class="note" id="exMsg"></p>
      <button class="btn ghost" id="exSkip">Пропустить экзамен</button>`);
    let done=false;ans.forEach((a,j)=>$('ex'+j).onclick=()=>{if(done)return;done=true;const r=a.k===0;if(r)ok++;sfx(r?'coin':'bad');$('ex'+j).classList.add(r?'mg-ok':'mg-bad');
      $('exMsg').innerHTML=r?'<span class="pos">Верно!</span>':`<span class="neg">Правильно: ${Q.a[0]}.</span>`;
      const nb=document.createElement('button');nb.className='btn';nb.textContent=i<2?'Дальше':'Итог';nb.onclick=()=>{i++;step()};$('exMsg').after(nb);nb.focus()});
    $('exSkip').onclick=hideModal};
  step()}
function careerEvent(){
  S.nextCareer=S.day+rand(18,26);const d=rand(0,2);
  const pool=HEADS[d].filter(h=>!h.hidden&&h.key!==S.heads[d].key);const like=pool[rand(0,pool.length-1)];
  const geny=d===1&&!hasHead('gena')&&!S.cnt.genaGrown&&Math.random()<.5;
  const nm=geny?'Геннадий Дизелев':DNAMES[rand(0,DNAMES.length-1)]+' '+SURN[rand(0,SURN.length-1)];
  const h={key:'grown_'+(S.dseq+=1),like:like.key,name:nm,perk:like.perk,desc:like.desc,skill:geny?2:rand(1,2),pay:1700,face:geny?Object.assign({},HEADS[1][0].face,{acc:'mustache'}):AVATARS[rand(0,AVATARS.length-1)]};
  save();
  showModal(`<span class="step">КАРЬЕРА · ОТДЕЛ «${DEPTS[d].name.toUpperCase()}»</span><div class="who"><canvas class="face big" width="16" height="16" data-face="cnew"></canvas><div><h2>${esc(nm)}</h2><span class="perk">${geny?'Тот самый Гена! Повзрослел, отучился и больше не путает дизель с бензином.':'Вырос из рядового сотрудника отдела.'}</span></div></div>
    <p><b style="color:var(--taxi)">${h.perk}.</b> ${h.desc}. Зарплата всего ${rub(h.pay)}/день — свой человек.</p>
    <div class="modes"><button class="mode" id="crNow"><b>НАЗНАЧИТЬ НАЧАЛЬНИКОМ СЕЙЧАС</b><span>Нынешний начальник уйдёт.</span></button><button class="mode" id="crRes"><b>В РЕЗЕРВ</b><span>Появится в списке «Сменить на».</span></button><button class="mode" id="crNo"><b>ПУСТЬ РАСТЁТ ДАЛЬШЕ</b></button></div>`);
  const fc=document.querySelector('[data-face="cnew"]');if(fc)face(fc.getContext('2d'),h.face);sfx('alert');
  const keep=()=>{S.extraHeads=S.extraHeads||[[],[],[]];S.extraHeads[d].push(h);if(geny)S.cnt.genaGrown=1};
  $('crNow').onclick=()=>{keep();S.heads[d]={key:h.key,name:h.name};relAdd(d,3);addLog(`${h.name} — новый начальник отдела «${DEPTS[d].name}».`);save();render();hideModal();runMorning()};
  $('crRes').onclick=()=>{keep();addLog(`${h.name} в резерве кандидатов отдела «${DEPTS[d].name}».`);save();render();hideModal();runMorning()};
  $('crNo').onclick=()=>{hideModal();runMorning()};
}
function conflictEvent(){
  S.nextConflict=S.day+rand(15,22);const a=rand(0,2),b=(a+rand(1,2))%3;save();
  const TOP=['чей отдел важнее','кто виноват в последнем ДТП','кому достанется новый кабинет','кто съел общий торт','чья очередь мыть кофемашину'];const top=TOP[rand(0,TOP.length-1)];
  showModal(`<span class="step">КОНФЛИКТ НАЧАЛЬНИКОВ</span><h2>Спор: ${top}</h2>
    <div class="who"><canvas class="face big" width="16" height="16" data-face="head:${a}"></canvas><b>VS</b><canvas class="face big" width="16" height="16" data-face="head:${b}"></canvas></div>
    <p>${esc(S.heads[a].name)} («${DEPTS[a].name}») и ${esc(S.heads[b].name)} («${DEPTS[b].name}») неделю не разговаривают. Отделы работают хуже.</p>
    <div class="modes"><button class="mode" id="cfA"><b>ВСТАТЬ НА СТОРОНУ: ${esc(S.heads[a].name.toUpperCase())}</b><span>Его отдел воодушевится, другой обидится.</span></button>
    <button class="mode" id="cfB"><b>ВСТАТЬ НА СТОРОНУ: ${esc(S.heads[b].name.toUpperCase())}</b><span>Наоборот.</span></button>
    <button class="mode" id="cfT"><b>ТИМБИЛДИНГ (−10 000 ₽)</b><span>Квест в лесу. Оба отдела работают лучше.</span></button></div>`);
  drawFaces();sfx('alert');
  const fin=msg=>{addLog('Конфликт: '+msg);save();render();showModal(`<h2>Конфликт улажен</h2><p>${msg}</p><button class="btn" id="cfOk">Продолжить</button>`);$('cfOk').onclick=()=>{hideModal();runMorning()}};
  $('cfA').onclick=()=>{S.moodMod[a]-=.1;S.moodMod[b]+=.12;relAdd(a,2);relAdd(b,-3);fin(`Отдел «${DEPTS[a].name}» на подъёме, «${DEPTS[b].name}» обижен.`)};
  $('cfB').onclick=()=>{S.moodMod[b]-=.1;S.moodMod[a]+=.12;relAdd(b,2);relAdd(a,-3);fin(`Отдел «${DEPTS[b].name}» на подъёме, «${DEPTS[a].name}» обижен.`)};
  $('cfT').onclick=()=>{S.money-=Math.round(10000*inf());relAdd(a,1);relAdd(b,1);S.moodMod[a]-=.06;S.moodMod[b]-=.06;fin('Начальники вместе заблудились в лесу и помирились. Оба отдела работают лучше.')};
}
function echoEvent(){const due=S.echoDue||[];S.echoDue=null;if(!due.length)return runMorning();const before=snap();
  const items=due.map(x=>{const o=Math.random()<x.p?{fx:x.fx,m:x.m}:x.alt;if(!o)return null;apply(scx(o.fx),x.d);addLog(`Последствия решения «${x.l}»: ${o.m}`);
    return{t:x.t,l:x.l,from:x.from,m:o.m,good:!isBad(o.fx)&&!((o.fx||{}).money<0)}}).filter(Boolean);
  save();render(before);if(!items.length)return runMorning();
  showModal(`<span class="step">ПОСЛЕДСТВИЯ</span><h2>${items.length>1?'Прошлые решения аукнулись':'Прошлое решение аукнулось'}</h2>
    ${items.map(x=>`<div class="echo-it ${x.good?'good':'bad'}"><small>День ${x.from} · «${x.t}» → ${x.l}</small><p>${x.m}</p></div>`).join('')}
    <button class="btn" id="ecOk">Понятно</button>`);
  sfx(items.some(x=>!x.good)?'bad':'coin');$('ecOk').onclick=()=>{hideModal();runMorning()}}
function debtBoom(){
  const n=S.tdebt||0,cost=Math.round(n*6000*costScale()/1000)*1000;save();
  showModal(`<span class="step">ОТЛОЖЕННЫЕ ПРОБЛЕМЫ</span><h2>Всё, что откладывали, рвануло</h2>
    <p>Заклеенные лампочки, «потом переобуемся», машины без полисов — проблем накопилось ${n}. Сегодня они вылезли разом.</p>
    <div class="modes"><button class="mode" id="bmPay"><b>РАЗГРЕСТИ ВСЁ (−${rub(cost)})</b><span>Дорого, но парк в порядке.</span></button>
    <button class="mode" id="bmBurn"><b>ПУСТЬ ГОРИТ</b><span>Треть машин сломается, репутация −8, штрафы.</span></button></div>`);
  sfx('bad');triggerScene('crash');
  const fin=msg=>{S.tdebt=0;addLog('Отложенные проблемы: '+msg);save();render();showModal(`<h2>Последствия</h2><p>${msg}</p><button class="btn" id="bmOk">Понятно</button>`);$('bmOk').onclick=()=>{hideModal();runMorning()}};
  $('bmPay').onclick=()=>{S.money-=cost;fin(`Разгребли за ${rub(cost)}. Впредь лучше не экономить на мелочах.`)};
  $('bmBurn').onclick=()=>{breakCars(Math.ceil(carsN()*.3));S.rep=Math.max(0,S.rep-8);S.money-=Math.round(n*2000*costScale()/100)*100;fin('Треть машин в ремонте, штрафы и скандал в соцсетях.')};
}
function rareEvent(){const used=S.rareSeen||[];const pool=RARE.filter(r=>!used.includes(r.id));if(!pool.length)return runMorning();
  const E=pool[rand(0,pool.length-1)];S.rareSeen=used.concat([E.id]);S.cnt.rare=(S.cnt.rare||0)+1;if(E.scene)triggerScene(E.scene);save();
  showModal(`<span class="step">РЕДКОЕ СОБЫТИЕ ★</span><h2>${E.t}</h2><p>${E.x}</p><div class="modes">${E.o.map((o,i)=>`<button class="mode" id="ra${i}"><b>${o[0].toUpperCase()}</b></button>`).join('')}</div>`);
  sfx('win');E.o.forEach((o,i)=>$('ra'+i).onclick=()=>{const before=snap();const msg=o[1]();addLog(`Редкое событие «${E.t}»: ${msg}`);save();render(before);
    showModal(`<h2>${E.t}</h2><p>${msg}</p><button class="btn" id="raOk">Продолжить</button>`);$('raOk').onclick=()=>{hideModal();runMorning()}})}
function quitEvent(){const d=[0,1,2].find(x=>relOf(x)<=-5);if(d===undefined)return runMorning();const nm=S.heads[d].name;save();
  showModal(`<span class="step">УВОЛЬНЕНИЕ</span><div class="who"><canvas class="face big" width="16" height="16" data-face="head:${d}"></canvas><div><h2>${esc(nm)} уходит</h2><span class="perk">Отдел «${DEPTS[d].name}»</span></div></div>
    <p>«С меня хватит», — говорит ${esc(nm)}. Отношения испорчены. Можно попробовать удержать.</p>
    <div class="modes"><button class="mode" id="qtKeep"><b>УДЕРЖАТЬ ПРЕМИЕЙ (−${rub(Math.round(30000*inf()))})</b></button><button class="mode" id="qtGo"><b>ОТПУСТИТЬ</b><span>Нужно будет выбрать нового начальника.</span></button></div>`);
  drawFaces();sfx('bad');
  $('qtKeep').onclick=()=>{S.money-=Math.round(30000*inf());S.rel[S.heads[d].key]=0;addLog(`${nm} остаётся после разговора и премии.`);save();render();hideModal();runMorning()};
  $('qtGo').onclick=()=>{addLog(`${nm} уволился.`);pickHead(d,()=>runMorning(),false)};
}
function headBonus(d){const k=S.heads[d].key;S.relCd=S.relCd||{};if(S.day-(S.relCd[k]||-99)<15)return toast(`Премию можно дать через ${15-(S.day-(S.relCd[k]||-99))} дн.`);
  const c=Math.round(10000*inf());if(S.money<c)return toast('Не хватает денег');const before=snap();S.money-=c;S.relCd[k]=S.day;relAdd(d,2);addLog(`Премия начальнику: ${S.heads[d].name} доволен(а).`);toast('Отношения улучшились');sfx('coin');save();render(before)}
function sellFranchise(){const nw=B(7),pts=prestPts(),h=holdG(),op=Object.entries(CITIES).filter(([k,C])=>!holdCityOpen(k)&&holdCityOpen(k,1)).map(([,C])=>C.n);
  const ex=valExtra(),to=prestige()+pts,nx=[5,10].find(x=>x>to),f1=x=>x.toFixed(1).replace('.',',');
  holdTrials();
  showModal(`<span class="step">ФРАНШИЗА</span><h2>Продать парк и начать в новом городе?</h2>
    <p>Парк «${esc(parkName())}» оценён в <b>${rub(valuation())}</b>${nw?'':ex.length?` (машины, касса, репутация + ${ex.map(x=>`${x[0].toLowerCase()} ${rub(Math.round(x[1]/1000)*1000)}`).join(', ')})`:''}.</p>
    ${nw?`<p><b class="pos">Вы получите:</b> <b>${pts}</b> очк. холдинга (свободно было ${holdFree()}, станет ${holdFree()+pts}).</p>
    <p class="note">${valRows().map(x=>`${x[0].toLowerCase()} ${f1(x[2])}`).join(' · ')} = ${pts} (дробная часть отбрасывается, минимум 1)</p>
    <p class="note">Франшиза останется в холдинге: в начале каждой новой партии бесконечного режима она перечисляет ${Math.round(bal('royK',7)*100)}% оценки (всего до ${rub(bal('royCap',7))}). Очки тратятся в дереве владельца.${op.length?` Откроются города: ${op.join(', ')}.`:''}</p>`
    :`<p><b class="pos">Вы получите:</b> <b>${pts}</b> очк. престижа (было ${prestige()}, станет ${to}) — навсегда.</p>
    <ul class="note">${prestList(prestige(),to).map(x=>`<li>${x[0]}: ${x[1]}</li>`).join('')}</ul>
    <p class="note">${nx?`Следующий порог: ${nx} очк.`:'Все пороги пройдены.'}${op.length?` Откроются города: ${op.join(', ')}.`:''}</p>`}
    <p><b class="neg">Вы потеряете:</b> текущую партию — она закончится, парк, деньги, филиалы и кредиты не переносятся.</p>
    <div class="btns"><button class="btn" id="frYes">Продать и открыть франшизу</button><button class="btn ghost" id="frNo">Не сейчас</button></div>`);
  $('frNo').onclick=hideModal;
  $('frYes').onclick=()=>{if(S.over)return;if(h.fr.some(f=>f.gid&&f.gid===S.gid))return toast('Этот парк уже продан');const v=valuation();if(!nw){G.prestige=prestige()+pts;G.franchises=(G.franchises||0)+1}
    h.fr.push({id:holdId(),city:S.city||'home',val:nw?v:0,day:S.day,at:Date.now(),pts,gid:S.gid||''});h.earned+=pts;h.at=Date.now();
    recordResult('франшиза');S.cnt.franchise=1;S.ach.franchise=S.day;G.ach.franchise=true;S.over=true;saveG();save();render();sfx('win');
    showModal(`<h2>Франшиза открыта!</h2><p>Очков холдинга свободно: ${holdFree()}${nw?'':`, престиж: ${G.prestige}`}. Выберите новый город в бесконечном режиме.</p><div class="btns"><button class="btn" id="frGo">К выбору режима</button><button class="btn ghost" id="frHold">Открыть холдинг</button></div>`);$('frGo').onclick=pickMode;$('frHold').onclick=()=>openHolding()};
}
function pickCity(mode,opts){
  showModal(`<span class="step">ХОЛДИНГ · ОЧКОВ СВОБОДНО ${holdFree()}</span><h2>Выберите город</h2><div class="modes">
    ${Object.entries(CITIES).map(([k,C])=>{const lk=!holdCityOpen(k),m=holdG().medals[k]||0;return `<button class="mode" id="ct_${k}" ${lk?'disabled style="opacity:.5"':''}><b>${C.n.toUpperCase()}${lk?' 🔒':''}${m?' · '+HOLD_MED[m]:''}</b><span>${lk?`Откроется ${C.gold?`после золота в ${C.gold} городах`:`после ${C.need} франшиз(ы)`}.`:C.d}</span></button>`}).join('')}</div><button class="btn ghost" id="ctHold">Холдинг: дерево и карта</button>`);$('ctHold').onclick=()=>openHolding(()=>pickCity(mode,opts));
  Object.keys(CITIES).forEach(k=>{if(holdCityOpen(k))$('ct_'+k).onclick=()=>chooseHeads(mode,Object.assign({},opts,{city:k}))});
}
function autoResolve(){if(S.over||S.preview)return;let n=0;
  for(let d=0;d<3;d++){if(S.done[d])continue;const ev=getEv(d,S.today[d]);let best=-1,bs=1e18;
    ev.c.forEach((c,i)=>{if(c.game)return;let sc=evCost(c,d)+(c.r&&isBad(c.r.fx)?c.r.p*25000*costScale():0)+(isBad(c.fx)?15000:0)-((c.fx&&c.fx.rep)||0)*2500-((c.fx&&c.fx.drivers)||0)*6000;if(evCost(c,d)>S.money)sc+=1e9;if(sc<bs){bs=sc;best=i}});
    if(best>=0){choose(d,best);n++}}
  if(n)toast(`Секретарь Света решила задач: ${n}`)}
function takePhoto(){const sc=4,c2=document.createElement('canvas');c2.width=320*sc;c2.height=150*sc+56;const g=c2.getContext('2d');g.imageSmoothingEnabled=false;
  g.drawImage(cv,0,0,320,150,0,0,320*sc,150*sc);g.fillStyle='#0e0b1c';g.fillRect(0,150*sc,c2.width,56);g.fillStyle='#f7c331';g.font='22px "Press Start 2P", monospace';g.textBaseline='middle';
  g.fillText(`Таксопарк «${parkName()}»`,18,150*sc+28);g.fillStyle='#f3ecdc';g.font='18px "PT Mono", monospace';g.textAlign='right';g.fillText(`день ${S.day} · машин ${totalCars()} · ★ ${rankName(S.rank||0)}`,c2.width-18,150*sc+28);
  let url='';try{url=c2.toDataURL('image/png')}catch(e){}
  showModal(`<span class="step">ФОТО-РЕЖИМ</span><h2>Кадр вашего парка</h2>${url?`<img class="photo" src="${url}" alt="Двор таксопарка «${esc(parkName())}»">`:'<p>Не получилось сделать снимок в этом браузере.</p>'}
    <p class="note">Чтобы сохранить: нажмите «Скачать» или удерживайте картинку (на компьютере — правый клик → «Сохранить»).</p>
    <div class="btns">${url?`<a class="btn" href="${url}" download="taxipark-${S.day}.png">Скачать</a>`:''}<button class="btn ghost" id="phOk">Закрыть</button></div>`);
  sfx('click');$('phOk').onclick=hideModal}
/* ---- защита сохранений ---- */
const isIOS=()=>typeof navigator!=='undefined'&&/iPhone|iPad|iPod/.test(navigator.userAgent||'');
const isStandalone=()=>typeof navigator!=='undefined'&&(navigator.standalone||(typeof matchMedia==='function'&&matchMedia('(display-mode: standalone)').matches&&!/Node/.test(navigator.userAgent||'')));
const canA2HS=()=>typeof navigator!=='undefined'&&!isStandalone()&&(isIOS()||(typeof installEvt!=='undefined'&&installEvt));
function a2hsEvent(){G.a2hs=1;saveG();
  showModal(`<span class="step">СОВЕТ</span><h2>Добавьте игру на экран «Домой»</h2>
    <p>Так игра будет открываться как приложение, а прогресс сохранится надёжнее: браузер не сотрёт его, если вы долго не заходили.</p>
    ${isIOS()?'<ol class="steps"><li>Нажмите кнопку «Поделиться» <b>⎋</b> внизу Safari.</li><li>Выберите «На экран „Домой“».</li><li>Нажмите «Добавить».</li></ol>':'<p>Нажмите «Установить» — игра появится рядом с другими приложениями.</p>'}
    <div class="btns">${!isIOS()&&typeof installEvt!=='undefined'&&installEvt?'<button class="btn" id="a2Inst">Установить</button>':''}<button class="btn ghost" id="a2Ok">Понятно</button></div>`);
  $('a2Ok').onclick=()=>{hideModal();runMorning()};
  if($('a2Inst'))$('a2Inst').onclick=()=>{try{installEvt.prompt()}catch(e){}hideModal();runMorning()}}
/* ---- интерактивное обучение ---- */
const firstOpen=()=>S.done.findIndex(x=>!x);
const COACH=[
 {el:()=>{const d=firstOpen();return d<0?null:document.querySelectorAll('#desks .desk')[d]},t:'Это задача одного из отделов. Прочитайте её и нажмите на любой вариант ответа. Под вариантом видно, что он даст: зелёное — хорошо, красное — плохо.',done:()=>S.done.some(x=>x)},
 {el:()=>{const d=firstOpen();return d<0?null:document.querySelectorAll('#desks .desk')[d]},t:'Отлично! Теперь решите задачи в остальных отделах.',done:()=>S.done.every(x=>x)},
 {el:()=>$('endDay'),t:'Все задачи решены. Нажмите «Закончить день» — машины выйдут на линию, и вы увидите выручку.',done:()=>S.day>=2},
 {el:()=>$('hud'),t:'Наверху главные показатели: касса, день, водители, репутация и машины на линии. Чем выше репутация, тем больше выручка.',btn:'Понятно'},
 {el:()=>document.querySelector('.card2.hire'),pre:()=>{if(uiTab!=='shop'){uiTab='shop';renderMgmt();drawFaces()}},t:'Парк растёт так: нанимаете водителей и покупаете машины. Каждая машина с водителем приносит деньги каждый день.',btn:'Понятно'},
 {el:()=>$('advisor'),t:'Не знаете, что делать дальше? Смотрите совет секретаря Светы. Удачи!',btn:'Начать играть'}];
let coachI=-1,coachTimer=0,coachLast=null;
function coachStart(){if(S.preview)return;coachI=0;$('coach').hidden=true;clearInterval(coachTimer);coachTimer=setInterval(coachTick,350);coachTick()}
function coachEnd(){coachI=-1;clearInterval(coachTimer);$('coach').hidden=true;if(coachLast)coachLast.classList.remove('coach-hl');coachLast=null;G.tutDone=true;saveG()}
function coachNext(){coachI++;sfx('coin');if(coachI>=COACH.length)return coachEnd();coachLast&&coachLast.classList.remove('coach-hl');coachLast=null;coachTick()}
function coachTick(){if(coachI<0||paused)return;const st=COACH[coachI],box=$('coach');
  if(!S||S.over){coachEnd();return}
  if(st.done&&st.done())return coachNext();
  if(!$('modal').hidden||($('studio')&&!$('studio').classList.contains('out'))||($('splash')&&!$('splash').classList.contains('out'))){box.hidden=true;return}
  if(st.pre)st.pre();
  const el=st.el();if(!el||el.hidden){box.hidden=true;return}
  if(el!==coachLast){coachLast&&coachLast.classList.remove('coach-hl');el.classList.add('coach-hl');coachLast=el;
    box.innerHTML=`<span class="cstep">ОБУЧЕНИЕ · ${coachI+1} ИЗ ${COACH.length}</span><p>${st.t}</p><div class="cbtns">${st.btn?`<button class="buy sm" id="coNext">${st.btn}</button>`:''}<button class="cskip" id="coSkip">Пропустить обучение</button></div>`;
    if($('coNext'))$('coNext').onclick=coachNext;$('coSkip').onclick=coachEnd;
    try{el.scrollIntoView({block:el.offsetHeight>window.innerHeight*.55?'start':'center',behavior:still?'auto':'smooth'})}catch(e){}}
  box.hidden=false;
  const r=el.getBoundingClientRect(),bw=Math.min(340,window.innerWidth-24),bh=box.offsetHeight||140;
  const fitB=r.bottom+bh+20<window.innerHeight,fitA=r.top>bh+20,float=!fitB&&!fitA,below=fitB||!fitA;
  const top=float?window.scrollY+window.innerHeight-bh-(window.innerWidth<=700?96:24):(below?r.bottom+14:r.top-bh-14)+window.scrollY;box.classList.toggle('float',float);
  const left=(float&&window.innerWidth>700?(r.left+r.width/2<window.innerWidth/2?window.innerWidth-bw-24:24):Math.max(12,Math.min(window.innerWidth-bw-12,r.left+r.width/2-bw/2)))+window.scrollX;
  box.style.width=bw+'px';box.style.top=top+'px';box.style.left=left+'px';
  box.classList.toggle('above',!below);box.style.setProperty('--ax',Math.max(16,Math.min(bw-16,r.left+r.width/2-left+window.scrollX))+'px')}
if(typeof window!=='undefined')window.addEventListener('resize',()=>{coachLast=coachLast;coachTick()});
/* ---- награда за вход ---- */
function loginPay(streak){const w=streak%7===0,m=bal('loginDay')*Math.min(streak,7)+(w?bal('loginBonus'):0);S.money+=m;
  if(w){S.parts+=bal('loginParts');S.dlist.forEach(x=>x.loy=Math.min(100,x.loy+bal('loginLoy')))}return{m,w}}
function offlineIncome(){if(!S||S.preview||S.over||S.mode==='sandbox'||!G.lastSeen)return 0;const hrs=(Date.now()-G.lastSeen)/36e5;if(hrs<3)return 0;
  const last=S.stat.slice(-7),avg=last.length?last.reduce((a,x)=>a+x.net,0)/last.length:0;if(avg<=0)return 0;
  const inc=Math.round(Math.min(avg*Math.max(.25,Math.min(3,hrs/24))*bal('offK'),bal('offCap')*inf())/100)*100;S.money+=inc;addLog(`Пока вас не было (${Math.round(hrs)} ч), парк заработал ${rub(inc)}.`);save();return inc}
function checkLogin(){const k=todayKey();G.login=G.login||{};const off=offlineIncome();
  if(G.login.last===k){G.lastSeen=Date.now();saveG();if(off){render();showModal(`<span class="step">С ВОЗВРАЩЕНИЕМ</span><h2>Пока вас не было</h2><p>Парк работал без вас и заработал <b class="pos">${rub(off)}</b>.</p><button class="btn" id="lgOk">Отлично</button>`);$('lgOk').onclick=hideModal}return}
  const y=new Date();y.setDate(y.getDate()-1);const yk=y.getFullYear()+'-'+(y.getMonth()+1)+'-'+y.getDate();
  const streak=G.login.last===yk?(G.login.streak||0)+1:1;G.login={last:k,streak};const live=S&&!S.preview&&!S.over&&S.mode!=='sandbox',bv=live?0:BAL_NEW,w7=streak%7===0&&bal('loginParts',bv)>0;let reward=0;
  if(live){reward=loginPay(streak).m;addLog(`Награда за вход: ${rub(reward)} (день ${streak} подряд).${w7?` Бонус 7-го дня: +${bal('loginParts')} запчасти, лояльность +${bal('loginLoy')}.`:''}`);save();render()}else G.loginPending={streak};
  saveG();
  showModal(`<span class="step">НАГРАДА ЗА ВХОД</span><h2>День ${streak} подряд</h2><div class="streak">${[1,2,3,4,5,6,7].map(i=>`<i class="${i<=((streak-1)%7)+1?'on':''}">${i}</i>`).join('')}</div>
    ${off?`<p>Пока вас не было, парк заработал <b class="pos">${rub(off)}</b>.</p>`:''}<p>${live?`В кассу парка зачислено ${rub(reward)}.`:`Награда придёт в кассу, когда начнёте игру.`}${w7?` Бонус 7-го дня: ${live?'':'тоже '}+${bal('loginParts',bv)} запчасти и +${bal('loginLoy',bv)} к лояльности всех водителей.`:''} Заходите каждый день: награда растёт до 7-го дня, а на 7-й — бонус.</p><button class="btn" id="lgOk">Забрать</button>`);
  sfx('win');$('lgOk').onclick=()=>{hideModal();if(S&&S.preview)pickMode()}}
/* ---- диспетчер ---- */
function dispatcher(){
  if(S.dispDay===S.day)return toast('Смена диспетчера уже была сегодня');
  const nCars=Math.max(2,Math.min(6,activeN()));S.dispDay=S.day;save();
  showModal(`<span class="step">МИНИ-ИГРА · ДИСПЕТЧЕР</span><h2>Раздайте заказы за 60 секунд</h2>
    <p>Нажимайте на мигающие заказы — к ним поедет ближайшая свободная машина. Не дайте заказам сгореть.</p>
    <canvas id="dpC" class="dp-canvas" width="200" height="120"></canvas><div class="row2"><span class="mg-timer" id="dpInfo"></span><button class="buy sm alt" id="dpStop">Закончить</button></div>`);
  const cv2=$('dpC'),g=cv2.getContext('2d');crisp(cv2);const GX=[10,50,90,130,170,190],GY=[10,40,70,100,112];
  // город рисуется один раз: кварталы с крышами разной высоты, парки с деревьями, дороги с тротуарами
  const city=document.createElement('canvas');city.width=200;city.height=120;{const c=city.getContext('2d'),F=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)};let sd=11;const rr=()=>(sd=(sd*16807)%2147483647)/2147483647;
    F(0,0,200,120,'#2a2740');const xs=[-10,...GX,210],ys=[-10,...GY,130];
    for(let i=0;i<xs.length-1;i++)for(let j=0;j<ys.length-1;j++){const x0=xs[i]+4,y0=ys[j]+4,x1=xs[i+1]-4,y1=ys[j+1]-4;if(x1-x0<3||y1-y0<3)continue;
      F(x0-1,y0-1,x1-x0+2,y1-y0+2,'#5a5285');
      if(rr()<.22){F(x0,y0,x1-x0,y1-y0,'#2e5a3a');for(let k=0;k<(x1-x0)*(y1-y0)/40;k++){const tx=x0+rr()*(x1-x0-4)|0,ty=y0+rr()*(y1-y0-4)|0;F(tx,ty,4,4,'#3a9a5a');F(tx+1,ty,2,1,'#5ab06a');F(tx+3,ty+1,1,3,'#2e7a44')}continue}
      for(let x=x0;x<x1;){const w=Math.min(x1-x,6+(rr()*10|0)),roof=['#6a5a90','#5a4a78','#4a5a80','#7a5a60','#3a4a6a','#8a6a50'][rr()*6|0];
        F(x,y0,w,y1-y0,roof);F(x,y0,w,1,shade(roof,1.3));F(x+w-1,y0,1,y1-y0,shade(roof,.7));F(x,y1-1,w,1,shade(roof,.6));
        if(w>4&&y1-y0>4){F(x+1+(rr()*(w-3)|0),y0+2,2,2,shade(roof,.8));if(rr()<.5)F(x+2,y1-4,1,1,'#f7c33188')}x+=w+1}}
    GX.forEach(x=>{F(x-3,0,1,120,'#4a4570');F(x+2,0,1,120,'#4a4570')});GY.forEach(y=>{F(0,y-3,200,1,'#4a4570');F(0,y+2,200,1,'#4a4570')});
    GX.forEach(x=>F(x-2,0,4,120,'#2a2740'));GY.forEach(y=>F(0,y-2,200,4,'#2a2740'))}
  const node=()=>({x:GX[rand(0,4)],y:GY[rand(0,3)]});
  const cars=Array.from({length:nCars},()=>Object.assign(node(),{st:'free',path:[],ord:null}));
  let orders=[],t2=0,last=0,spawn=1,score=0,lost=0,fin=false;
  const pathTo=(c,tx,ty)=>[{x:tx,y:c.y},{x:tx,y:ty}];
  cv2.onpointerdown=e=>{const r=cv2.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*200,py=(e.clientY-r.top)/r.height*120;
    const o=orders.find(o=>!o.taken&&Math.hypot(o.x-px,o.y-py)<12);if(!o)return;const fc=cars.filter(c=>c.st==='free').sort((a,b)=>Math.hypot(a.x-o.x,a.y-o.y)-Math.hypot(b.x-o.x,b.y-o.y))[0];
    if(!fc){sfx('bad');return}o.taken=true;fc.st='pick';fc.ord=o;fc.path=pathTo(fc,o.x,o.y);sfx('click')};
  const frame=ts=>{const dt=last?Math.min(.05,(ts-last)/1000):0;last=ts;t2+=dt;
    spawn-=dt;if(spawn<=0){spawn=Math.max(.9,2.2-t2*.02);const n=node();orders.push({x:n.x+rand(-4,4),y:n.y,ttl:9,taken:false})}
    orders.forEach(o=>{if(!o.taken)o.ttl-=dt});orders=orders.filter(o=>{if(!o.taken&&o.ttl<=0){lost++;sfx('bad');return false}return true});
    cars.forEach(c=>{if(!c.path.length)return;const tg=c.path[0],dx=tg.x-c.x,dy=tg.y-c.y,dist=Math.hypot(dx,dy),sp=70*dt;
      if(dist<=sp){c.x=tg.x;c.y=tg.y;c.path.shift();if(!c.path.length){if(c.st==='pick'){c.st='drive';orders=orders.filter(o=>o!==c.ord);const n=node();c.path=pathTo(c,n.x,n.y)}else if(c.st==='drive'){c.st='free';score++;sfx('coin')}}}
      else{c.x+=dx/dist*sp;c.y+=dy/dist*sp}});
    g.drawImage(city,0,0);
    g.fillStyle='#f7c33155';GY.forEach(y=>{for(let x=(Math.floor(t2*20))%8;x<200;x+=8)g.fillRect(x,y,3,1)});
    // заказ: пульсирующее кольцо и пассажир, цвет — сколько осталось ждать
    orders.forEach(o=>{const x=Math.round(o.x),y=Math.round(o.y),col=o.taken?'#a8a0cc':o.ttl<3?'#ff4d4d':o.ttl<6?'#f7c331':'#86e06f';
      if(!o.taken){const r=2+Math.floor((t2*2.5)%1*5);g.globalAlpha=1-((t2*2.5)%1);g.fillStyle=col;g.fillRect(x-r,y-4-r,r*2+1,1);g.fillRect(x-r,y-4+r,r*2+1,1);g.fillRect(x-r,y-4-r,1,r*2+1);g.fillRect(x+r,y-4-r,1,r*2+1);g.globalAlpha=1}
      g.fillStyle='#0e0b1c';g.fillRect(x-2,y-8,5,8);g.fillStyle='#f0c8a0';g.fillRect(x-1,y-7,3,2);g.fillStyle=col;g.fillRect(x-1,y-5,3,3);g.fillStyle='#2a2450';g.fillRect(x-1,y-2,1,1);g.fillRect(x+1,y-2,1,1);
      if(!o.taken){g.fillStyle='#0e0b1c';g.fillRect(x-5,y+2,11,2);g.fillStyle=col;g.fillRect(x-4,y+2,Math.max(1,Math.round(9*o.ttl/9)),1)}});
    // такси сверху: повёрнуто по ходу движения, на крыше шашка, спереди фары
    cars.forEach(c=>{const tg=c.path[0],hz=tg?Math.abs(tg.x-c.x)>=Math.abs(tg.y-c.y):true,dir=tg?(hz?Math.sign(tg.x-c.x):Math.sign(tg.y-c.y))||1:1,x=Math.round(c.x),y=Math.round(c.y);
      const body=c.st==='free'?'#f7c331':c.st==='pick'?'#ff8a4c':'#4fc7b0',w=hz?8:5,h=hz?5:8;
      g.globalAlpha=.4;g.fillStyle='#0e0b1c';g.fillRect(x-(w>>1)+1,y-(h>>1)+1,w,h);g.globalAlpha=1;
      g.fillStyle='#0e0b1c';g.fillRect(x-(w>>1)-1,y-(h>>1),w+2,h);g.fillRect(x-(w>>1),y-(h>>1)-1,w,h+2);
      g.fillStyle=body;g.fillRect(x-(w>>1),y-(h>>1),w,h);g.fillStyle='#9fd3ff';
      if(hz){g.fillRect(dir>0?x+1:x-2,y-1,2,3);g.fillStyle='#fff6a8';g.fillRect(dir>0?x+3:x-4,y-2,1,1);g.fillRect(dir>0?x+3:x-4,y+2,1,1)}
      else{g.fillRect(x-1,dir>0?y+1:y-2,3,2);g.fillStyle='#fff6a8';g.fillRect(x-2,dir>0?y+3:y-4,1,1);g.fillRect(x+2,dir>0?y+3:y-4,1,1)}
      g.fillStyle='#0e0b1c';g.fillRect(x,y,1,1)});
    const left=Math.max(0,60-t2);$('dpInfo').textContent=`⏱ ${left.toFixed(0)} сек · выполнено ${score} · сгорело ${lost}`;
    if(left<=0||fin){mgStop();const money=score*1500,rp=score>=12?2:score>=7?1:0;S.money+=money;S.rep=Math.min(100,S.rep+rp);S.cnt.disp=Math.max(S.cnt.disp||0,score);
      addLog(`Диспетчер: выполнено ${score} заказов, +${rub(money)}${rp?`, +${rp} к репутации`:''}.`);save();render();sfx(score>=7?'win':'coin');
      showModal(`<span class="step">ДИСПЕТЧЕР</span><h2>${score} заказов</h2><p>Бонус к выручке: ${rub(money)}${rp?`, репутация +${rp}`:''}. Сгорело заказов: ${lost}.</p><button class="btn" id="dpOk">Отлично</button>`);$('dpOk').onclick=hideModal;return}
    mgRaf=mgRAF(frame)};
  $('dpStop').onclick=()=>{fin=true};mgRaf=mgRAF(frame);
}
function enrollSchool(){if(!S.upg.school)return;if(S.school.length>=3)return toast('В школе уже 3 ученика');if(S.money<4000)return toast('Не хватает денег');
  const before=snap();S.money-=4000;S.school.push({ready:S.day+5});addLog('Набран ученик в школу водителей. Выпуск через 5 дней.');toast('Ученик зачислен');sfx('click');save();render(before)}
function setCustom(k,v){if(k==='name'){const E=EASTER[String(v).toUpperCase()];if(E){triggerScene(E[0]);toast(E[1]);S.cnt.easter=1;sfx('win')}}
  if((k==='color'||k==='logo'||k==='avatar'||k==='livery')&&skinLock(k,v))return toast(`Откроется за достижение «${achName(skinLock(k,v))}»`);S.custom[k]=v;G.custom=Object.assign({},S.custom);saveG();save();render()}

/* ---- обучение ---- */
const TUT=[
 ['Добро пожаловать в «ДСТ-24»','Вы — владелец таксопарка. Каждый день в три отдела приходят проблемы, а ваши решения влияют на деньги, репутацию, водителей и машины.'],
 ['Три отдела','Посередине три карточки: «Подключение» (водители и поддержка), «Автопарк» (ОСАГО, ДТП, документы) и «Сервис» (ремонт). Решите задачу в каждом — над дверью отдела погаснет красный «!».'],
 ['Показатели и город','Сверху — касса, репутация, водители и машины. Строка «Город» показывает новости, конкурентов и цены на бензин. Утром могут нагрянуть учредители, ГАИ или налоговая.'],
 ['Управление','Внизу пять разделов: «Гараж» (автосалон, ваши машины, база), «Люди» (водители и отделы), «Город» (карта районов, звание, филиалы), «Деньги» (финансы, бизнес, статистика) и «Ещё». Музыка, сохранение и новая игра — в кнопке «Меню» сверху.'],
 ['Советы и дилеммы','Секретарь Света подсказывает, что сейчас важнее всего. Начальник отдела отмечает вариант, который выбрал бы сам, — у каждого свой характер, и он запоминает, слушаете ли вы его. Метка «ДИЛЕММА» значит, что правильного ответа нет, а «аукнется позже» — что последствия придут через несколько дней.'],
 ['Конец дня','Когда все три задачи решены, нажмите «Закончить день». Вы увидите выручку и расходы. Растите парк, получайте звания — от «Хозяина гаража» до «Короля такси». Удачи!']];
function tutorial(i=0){
  if(i>=TUT.length){G.tutDone=true;saveG();hideModal();return}
  showModal(`<span class="step">ОБУЧЕНИЕ · ${i+1} ИЗ ${TUT.length}</span><h2>${TUT[i][0]}</h2><p>${TUT[i][1]}</p>
    <div class="btns"><button class="btn" id="tuNext">${i<TUT.length-1?'Дальше':'Начать игру'}</button>${i<TUT.length-1?'<button class="btn ghost" id="tuSkip">Пропустить</button>':''}</div>`);
  $('tuNext').onclick=()=>tutorial(i+1);if($('tuSkip'))$('tuSkip').onclick=()=>tutorial(TUT.length);$('tuNext').focus();
}

/* reach — выполнить до срока; keep — продержаться весь срок без нарушений */
const QMODE={shifts:'reach',revenue:'reach',premium:'reach',drivers:'reach',buynew:'reach',train:'reach',rep:'keep',nobreak:'keep',lineup:'keep',fair:'keep',noneg:'keep'};
const AGGS=['«Поехали»','«Мигом»','«Шашечка»'];
const trainSum=()=>S.train.reduce((a,b)=>a+b,0);
function questProg(){const q=S.quest;if(!q)return;
  if(q.type==='premium')q.prog=premiumN();
  if(q.type==='drivers')q.prog=S.drivers;
  if(q.type==='buynew')q.prog=(S.cnt.bought||0)-q.start;
  if(q.type==='train')q.prog=trainSum()-q.start;}
function questText(q){const T=q.target,f=q.type==='revenue'?rub(T):T;
  return {shifts:`Отработать ${T} смен за ${q.len} дней`,revenue:`Заработать ${f} выручки за ${q.len} дней`,premium:`Довести число машин «Комфорт» и выше до ${T}`,
    drivers:`Довести число водителей до ${T}`,buynew:`Купить ${T} машины в автосалоне`,train:`Повысить обучение любого отдела`,
    rep:`Держать репутацию не ниже ${T} все ${q.len} дней`,nobreak:`Не больше ${T} ночных поломок за ${q.len} дней`,lineup:`Каждый день держать на линии не меньше ${T} экипажей`,
    fair:'Не поднимать ставку «Эконом» выше рынка',noneg:`${q.len} дней без решений, роняющих репутацию`}[q.type]}
function newQuest(){
  const types=Object.keys(QMODE).filter(t=>t!==S.lastQuest),type=types[Math.random()*types.length|0];
  const act=Math.max(3,activeN());let target=0,len=7,start=0;
  if(type==='shifts')target=Math.round(act*7*1.05);
  if(type==='revenue'){const est=S.fleet.filter(c=>!c.b).sort((a,b)=>carRevM(b.m)-carRevM(a.m)).slice(0,activeN()).reduce((a,c)=>a+carRevM(c.m),0)*(.5+S.rep/100);target=Math.max(50000,Math.round(est*7*1.05/1000)*1000)}
  if(type==='premium')target=premiumN()+2;
  if(type==='drivers')target=S.drivers+3;
  if(type==='buynew'){target=2;start=S.cnt.bought||0}
  if(type==='train'){if(trainSum()>=9)return newQuest();target=1;start=trainSum()}
  if(type==='rep')target=Math.max(55,Math.min(90,S.rep));
  if(type==='nobreak')target=Math.max(1,Math.round(carsN()/6));
  if(type==='lineup'){target=Math.max(3,act-1);len=5}
  if(type==='fair')target=mk('Эконом');
  if(type==='noneg')len=5;
  const q={type,target,len,days:len,start,prog:0,agg:AGGS[rand(0,2)],reward:20000+carsN()*1500};
  q.t=questText(q);S.quest=q;S.lastQuest=type;questProg();save();
  showModal(`<span class="step">ЗАДАНИЕ ОТ АГРЕГАТОРА ${q.agg}</span><h2>${q.t}</h2><p>Срок — ${len} дней. Награда: ${rub(q.reward)} и приоритет в выдаче заказов на 5 дней. Провал — −2 к репутации.</p><button class="btn" id="qOk">Принять</button>`);
  sfx('alert');$('qOk').onclick=()=>{hideModal();runMorning()};render();
}
