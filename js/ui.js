// Таксопарк «ДСТ-24» — финал, выбор режима, отрисовка интерфейса, код сохранения
/* ================= ФИНАЛ ================= */
function gameOver(){
  if(!S.over)recordResult('банкрот');
  S.over=true;save();render();
  const why=S.money<0?'Касса ушла в минус. Парк закрыли за долги.':S.rep<=0?'Агрегатор отключил парк за низкий рейтинг.':'Все водители разошлись. Машины стоят во дворе.';
  showModal(`<h2>Парк закрыт</h2><p>${why}</p><p class="note">Продержались дней: ${S.day-1}. Машин было: ${carsN()}.${S.mode==='endless'?` Выполнено целей: ${S.goal}.`:''}</p><button class="btn" id="again">Попробовать снова</button>`);
  $('again').onclick=pickMode;
}
function finale(){
  if(S.mode==='story')return storyFinale();
  if(dailyLike()){const ct=S.mode==='contest',gk=ct?'contest':'daily',sc=dailyScore(),first=!S.over;if(first){recordResult(ct?'соревнование':'испытание дня');if(!G[gk]||G[gk].key!==S.dailyKey||sc>G[gk].best)G[gk]={key:S.dailyKey,best:sc};saveG()}
    S.over=true;save();render();
    showModal(`<span class="step">${ct?'СОРЕВНОВАНИЕ НЕДЕЛИ':'ИСПЫТАНИЕ ДНЯ'} · ${esc(S.dailyKey)}</span><h2>${sc.toLocaleString('ru-RU')} очков</h2><p>«${DAILY_SC[S.dailyIdx].n}». Касса ${rub(S.money)}, машин ${totalCars()}, репутация ${S.rep}.</p>
      <p class="note">${ct?'Лучший результат в этом соревновании':'Лучший результат сегодня'}: ${G[gk].best.toLocaleString('ru-RU')}. Отправьте друзьям — у них сегодня такое же испытание.</p><p class="note" id="dyPlace"></p><button class="btn" id="again">В меню</button>`);
    $('again').onclick=pickMode;netPlace();return}
  const pg=B(2)&&S.diff!=='easy',ok=[goalMet(),carsN()>=GOAL_CARS,S.rep>=50],win=ok.every(Boolean),stars=win&&B(2)?S.stars||starsOf():0;
  if(!S.over){S.stars=stars;recordResult('финиш')}
  S.over=true;save();render();
  showModal(`<h2>${win?'Империя «ДСТ-24»!':'Месяц позади'}</h2>${stars?`<p style="text-align:center;font-size:28px;color:var(--taxi);margin:4px 0">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</p>`:''}
    <div class="rows"><div class="row"><span>${pg?`Прибыль (нужно ${rub(goalBase())})`:`Касса (нужно ${rub(GOAL_MONEY)})`}</span><b class="${ok[0]?'pos':'neg'}">${rub(pg?profit():S.money)}</b></div>
    <div class="row"><span>Машин (нужно ${GOAL_CARS})</span><b class="${ok[1]?'pos':'neg'}">${carsN()}</b></div>
    <div class="row"><span>Репутация (нужно 50)</span><b class="${ok[2]?'pos':'neg'}">${S.rep}</b></div></div>
    <p>${win?'Вы выросли в большой парк: деньги есть, пассажиры довольны, Гена почти научился заправлять машины.':'Парк работает, но цель не достигнута. Попробуйте раньше вкладываться в машины и людей.'}</p>
    <button class="btn" id="again">Новая игра</button>`);
  $('again').onclick=pickMode;
}

function storyFinale(){
  const C=CHAPTERS[S.chapter],win=C.goal(S),first=!S.over;
  if(first)recordResult(win?'глава пройдена':'глава провалена');
  S.over=true;if(win&&first)G.story=Math.max(G.story||0,S.chapter+1);saveG();save();render();
  const next=win&&S.chapter+1<CHAPTERS.length;
  showModal(`<span class="step">СЮЖЕТ</span><h2 class="${win?'pos':'neg'}">${win?'Глава пройдена!':'Глава провалена'}</h2><p>${C.n}. Цель: ${C.goalTxt}.</p>
    <p>${win?(next?'Следующая глава открыта.':'Вы прошли весь сюжет «ДСТ-24»! Парк стал империей.'):'Попробуйте ещё раз: цель не выполнена в срок.'}</p>
    <div class="btns">${next?'<button class="btn" id="chNext">Следующая глава</button>':''}<button class="btn ghost" id="again">${win?'В меню':'Попробовать снова'}</button></div>`);
  if(next)$('chNext').onclick=()=>chooseHeads('story',{chapter:S.chapter+1});
  $('again').onclick=win?pickMode:()=>chooseHeads('story',{chapter:S.chapter});
}
/* ================= ВЫБОР РЕЖИМА И НАЧАЛЬНИКОВ ================= */
function pickMode(){
  const R=G.rec;
  showModal(`<h2>Таксопарк «${esc(G.custom&&G.custom.name||'ДСТ-24')}»</h2>${!G.tutDone?'<p class="hintbox">Впервые здесь? Начните с «Кампании» на лёгком уровне — игра будет открываться постепенно.</p>':''}
    ${holdG().earned?`<p class="note">Холдинг: очков свободно ${holdFree()} из ${holdG().earned}, франшиз ${holdG().fr.length}. Бонусы дерева действуют в новых партиях бесконечного режима.</p>`:''}
    <label class="chk"><input type="checkbox" id="simpleChk" ${G.simple!==false?'checked':''}> Режим новичка: возможности открываются постепенно, подсказки и советы</label><div class="modes">
    <button class="mode" id="mCamp"><b>КАМПАНИЯ</b><span>${DAYS} дней. Цель: ${GOAL_CARS} машин, прибыль или касса (зависит от сложности) и репутация 50+.</span></button>
    <button class="mode" id="mEnd"><b>БЕСКОНЕЧНЫЙ РЕЖИМ</b><span>Без лимита дней и машин. Цели идут одна за другой.</span></button>
    <button class="mode" id="mDaily"><b>ИСПЫТАНИЕ ДНЯ</b><span>«${DAILY_SC[dailyIdx()].n}»: ${DAILY_SC[dailyIdx()].d} 7 дней, одно испытание для всех.${G.daily&&G.daily.key===todayKey()?` Ваш рекорд сегодня: ${G.daily.best.toLocaleString('ru-RU')} очков.`:''}</span></button>
    ${netContest()?`<button class="mode" id="mContest"><b>СОРЕВНОВАНИЕ НЕДЕЛИ</b><span>«${esc(DAILY_SC[netCt(netContest()).sc].n)}»: ${esc(DAILY_SC[netCt(netContest()).sc].d)} 7 дней, одинаковые условия у всех игроков.</span></button>`:''}
    <button class="mode" id="mSand"><b>ПЕСОЧНИЦА</b><span>Бесконечные деньги, проиграть нельзя. Просто стройте парк мечты.</span></button>
    <button class="mode" id="mStory"><b>СЮЖЕТ</b><span>${CHAPTERS.length} главы с особыми условиями. Пройдено: ${Math.min(G.story||0,CHAPTERS.length)} из ${CHAPTERS.length}.</span></button></div>
    <button class="btn ghost" id="mLoad">Загрузить по коду сохранения</button>
    ${R.days?`<p class="note">Рекорд бесконечного режима: ${R.days} дн., ${R.cars} машин, ${rub(R.money)}, целей: ${R.goals}.</p>`:''}
    ${S&&!S.over&&!S.preview?'<p class="note">Текущая игра будет сброшена.</p><button class="btn ghost" id="mCancel">Отмена</button>':''}`);
  $('mCamp').onclick=()=>{ensureAudio();pickDiff('campaign')};
  $('mEnd').onclick=()=>{ensureAudio();pickDiff('endless')};
  $('mStory').onclick=()=>{ensureAudio();pickChapter()};
  $('simpleChk').onchange=e=>{G.simple=e.target.checked;saveG()};
  $('mDaily').onclick=()=>{ensureAudio();chooseHeads('daily',{diff:'normal'})};
  if($('mContest'))$('mContest').onclick=()=>{const e=netContest();if(!e)return;const c=netCt(e);ensureAudio();chooseHeads('contest',{diff:c.diff,seed:c.seed,sc:c.sc,cid:e.id})};
  $('mSand').onclick=()=>{ensureAudio();chooseHeads('sandbox',{diff:'easy'})};
  if($('mCancel'))$('mCancel').onclick=hideModal;
  $('mLoad').onclick=openSaveModal;
  $('mCamp').focus();
}
function pickDiff(mode){
  showModal(`<span class="step">${mode==='endless'?'БЕСКОНЕЧНЫЙ РЕЖИМ':'КАМПАНИЯ'}</span><h2>Сложность</h2><div class="modes">
    ${Object.entries(DIFF).map(([k,v])=>`<button class="mode" id="df_${k}"><b>${v.n.toUpperCase()}</b><span>${v.d}${mode==='campaign'?`. Цель: ${GOAL_CARS} машин, ${goalTxt(k)}, репутация 50+.`:''}</span></button>`).join('')}</div>
    <button class="btn ghost" id="dfBack">Назад</button>`);
  Object.keys(DIFF).forEach(k=>$('df_'+k).onclick=()=>mode==='endless'&&holdG().fr.length>0?pickCity(mode,{diff:k}):chooseHeads(mode,{diff:k}));$('dfBack').onclick=pickMode;$(G.tutDone?'df_normal':'df_easy').focus();
}
function pickChapter(){const done=G.story||0;
  showModal(`<span class="step">СЮЖЕТ</span><h2>Выберите главу</h2><div class="modes">
    ${CHAPTERS.map((C,i)=>`<button class="mode" id="ch_${i}" ${i>done?'disabled style="opacity:.5"':''}><b>${C.n.toUpperCase()}${i<done?' ✓':''}</b><span>${i>done?'Откроется после прошлой главы.':C.d+' Цель: '+C.goalTxt+'.'}</span></button>`).join('')}</div>
    <button class="btn ghost" id="chBack">Назад</button>`);
  CHAPTERS.forEach((C,i)=>{if(i<=done)$('ch_'+i).onclick=()=>chooseHeads('story',{chapter:i})});$('chBack').onclick=pickMode;
}
function chooseHeads(mode,opts={}){
  const heads=[null,null,null];
  const step=d=>{
    if(d>2){hideModal();newGame(mode,heads,opts);return}
    const p=G.pins[d];
    if(p&&HEADS[d].some(h=>h.key===p.key)){heads[d]={key:p.key,name:p.name};step(d+1);return}
    pickHead(d,key=>{heads[d]={key,name:HEADS[d].find(h=>h.key===key).name};step(d+1)},true);
  };
  step(0);
}
/* setup=true — выбор при старте игры; иначе — замена по требованию учредителя */
function pickHead(d,done,setup){
  const cur=!setup&&S?S.heads[d].key:null;
  const list=(setup?HEADS[d].filter(h=>!h.hidden):availHeads(d)).filter(h=>h.key!==cur);
  showModal(`<span class="step">${setup?`ШАГ ${d+1} ИЗ 3 · `:''}НАЧАЛЬНИК ОТДЕЛА</span><h2 style="color:${DEPTS[d].hex}">«${DEPTS[d].name}»</h2>
    <p class="note">${setup?'Выберите, кто возглавит отдел. Имя можно поменять и закрепить потом во вкладке «Отделы».':'Учредитель требует замену. Выберите нового начальника.'}</p>
    <div class="cands">${list.map(h=>`<button class="cand" data-k="${h.key}"><canvas class="face" width="16" height="16" data-face="cand:${d}:${h.key}"></canvas>
      <div><b>${esc(h.name)}</b><small><span style="color:var(--taxi)">${h.perk}.</span> ${h.desc}. Зарплата ${rub(h.pay)}/день.</small></div></button>`).join('')}</div>`);
  drawFaces();
  document.querySelectorAll('.cand').forEach(b=>b.onclick=()=>{
    if(setup){done(b.dataset.k);return}
    changeHead(d,b.dataset.k,true);hideModal();done&&done();});
}
function showModal(h){$('modalCard').innerHTML=h;$('modal').hidden=false;const m=h.match(/data-face="((?:founder|char|head):[\w]+|cand:\d:\w+)"/);if(m)voice(voiceFor(m[1]))}
function hideModal(){$('modal').hidden=true}

/* ================= ОТРИСОВКА ИНТЕРФЕЙСА ================= */
function chips(dl){
  const out=[];
  if(dl.money)out.push([dl.money>0,(dl.money>0?'+':'')+rub(dl.money)]);
  if(dl.rep)out.push([dl.rep>0,'реп '+(dl.rep>0?'+':'−')+Math.abs(dl.rep)]);
  if(dl.drivers)out.push([dl.drivers>0,(dl.drivers>0?'+':'−')+Math.abs(dl.drivers)+' вод.']);
  if(dl.cars)out.push([dl.cars>0,(dl.cars>0?'+':'−')+Math.abs(dl.cars)+' маш.']);
  if(dl.broken>0)out.push([false,dl.broken+' в ремонте']);
  return out.length?out.map(([up,t])=>`<span class="chip ${up?'up':'down'}">${t}</span>`).join(''):'<span class="chip">без изменений</span>';
}
function checkRank(){if(S.preview||S.over)return;
  while((S.rank||0)<RANKS.length-1&&RANKS[(S.rank||0)+1].need()){S.rank=(S.rank||0)+1;const R=RANKS[S.rank];
    addLog(`Новое звание: «${R.n}»! Открыто: ${R.unlock}.`);toast(`★ Звание: ${R.n}. Открыто: ${R.unlock}`);sfx('win');save()}}
/* ---- пиксельные иконки 16×16 «мягкий пиксель»: показатели, погода, новости, кнопки, цели ---- */
const ICON16={
 money:["................", ".....kkkkkk.....", "...kkddddddkk...", "..kddyyyyyyddk..", "..kdyllyyyyydk..", ".kdyllyyyyyyydk.", ".kdylyyddddyydk.", ".kdyyyydyydyydk.", ".kdyyyyddddyydk.", ".kdyyyddddyyydk.", ".kdyyyydyyyyydk.", "..kdyyyyyyyydk..", "..kddyyyyyyddk..", "...kkddddddkk...", ".....kkkkkk.....", "................"],
 day:["................", "...kk.....kk....", ".kkGkkkkkkGkkk..", ".krrrrrrrrrrrrk.", ".kRRRRRRRRRRRRk.", ".kwwwwwwwwwwwwk.", ".kwGGwGGwGGwwwk.", ".kwwwwwwwwwwwwk.", ".kwGGwGGwrrwwwk.", ".kwwwwwwwwwwwwk.", ".kwGGwGGwGGwwwk.", ".kwwwwwwwwwwwwk.", ".kggggggggggggk.", "..kkkkkkkkkkkk..", "................", "................"],
 drv:["................", ".....kkkkkk.....", "....kyyyyyyk....", "...kyyyyyyyykk..", "...kkkkkkkkkkkk.", "....kssssssk....", "....kscsscsk....", "....kssssssk....", ".....kssssk.....", "...kkttttttkk...", "..kttttwwttttk..", ".kttttttwtttttk.", ".kttTtttwtttTtk.", ".kttTtttttttTtk.", ".kkkkkkkkkkkkkk.", "................"],
 rep:["................", ".......kk.......", "......kyyk......", "......kylk......", ".....kyllyk.....", "kkkkkkyllyykkkkk", "kyyyyyllyyyyyydk", ".kyyyylyyyyyydk.", "..kyyyyyyyyydk..", "...kyyyyyyydk...", "...kyyyyyyyydk..", "..kyyyyddyyyydk.", "..kyyydkkdyyydk.", ".kyydkk..kkdyydk", ".kkkk......kkkk.", "................"],
 car:["................", "......kkkk......", "......kllk......", "....kkkkkkkk....", "...kbbbkbbbbk...", "..kWbbbkbbbbbk..", ".kkyyyyyyyyyykk.", "kyyyyyyyyyyyyyyk", "klyywcwcwcyyyyrk", "kyyycwcwcwyyyyyk", "kddddddddddddddk", ".kkckkkkkkkkckk.", "..kcgck..kcgck..", "...kkk....kkk...", "................", "................"],
 clear:["................", ".......yy.......", "..y....yy....y..", "...y........y...", ".....kkkkkk.....", "....klllyyyk....", "...klllyyyyyk...", "yy.klyyyyyydk.yy", "yy.kyyyyyyydk.yy", "...kyyyyyyddk...", "....kyyyyddk....", ".....kkkkkk.....", "...y........y...", "..y....yy....y..", ".......yy.......", "................"],
 rain:["................", "......kkkk......", ".....kwwwwk.....", "..kkkwwwwwwkk...", ".kwwwwwwwwwwwk..", "kwwwwwwwwwwwwwk.", "kgwwwwwwwwwwwgk.", ".kggggggggggggk.", "..kkkkkkkkkkkk..", "................", "...b...b...b....", "..b...b...b.....", "................", "....b...b...b...", "...b...b...b....", "................"],
 snow:["................", "......kkkk......", ".....kwwwwk.....", "..kkkwwwwwwkk...", ".kwwwwwwwwwwwk..", "kwwwwwwwwwwwwwk.", "kgwwwwwwwwwwwgk.", ".kggggggggggggk.", "..kkkkkkkkkkkk..", "................", "...w.....w......", "..www...www.....", "...w..w..w......", ".....www........", "......w.........", "................"],
 fog:["................", "................", "................", "..gggggggggg....", "...GGGGGGGG.....", "....gggggggggggg", "......GGGGGGGG..", ".gggggggggggg...", "..GGGGGGGGG.....", "...ggggggggggg..", ".....GGGGGGGG...", "..gggggggggg....", "................", "................", "................", "................"],
 heat:["................", "......kkk.......", ".....kwwwk......", ".....kwrwk..o...", ".....kwrwk.o.o..", ".....kwrwk......", ".....kwrwk..o...", ".....kwrwk.o.o..", ".....kwrwk......", "....kwwrwwk.....", "...kwrrrrrwk....", "...krrlrrrrk....", "...krrrrrrRk....", "....krrrrRk.....", ".....kkkkk......", "................"],
 wind:["................", "................", "................", "..gggggggggg....", "............g...", "............g...", ".gggggggggggg...", "................", "....ggggggggg...", ".............g..", "..........nn.g..", "..gggggg..nnn...", "...........n....", "................", "................", "................"],
 up:["................", "...........kkkk.", "............knk.", "...........knnk.", "..........knk.k.", ".........knk....", "....kk..knk.....", "...knnkknk......", "..knk.knk.......", ".knk..kk........", ".kk.............", "................", ".GGGGGGGGGGGGGG.", "................", "................", "................"],
 fuel:["................", "..kkkkkkkk......", "..krrrrrrk......", "..krwwwwrk.kk...", "..krwkkwrk..k...", "..krwwwwrk..k...", "..krrrrrrkk.k...", "..krrrrrrk.kk...", "..krrrrrrk.k....", "..krRrrrrk.k....", "..krRrrrrkkk....", "..krRrrrrk......", "..krrrrrrk......", ".kkkkkkkkkk.....", ".kggggggggk.....", ".kkkkkkkkkk....."],
 tax:["................", "...kkkkkkkk.....", "...kwwwwwwwkk...", "...kwwwwwwwkgk..", "...kwwwwwwwkkkk.", "...kwrrwwwrwwwk.", "...kwrrwwrwwwwk.", "...kwwwwrwwwwwk.", "...kwwwrwwrrwwk.", "...kwwrwwwrrwwk.", "...kwwwwwwwwwwk.", "...kwGGGGGGGwwk.", "...kwwwwwwwwwwk.", "...kwGGGGGwwwwk.", "...kkkkkkkkkkkk.", "................"],
 alert:["................", ".......kk.......", "......kyyk......", "......kyyk......", ".....kyyyyk.....", ".....kykkyk.....", "....kyykkyyk....", "....kyykkyyk....", "...kyyykkyyyk...", "...kyyykkyyyk...", "..kyyyyyyyyyyk..", "..kyyyykkyyyyk..", ".kyyyyykkyyyyyk.", ".kdddddddddddddk", ".kkkkkkkkkkkkkk.", "................"],
 gai:["................", "..b..........r..", "...b..kkkk..r...", ".....kbbrrk.....", "....kbBbrRrk....", ".b..kbBbrRrk..r.", "....kbbbrrrk....", "...kkkkkkkkkk...", "...kggggggggk...", "...kkkkkkkkkk...", "................", "................", "................", "................", "................", "................"],
 agg:["................", "................", "....kkkkkkkk....", "....kGGGGGGk....", "....kbbbbbbk....", "....kbwcwcbk....", "....kbcwcwbk....", "....kbwcwcbk....", "....kbbbbbbk....", "....kbnnnnbk....", "....kbbbbbbk....", "....kGGGGGGk....", "....kGGwwGGk....", "....kkkkkkkk....", "................", "................"],
 pin:["................", ".....kkkkkk.....", "....kpllpppk....", "...kplpppppPk...", "...kppkkkppPk...", "...kppkwkppPk...", "...kppkkkppPk...", "...kpppppppPk...", "....kpppppPk....", "....kppppPPk....", ".....kppPPk.....", "......kpPk......", ".......kk.......", "................", "....GGGGGGGG....", "................"],
 city:["................", "................", "................", "..........kkkk..", "..kkkk....kbbk..", "..kbbk....kybk..", "..kybk.kkkkbbk..", "..kbbk.kbbkybk..", "kkkbbkkkybkbbkkk", "kbkybkbkbbkybkbk", "kbkbbkbkybkbbkbk", "kkkkkkkkkkkkkkkk", "................", "................", "................", "................"],
 pause:["................", "................", "................", "...kkkk..kkkk...", "...kwwk..kwwk...", "...kwwk..kwwk...", "...kwwk..kwwk...", "...kwwk..kwwk...", "...kwwk..kwwk...", "...kwwk..kwwk...", "...kwwk..kwwk...", "...kwwk..kwwk...", "...kkkk..kkkk...", "................", "................", "................"],
 menu:["................", "................", "................", "..kkkkkkkkkkkk..", "..kwwwwwwwwwwk..", "..kkkkkkkkkkkk..", "................", "..kkkkkkkkkkkk..", "..kwwwwwwwwwwk..", "..kkkkkkkkkkkk..", "................", "..kkkkkkkkkkkk..", "..kwwwwwwwwwwk..", "..kkkkkkkkkkkk..", "................", "................"],
 flag:["................", "..kkkkkkkkkkk...", "..kwcwcwcwcwk...", "..kcwcwcwcwck...", "..kwcwcwcwcwk...", "..kcwcwcwcwck...", "..kkkkkkkkkkk...", "..kk............", "..kk............", "..kk............", "..kk............", "..kk............", "..kk............", "..kk............", ".kkkk...........", "................"]};
Object.assign(ICON16,{o_coffee:["................","..kkkkkkkkkkkk..","..kGGGGGGGGGGk..","..kGwwGGGrGGGk..","..kGGGGGGGGGGk..","..kkkkkkkkkkkk..","..kggggggggggk..","..kgggkkkkgggk..","..kgggk..kgggk..","..kggg.oo.gggk..","..kgggkwwkgggk..","..kgggkwwkgggk..","..kgggkkkkgggk..","..kkkkkkkkkkkk..",".kGGGGGGGGGGGGk.",".kkkkkkkkkkkkkk."],o_portrait:["................",".kkkkkkkkkkkkkk.",".kddddddddddddk.",".kdBBBBBBBBBBdk.",".kdBBBsssssBBdk.",".kdBBsscssscBdk.",".kdBBsssssssBdk.",".kdBBBssrrsBBdk.",".kdBBBBsssBBBdk.",".kdBBkkkkkkkBdk.",".kdBkttttttkBdk.",".kdBkttttttkBdk.",".kddddddddddddk.",".kkkkkkkkkkkkkk.","................","................"],o_office:["................",".kkkkkkkkkkkkkk.",".kbbbbbbbbbbbbk.",".kbbbbbbbbbbbbk.",".kbbbbkkbbbbbbk.",".kbbbkodkbbbbbk.",".kbbbkoodkbbbbk.",".kbbbbkkkbbbbbk.",".kbbbbbbbbbbbbk.",".kbbbbbbbbbbbbk.",".kddddddddddddk.",".kddddddddddddk.",".kkkkkkkkkkkkkk.","................","................","................"],o_merch:["................","................","...kk......kk...","..kttk....kttk..",".kttttkkkkttttk.",".kttttttttttttk.",".kttttttttttttk.","..kttttyyttttk..","..kttttyyttttk..","..kttttttttttk..","..kttttttttttk..","..kttttttttttk..","..kttttttttttk..","..kkkkkkkkkkkk..","................","................"],o_watch:["................",".....kkkkkk.....",".....kwwwwk.....","....kkkkkkkk....","...kyyyyyyyyk...","..kylllyyyyyyk..","..kylwwwwwwyyk..","..kylwkwwwkwyk..","..kylwwkkkwwyk..","..kyyywwwkwyyk..","..kyyywwwwwyyk..","...kdyyyyyydk...","....kkkkkkkk....",".....kwwwwk.....",".....kkkkkk.....","................"],o_gym:["................","................","................",".kk..........kk.",".kGk........kGk.","kGGGkkkkkkkkGGGk","kGGGggggggggGGGk","kGGGkkkkkkkkGGGk",".kGk........kGk.",".kk..........kk.","................","................","................","................","................","................"],o_car:["................","................","................","................","....kkkkkkkk....","...kbbbbbbbbk...","..kbbwbbwbbbbk..",".kkkkkkkkkkkkkk.","kkcccccccccccckk","kcccccccccccccck","kcccyccccccyccck","kcccccccccccccck",".kkkkkkkkkkkkkk.","..kgk......kgk..","..kkk......kkk..","................"],o_driver:["................",".....kkkkkk.....","....kcccccck....","...kccccccccck..","...kkkkkkkkkk...","....kssssssk....","....kscsscsk....","....kssssssk....",".....kssssk.....","...kkcwwwwckk...","..kcccwwrwcccck.",".kcccccwwcccccck",".kcccccccccccck.",".kcccccccccccck.",".kkkkkkkkkkkkk..","................"],o_corp:["................","..r...y...b..n..","...r.....y.b.n..",".......y........",".b..r.....kkkk..","..........kyyk..",".y....kkkkkyyk..","....kkyyyyyyyyk.","...kyyyyyykkkk..","...kyyyyyyk.....","....kyyyyk......",".....kkkkk......","......kk........",".....kyyk.......","....kkkkkk......","................"],o_dacha:["................","..........kk....",".....kk..kRk....","....krrkkkRk....","...krrrrrrRk....","..krrrrrrrrRk...",".krrrrrrrrrrRk..","kkkkkkkkkkkkkkk.",".kwwwwwwwwwwwk..",".kwwbbwwkkwwwk..",".kwwbbwwkoowwk..",".kwwwwwwkoowwk..",".kkkkkkkkkkkkk..","nNnNnNnNnNnNnNnN","bbbbbbbbbbbbbbbb","................"],o_museum:["................","................","......kkkk......","....kkddddkk....","...kdyyyyyydk...","..kkkkkkkkkkkk..","..kwkwkwkwkwkk..","..kwkwkwkwkwkk..","..kwkwkwkwkwkk..","..kwkwkwkwkwkk..","..kwkwkwkwkwkk..",".kkkkkkkkkkkkkk.",".kggggggggggggk.",".kkkkkkkkkkkkkk.","................","................"],o_yacht:["................",".......k........","......kwk.......",".....kwwwk......","....kwwwwwk.....","...kwwwwwwwk....","..kwwwwwwwwwk...",".kkkkkkkkkkkkkk.",".kwwwwwwwwwwwwk.","..kRRRRRRRRRRk..","..kkrrrrrrrrkk..","...kkkkkkkkkk...","bbbbbbbbbbbbbbbb",".BBBBBBBBBBBBB..","................","................"],});
const P16={k:'#0e0b1c',y:'#f7c331',l:'#fff6a8',d:'#c9951a',w:'#f3ecdc',W:'#e8f6ff',g:'#a8a0cc',G:'#5a5285',r:'#ff6b6b',R:'#c23a3a',b:'#9fd3ff',B:'#4a88c8',
  t:'#4fc7b0',T:'#2e8a78',o:'#ff8a4c',n:'#86e06f',N:'#4a9a3a',s:'#f0c8a0',c:'#1a1530',p:'#e66fa8',P:'#a8406a'};
/* варианты на основе других иконок: [основа, замена цветов, отразить по вертикали] */
const ICON_ALT={down:['up',{n:'#ff6b6b'},1],warn:['alert',{}],crisis:['alert',{y:'#ff6b6b',d:'#c23a3a'}],rival:['car',{y:'#ff8a4c',l:'#ffb07a',d:'#c25a22'}]};
function icon16(k,sz=32){let rows=ICON16[k],pal=P16;const A=ICON_ALT[k];if(A){rows=ICON16[A[0]];pal=Object.assign({},P16,A[1]);if(A[2])rows=[...rows].reverse()}
  if(!rows)return'';let r='';rows.forEach((row,y)=>{for(let x=0;x<16;){const ch=row[x];if(ch==='.'){x++;continue}let e=x;while(e<16&&row[e]===ch)e++;r+=`<rect x="${x}" y="${y}" width="${e-x}" height="1" fill="${pal[ch]}"/>`;x=e}});
  return `<svg class="i16" width="${sz}" height="${sz}" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`}
/* всплывающая сумма у кассы, монетки летят в неё и со стоянки во дворе */
function popMoney(d){const st=document.querySelector('.stat.money');if(!st)return;const el=document.createElement('span');el.className='pop '+(d>0?'pos':'neg');el.textContent=(d>0?'+':'')+rub(d);st.appendChild(el);setTimeout(()=>el.remove(),1400);
  if(d>=1000&&!still){for(let i=0;i<6;i++){const c=document.createElement('i');c.className='coin';c.style.setProperty('--x0',(Math.random()*80-20)+'px');c.style.setProperty('--y0',(50+Math.random()*40)+'px');c.style.animationDelay=i*.07+'s';st.appendChild(c);setTimeout(()=>c.remove(),1400)}
    for(let i=0;i<10;i++)emit('coin',190+Math.random()*120,60+Math.random()*30,(Math.random()-.5)*.5,-.9-Math.random()*.4,45,'',2)}}
/* лёгкая тряска при плохих новостях */
function jolt(){if(still)return;const w=document.querySelector('.wrap');w.classList.remove('jolt');void w.offsetWidth;w.classList.add('jolt')}
function renderHud(prev){
  const endless=!hasLimit(),cars=carsN(),broken=brokenN(),active=activeN(),now=snap();
  const date=dateOf(S.day),sea=season(date),hol=HOLIDAYS[mmdd(date)];
  $('date').innerHTML=`${WD[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}<span class="dsea"> · ${sea.n}</span>${hol?' · '+hol[1]:''}`;
  $('parkName').textContent=`Таксопарк «${parkName()}»`;
  $('goalHead').innerHTML=(S.mode==='sandbox'?'Песочница: деньги без счёта, проиграть нельзя.':dailyLike()?`<b>${S.mode==='contest'?'Соревнование недели':'Испытание дня'} «${DAILY_SC[S.dailyIdx||0].n}».</b> Очки сейчас: ${dailyScore().toLocaleString('ru-RU')}.`:S.mode==='story'?`<b>${CHAPTERS[S.chapter].n}.</b> Цель: ${CHAPTERS[S.chapter].goalTxt}.`:endless?'Бесконечный режим: цели одна за другой.':`Цель к ${DAYS}-му дню: <b>${GOAL_CARS} машин</b> · <b>${B(2)&&S.diff!=='easy'?`прибыль ${rub(Math.max(0,profit()))} / ${rub(goalBase())}`:rub(GOAL_MONEY)}</b> · репутация <b>50+</b>`)+` <span class="sub">· ${dif().n}.${S.strategy&&S.day<S.strategy.until?` Стратегия: «${STRATS[S.strategy.id].n}» ещё ${S.strategy.until-S.day} дн.`:''}</span>`;
  $('rank').textContent='★ '+rankName(S.rank||0);
  const stats=[
    ['money','Касса',rub(S.money),null,'money'],
    ['day','День',endless?String(S.day):Math.min(S.day,dayLimit())+'/'+dayLimit(),endless?null:Math.min(S.day,dayLimit())/dayLimit()*100],
    ['drv','Водители',String(S.drivers)+(S.drivers<cars-broken?` <small class="neg">(−${cars-broken-S.drivers})</small>`:''),null],
    ['rep','Репутация',S.rep+'/100',S.rep,'rep'],
    ['car','Машины на линии',`${active} из ${cars}`,cars?active/cars*100:0,'cars']];
  const dayUp=renderHud.day!=null&&S.day>renderHud.day;renderHud.day=S.day;
  const chg={money:['money'],day:[],drv:['drivers'],rep:['rep'],car:['cars','broken']};
  $('hud').innerHTML=stats.map(([k,l,v,b,key])=>{
    let fl='';if(prev&&key&&prev[key]!==now[key])fl=now[key]>prev[key]?'flash-up':'flash-down';
    let bump=k==='day'&&dayUp?' b-up':'';if(prev)chg[k].forEach(f=>{if(prev[f]!==now[f])bump=(f==='broken'?now[f]<prev[f]:now[f]>prev[f])?' b-up':' b-down'});
    return `<div class="stat px ${k}"><span class="lbl">${l}</span><div class="sv"><span class="badge${bump}"${k==='car'&&broken?` title="${broken} в ремонте"`:''}>${icon16(k)}${k==='car'&&broken?`<i class="bn">${broken}</i>`:''}</span><span class="val ${fl}"${k==='money'?' id="moneyVal"':''}>${v}</span></div>${b!=null?`<div class="bar"><i style="width:${Math.min(100,b)}%"></i></div>`:''}</div>`}).join('');
  if(prev){const dm=now.money-prev.money;if(Math.abs(dm)>=1)popMoney(dm);if(now.rep<prev.rep||now.broken>prev.broken)jolt()}
}
let freshDesks=false;
let shownMoney=null,moneyRaf=null;
function countMoney(){const el=$('moneyVal');if(!el||shownMoney===null||Math.abs(shownMoney-S.money)<1){shownMoney=S.money;return}
  const from=shownMoney,to=S.money,t0=performance.now();cancelAnimationFrame(moneyRaf);
  const st=ts=>{const p=Math.min(1,(ts-t0)/600),e=1-Math.pow(1-p,3);const v=from+(to-from)*e;const el2=$('moneyVal');if(el2)el2.textContent=rub(v);shownMoney=v;if(p<1)moneyRaf=requestAnimationFrame(st);else shownMoney=to};moneyRaf=requestAnimationFrame(st)}
function render(prev){
  if(!S)return;
  if(!S.weather||S.weather.length<3)S.weather=[0,1,2].map(i=>genWeather(S.day+i));if(!S.dmods)rollDistricts();
  syncDrivers();checkGoals();checkRank();checkAch();
  const mFrom=shownMoney;
  const endless=!hasLimit();
  renderHud(prev);
  if(mFrom!==null&&mFrom!==S.money&&!still){const el=$('moneyVal');if(el)el.textContent=rub(mFrom);shownMoney=mFrom;countMoney()}else shownMoney=S.money;
  // лента города: прогноз погоды карточками, затем новости с иконкой, цветом, эффектом и сроком
  const eff=(v,lbl,inv)=>{const p=Math.round((v-1)*100);if(!p)return'';return `<span class="fx ${(inv?p<0:p>0)?'up':'down'}">${lbl} ${p>0?'+':'−'}${Math.abs(p)}%</span>`};
  const wx=(k,i)=>{const Wd=WEATHER[k];const fx=eff(Wd.demand,'спрос')+eff(Wd.fail,'поломки',1);
    return `<div class="wx${i?'':' now'}" title="${['Сегодня','Завтра','Послезавтра'][i]}: ${Wd.n.toLowerCase()}${fx?' · '+fx.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim():''}">${icon16(k,i?16:32)}<div><small>${['Сегодня','Завтра','Послезавтра'][i]}</small><b>${Wd.n}</b>${i?'':`<span class="fxs">${fx}</span>`}</div></div>`};
  const pips=(left,total)=>{total=Math.min(7,Math.max(left,total||0));left=Math.min(left,total);return `<span class="pips" title="ещё ${left} дн.">${'<i class="on"></i>'.repeat(left)}${'<i></i>'.repeat(total-left)}</span>`};
  const card=(tone,ic,title,sub='',days=0,total=0,extra='',tip='')=>`<div class="nw ${tone}${extra}" title="${esc(tip||String(title+(sub?' · '+sub:'')+(days?` · ещё ${days} дн.`:'')).replace(/<[^>]+>/g,''))}">${icon16(ic,16)}<div class="nw-t"><b>${title}</b>${sub?`<small>${sub}</small>`:''}</div>${days?pips(days,total):''}</div>`;
  const NICON={fuel:'fuel',snow:'snow',raid:'gai',comm:'agg',outage:'agg',outage2:'agg',lowprio:'agg',backup:'agg',prio:'agg',photo:'agg',strike:'warn',war:'rival',vipl:'rival'};
  const tick=S.news.filter(n=>n.id!=='raidgai'&&!aggNews(n)).map(n=>{const N=newsDef(n);const up=(N.demand||1)>1;const down=(N.demand||1)<1||N.leave||N.fail||N.risk1||N.repair;
    return card(up?'up':down?'down':'',NICON[n.id]||(down?'down':'up'),N.t,N.d,n.days,(NEWS.find(x=>x.id===n.id)||{}).days)});
  if(B(4)&&S.aggNext===S.day)tick.push(card('down','agg',`Переход на «${AGG[S.agg].n}»`,'половина парка простаивает'));
  if(warOn())tick.push(card('down','rival','Ценовая война',`«${esc(S.war.by)}» · спрос ×${bal('warK')}`,S.war.at+S.war.len-S.day));
  else if(warSoon()&&featOpen('rival'))tick.push(card('down','rival','Завтра ценовая война',`«${esc(S.war.by)}» · спрос ×${bal('warK')} на ${S.war.len} дн.`));
  if(S.raid)tick.push(card('down','gai','Рейды ГАИ',`подготовка ${Math.round(S.raid.prep*100)}%`,S.raid.days));
  if((S.tdebt||0)>=4)tick.unshift(card('down','warn',`Отложенные проблемы: ${S.tdebt}/8`,'дешёвые решения копятся'));
  if(taxOn()&&taxDueIn()<=10)tick.unshift(card('down','tax',`Налог через ${taxDueIn()+1} дн.`,`≈${rub(Math.round(S.taxAcc*taxRate()/1000)*1000)}`));
  if(satK()<.97)tick.unshift(card('down','down','Рынок насыщен',`выручка с машины ×${satK().toFixed(2)}`));
  if(S.city&&S.city!=='home')tick.unshift(card('','city',cityDef().n));
  if(S.crisis)tick.unshift(card('down','crisis',`Кризис: ${CRISES[S.crisis.id].n}`,CRISES[S.crisis.id].d,S.crisis.days,0,' crisis'));
  (S.dnews||[]).forEach(e=>tick.push(card(e.m>1?'up':'down','pin',`${DISTRICTS.find(D=>D.k===e.d).n}: ${e.t}`,`спрос ×${e.m}`)));
  if(S.union)tick.push(card('down','warn','Профсоюз водителей'));
  if(Math.abs(S.fuel-1)>.06)tick.push(card(S.fuel>1.05?'down':S.fuel<.95?'up':'','fuel',`Бензин ${(58*S.fuel).toFixed(1).replace('.',',')} ₽/л`,`уходы водителей +${pct1(fuelP())}/день`,0,0,'',fuelInfo()));
  {const top=[...S.rivals].sort((a,b)=>b.cars-a.cars)[0];if(top&&top.cars>totalCars())tick.push(card('down','rival',`«${esc(top.name)}» больше вас`,`${top.cars} маш.`))}
  $('ticker').innerHTML=`<span class="lab">${icon16('city',16)}Город</span><div class="wxs">${[0,1,2].map(i=>wx(S.weather[i],i)).join('')}</div>${tick.length?`<div class="tk">${tick.join('')}</div>`:''}`;
  let tasks='';
  if(endless){const g=goalAt(S.goal),v=Math.max(0,g.v()),pct=Math.min(100,v/g.n*100);
    const vs=g.n>=1000?`${rub(v)} / ${rub(g.n)}`:`${Math.min(v,g.n)} / ${g.n}`;
    tasks+=`<div class="goalbox px"><span class="lvl">${icon16('flag',16)}ЦЕЛЬ ${S.goal+1}</span><span class="gt">${g.t} <span class="hint">· ${vs}</span></span><span class="gr">Награда: ${rwText(g.rw)}</span><div class="bar"><i style="width:${pct}%"></i></div></div>`}
  if(S.quest){const q=S.quest;questProg();if(!q.len)q.len=7;let pct,vs;
    if(QMODE[q.type]==='reach'){vs=q.type==='revenue'?`${rub(q.prog)} / ${rub(q.target)}`:`${Math.max(0,q.prog)} / ${q.target}`;pct=Math.max(0,q.prog)/q.target*100}
    else{vs=q.failed?'нарушено':q.type==='nobreak'?`поломок: ${q.prog} из ${q.target}`:'пока без нарушений';pct=(q.len-q.days)/q.len*100}
    tasks+=`<div class="goalbox quest px"><span class="lvl">${icon16('agg',16)}АГРЕГАТОР ${q.agg||''}</span><span class="gt">${q.t||questText(q)} <span class="hint">· ${vs} · осталось ${q.days} дн.</span></span><span class="gr">Награда: ${rub(q.reward)} и приоритет</span><div class="bar green"><i style="width:${Math.min(100,pct)}%"></i></div></div>`}
  if(S.kpi){const pct=Math.min(100,S.kpi.acc/S.kpi.rev*100),left=Math.max(0,S.nextMeeting-S.day);tasks+=`<div class="goalbox kpi px"><span class="lvl">${icon16('up',16)}ПЛАН</span><span class="gt">Выручка ${rub(S.kpi.acc)} из ${rub(S.kpi.rev)} <span class="hint">· до собрания ${left} дн.</span></span><span class="gr">Выполните — премия и +2 реп. Провал дважды подряд — смена начальника.</span><div class="bar ${pct>=100?'green':''}"><i style="width:${pct}%"></i></div></div>`}
  $('tasks').innerHTML=tasks;$('tasks').hidden=!tasks;

  $('desks').innerHTML=DEPTS.map((D,d)=>{
    const ev=getEv(d,S.today[d]),res=S.done[d],chain=typeof S.today[d]==='string';
    let body=`${ev.f||chain||ev.dl?`<div class="badges">${ev.dl?'<span class="dilem">ДИЛЕММА</span><span class="dilem-t">правильного ответа нет</span>':''}${ev.f?'<span class="funny">СЛУЧАЙ ИЗ ЖИЗНИ</span>':''}${chain?'<span class="chainb">ПРОДОЛЖЕНИЕ ИСТОРИИ</span>':''}</div>`:''}
      <div class="ev-text">${ev.who?`<canvas class="face" width="16" height="16" data-face="char:${ev.who}"></canvas>`:''}<p>${ev.x}</p></div>`;
    if(res){body+=`<div class="result"><strong>${ev.c[res.choice].l}</strong><p>${res.msg}</p><div class="chips">${chips(res.delta)}</div>${ev.c[res.choice].e?'<p class="later">⏳ Последствия ещё впереди…</p>':''}</div>`}
    else{const hp=headPick(d,ev),hn=esc(S.heads[d].name.split(' ')[0]);let op=-1,on='';if(ev.dl&&hp>=0){for(const d2 of [0,1,2]){if(d2===d||headBias(d2)===headBias(d))continue;const p2=headPick(d2,ev);if(p2>=0&&p2!==hp){op=p2;on=esc(S.heads[d2].name.split(' ')[0]);break}}}
      body+=`<div class="choices">${ev.c.map((c,i)=>{
        const cost=evCost(c,d),gain=(c.fx&&c.fx.money)?scx(c.fx).money:0;
        const tag=cost?`<span class="tag${cost>S.money?' short':''}">${rub(-cost)}${cost>S.money?'<small>не хватает</small>':''}</span>`:gain>0?`<span class="tag plus">+${rub(gain)}</span>`:'';
        return `<button class="choice${i===hp?' advised':''}" data-d="${d}" data-i="${i}" id="c${d}-${i}"><span class="cl">${c.l}<span class="effs">${i===hp?`<i class="eff adv">совет: ${hn}</i>`:''}${i===op?`<i class="eff adv2">${on}: «я бы так»</i>`:''}${effChips(c)}</span></span>${tag}</button>`}).join('')}</div>`}
    return `<article class="desk px${ev.dl&&!res?' dl':''}" style="--dc:${D.color}">
      <div class="desk-head"><h2>${D.name}</h2><div class="boss"><span>${esc(S.heads[d].name)}<br><small style="font-weight:400">${headDef(d).perk}</small></span><canvas class="face" width="16" height="16" data-face="head:${d}"></canvas></div></div>
      <div class="desk-body"><h3>${ev.t}</h3>${body}</div>${res?'<span class="stamp">РЕШЕНО</span>':''}</article>`}).join('');

  const A=advice();
  $('advisor').hidden=!A||!simpleOn()&&G.advisor===false;
  if(A)$('advisor').innerHTML=`<canvas class="face" width="16" height="16" data-face="char:sveta"></canvas><div class="adv-t"><b>Секретарь Света советует</b><span>${A.t}</span></div>${A.act==='save'?'<button class="buy sm" id="advSave">Сохранить</button>':A.tab&&tabOpen(A.tab)?`<button class="buy sm" id="advGo" data-go="${A.tab}">Открыть</button>`:''}`;
  if($('advSave'))$('advSave').onclick=()=>{ensureAudio();openSaveModal()};
  if($('advGo'))$('advGo').onclick=()=>{uiTab=$('advGo').dataset.go;renderMgmt();drawFaces();document.querySelector('.mgmt').scrollIntoView({behavior:'smooth',block:'start'})};
  renderMgmt();
  const left=S.done.filter(x=>!x).length;
  $('endDay').disabled=left>0||S.over||!!S.preview;
  $('autoBtn').hidden=S.over||!!S.preview||left===0||(simpleOn()&&S.day<10);
  document.body.classList.toggle('big',!!G.big);document.body.classList.toggle('cb',!!G.cb);
  $('endDay').classList.toggle('ready',left===0&&!S.over&&!S.preview);
  if(freshDesks){freshDesks=false;const dk=$('desks');dk.classList.remove('fresh');void dk.offsetWidth;dk.classList.add('fresh');setTimeout(()=>dk.classList.remove('fresh'),900)}
  $('endDay').textContent=!endless&&S.day>=dayLimit()?'Подвести итоги →':'Закончить день →';
  $('hint').textContent=S.over?'Игра окончена':left?`Осталось решить: ${left}`:'Все задачи решены. Машины ждут смену.';
  $('log').innerHTML=S.log.map(e=>`<li><span>Д${e.d}</span>${e.t}</li>`).join('');
  try{face($('ownerC').getContext('2d'),AVATARS[S.custom.avatar||0]);drawLogo($('logoC').getContext('2d'),S.custom.logo,0,0,'#f7c331')}catch(e){}
  $('musicBtn').classList.toggle('on',G.music);$('sfxBtn').classList.toggle('on',G.sfx);
  drawFaces();
}

const MGROUPS=[['garage','Гараж',['shop','fleet','base']],['people','Люди',['drivers','depts']],['town','Город',['map','city','branch']],['cash','Деньги',['fin','biz','stats']],['more','Ещё',['style','ach']]];
let lastSub={};
const MTABS=[['shop','Автосалон'],['fleet','Мой парк'],['drivers','Водители'],['depts','Отделы'],['map','Карта'],['biz','Бизнес'],['branch','Филиалы'],['base','База'],['fin','Финансы'],['stats','Статистика'],['city','Город'],['style','Мой стиль'],['ach','Достижения']];
function hireCard(){const off=S.over||S.preview,working=carsN()-brokenN(),free=Math.max(0,working-S.drivers);
  return `<div class="card2 hire${free>0?' need':''}"><div class="car-top"><canvas class="mini" width="38" height="17" data-m="person"></canvas>
    <div><h3>Нанять водителей</h3><div class="kind">вакансия на Авито</div></div></div>
    <div class="specs"><div class="spec"><span>Размещение</span><b>${rub(HIRE_COST)}</b></div>
    <div class="spec"><span>Обычно приходит</span><b>1–2 вод.</b></div>
    <div class="spec"><span>Машин без водителя</span><b class="${free?'neg':''}">${free}</b></div></div>
    <div class="btns"><button class="buy" id="hireBtn" ${S.hired||off||S.money<HIRE_COST?'disabled':''}>${S.hired?'Сегодня уже размещена':'Разместить'}</button></div></div>`}
const b3=()=>B(3);
/* карточка смен: bal 3 — вторая смена и усталость (во вкладке «Водители»), раньше — ночная смена (на карте) */
function shiftCard(dis){
  if(b3()){const mx=bal('shiftMax'),owl=S.dlist.filter(d=>d.t==='night').length;
    return `<div class="card2" style="grid-column:1/-1"><h3>Вторая смена</h3><div class="row2"><span>Вторая смена: <b id="nightV">${S.shift2||0}%</b> парка</span><span>Усталость: <b class="${S.fat>=bal('fatFrom')?'neg':S.fat<bal('fatFrom')-20?'pos':''}">${Math.round(S.fat||0)}%</b></span></div>
      <input type="range" id="nightR" min="0" max="${mx}" step="10" value="${S.shift2||0}" ${dis} aria-label="Доля второй смены" style="min-height:44px">
      <div class="bar ${S.fat<bal('fatFrom')-20?'green':''}"><i style="width:${S.fat||0}%"></i></div>
      <p class="sub">Вторая смена даёт до +${Math.round(mx*bal('shiftRev'))}% выручки, но водители устают: до ${bal('fatFrom')}% усталость не мешает, а выше машины ломаются чаще (до +${Math.round(bal('fatFail')*100)}%), штрафы выше, лояльность падает, а свыше ${bal('fatLeaveAt')}% водители увольняются. Без второй смены усталость спадает. «Совы» не устают${owl?` (у вас их ${owl})`:''}.</p></div>`}
  return `<div class="card2" style="grid-column:1/-1"><h3>Смены</h3><div class="row2"><span>Ночная смена: <b id="nightV">${S.night}%</b> водителей</span></div>
        <input type="range" id="nightR" min="0" max="50" step="5" value="${S.night}" ${dis} aria-label="Доля ночной смены">
        <p class="sub">Ночью заказы дороже (до +12,5% выручки), но водители устают (лояльность падает), машины ломаются чаще, а на рейдах останавливают чаще. «Совы» ночь любят.</p></div>`}
function renderMgmt(){
  if(!tabOpen(uiTab))uiTab='shop';
  G.seenTabs=G.seenTabs||{};
  const vis=MTABS.filter(([k])=>tabOpen(k));
  const lab=k=>(MTABS.find(t=>t[0]===k)||[k,k])[1],dot=k=>simpleOn()&&!G.seenTabs[k]&&uiTab!==k;
  const grp=MGROUPS.find(g=>g[2].includes(uiTab))||MGROUPS[0];lastSub[grp[0]]=uiTab;
  const gvis=MGROUPS.filter(g=>g[2].some(tabOpen));
  const subs=grp[2].filter(tabOpen);
  $('mtabs').innerHTML=`<div class="mgroups">${gvis.map(g=>`<button class="mtab${g===grp?' on':''}" data-mg="${g[0]}" role="tab" aria-selected="${g===grp}">${g[1]}${g!==grp&&g[2].filter(tabOpen).some(dot)?'<i class="newdot" title="Новое"></i>':''}</button>`).join('')}</div>`+
    (subs.length>1?`<div class="subtabs">${subs.map(k=>`<button class="stab${uiTab===k?' on':''}" data-mt="${k}">${lab(k)}${dot(k)?'<i class="newdot" title="Новое"></i>':''}</button>`).join('')}</div>`:'')+(simpleOn()&&vis.length<MTABS.length?`<span class="mtab-more">ещё ${MTABS.length-vis.length} разделов откроются позже</span>`:'');
  if(!G.seenTabs[uiTab]){G.seenTabs[uiTab]=1;saveG()}
  const B=$('mbody'),off=S.over||S.preview,dis=off?'disabled':'';
  if(uiTab==='shop'){
    const full=carsN()>=S.spots,working=carsN()-brokenN();
    B.innerHTML=`<div class="row2"><div class="tabs">${SHOP_TABS.map(([k,l])=>`<button class="tab${shopTab===k?' on':''}" data-tab="${k}">${l}</button>`).join('')}</div>
      <span class="sub">Мест на стоянке: ${carsN()} / ${S.spots}${full?' — <span class="neg">заполнена</span>':''}</span></div>
      <div class="grid">${hireCard()}${MODEL_KEYS.filter(k=>tabMatch(MODELS[k],shopTab)&&S.rank>=(MODELS[k].rank||0)).map(k=>{const M=MODELS[k],own=countM(k),rel=Math.max(1,Math.min(5,Math.round((1-M.fail*10)*5)));
      return `<div class="card2"><div class="car-top"><canvas class="mini" width="38" height="17" data-m="${k}"></canvas>
        <div><h3>${M.name}</h3><div class="kind"><span class="cls">${M.cls}</span>${M.kind}</div></div></div>
        ${M.note?`<div class="kind">${M.note}</div>`:''}
        <div class="specs">
          <div class="spec"><span>${M.lease?'Первый взнос':'Цена'}</span><b>${rub(priceOf(k))}</b></div>
          ${M.lease?`<div class="spec"><span>Лизинг, ${LEASE_DAYS} дн.</span><b>${rub(M.lease)}/день</b></div>`:`<div class="spec"><span>Пробег</span><b>~${km(M.km0)}</b></div>`}
          <div class="spec"><span>Выручка</span><b>${rub(carRevM(k))}/сут</b></div>
          <div class="spec"><span>Надёжность</span><span class="pips">${[0,1,2,3,4].map(i=>`<i class="${i<rel?'on':''}"></i>`).join('')}</span></div>
          <div class="spec"><span>Ремонт</span><b>${M.repair?rub(M.repair):'по гарантии'}</b></div></div>
        <div class="kind">В парке: ${own}</div>
        ${M.ev?`<div class="kind ${S.upg.charger?'':'neg'}">Не тратит бензин: при дорогом топливе зарабатывает больше; без зарядной станции −30% выручки.</div>`:''}
        <div class="btns">${S.rank<(M.rank||0)?`<button class="buy" disabled>🔒 Звание «${rankName(M.rank)}»</button>`:`<button class="buy" data-buy="${k}" ${off||S.money<priceOf(k)||full?'disabled':''}>Купить</button>`}</div></div>`}).join('')}
      ${(()=>{const lk=MODEL_KEYS.filter(k=>tabMatch(MODELS[k],shopTab)&&S.rank<(MODELS[k].rank||0));return lk.length?`<div class="card2 locked"><h3>🔒 Ещё ${lk.length} ${lk.length<5?'модели':'моделей'}</h3><div class="kind">Откроются с новыми званиями: ${lk.map(k=>MODELS[k].name).join(', ')}.</div></div>`:''})()}</div>`;
  }
  else if(uiTab==='fleet'){
    const sorted=[...S.fleet].sort((a,b)=>b.b-a.b||carFail(b)-carFail(a));
    B.innerHTML=`<p class="sub">Чем больше пробег, тем чаще машина ломается и тем дешевле продаётся. ${(S.bal||1)>=2?`Возврат лизинговой машины стоит ${bal('leaseRet')} дневных платежей, а после ${bal('leaseWearFrom')} дней она ломается чаще.`:'Лизинговую машину можно вернуть без выплаты.'} Сервис чинит до ${repairCap()} машин в день. Тюнинг: Т — тонировка, Ш — шумоизоляция, К — кожаный салон; все три переводят машину в класс выше.${hasHead('master')?' Мастер Ашот делает тюнинг на 30% дешевле.':''}</p>
      ${toOn()&&S.fleet.some(c=>!c.b&&!c.svc&&toLeft(c)<0)?`<div class="btns"><button class="buy to" data-svcall="1" ${dis}>Все просроченные на ТО</button></div>`:''}
      <div class="tablewrap"><table><thead><tr><th>Машина</th><th>Класс</th><th>Пробег</th><th>Износ</th><th>Статус</th><th>Лизинг</th><th>Тюнинг</th><th></th></tr></thead><tbody>
      ${sorted.map(c=>{const M=MODELS[c.m],wear=Math.min(100,Math.round(carFail(c)/.15*100)),v=carValue(c);
        return `<tr><td>${M.name}</td><td>${c.up?`<b class="pos">${c.up}</b>`:M.cls}</td><td>${km(c.km)}${toOn()?`<div class="kind ${toLeft(c)<0?'neg':''}">${toLeft(c)<0?`ТО просрочено на ${Math.round(-toLeft(c)).toLocaleString('ru-RU')} км`:`ТО через ${Math.round(toLeft(c)).toLocaleString('ru-RU')} км`}</div>`:''}</td><td><div class="bar ${wear<40?'green':''}"><i style="width:${wear}%"></i></div></td>
        <td class="${c.b?'st-bad':'st-ok'}">${c.h?`задержана, ${c.h} дн.`:c.b?'в ремонте':c.svc?'на ТО':'на ходу'}${toOn()&&!c.b&&!c.svc&&toLeft(c)<1000?`<div><button class="buy sm alt to" data-svc="${c.id}" ${dis||S.money<toPrice()?'disabled':''}>На ТО ${rub(toPrice())}</button></div>`:''}</td><td>${c.lease>0?`ещё ${c.lease} дн.`:'—'}</td>
        <td><div class="btns">${Object.entries(TUNE).map(([k,T])=>(c.tune||{})[k]?`<span class="done-tag" title="${T.n}">${T.s}✓</span>`:`<button class="buy sm alt" data-tune="${c.id}:${k}" title="${T.n}: +${Math.round(T.m*100)}% выручки" ${dis}>${T.s} ${rub(tunePrice(k))}</button>`).join('')}</div></td>
        <td><button class="buy alt sm" data-sellcar="${c.id}" ${dis||c.lease>0&&S.money<leaseRet(c)?'disabled':''}>${c.lease>0?'Вернуть'+(leaseRet(c)?' −'+rub(leaseRet(c)):''):'Продать '+rub(v)}</button></td></tr>`}).join('')}
      </tbody></table></div>`;
  }
  else if(uiTab==='depts'){
    B.innerHTML=`<div class="dept3">${DEPTS.map((D,d)=>{const h=headDef(d),pinned=G.pins[d]&&G.pins[d].key===h.key,r=rm(d);
      return `<div class="dcard" style="--dc:${D.color}"><div class="dh">${D.name.toUpperCase()}</div><div class="db">
        <div class="who"><canvas class="face big" width="16" height="16" data-face="head:${d}"></canvas><div><b>${esc(S.heads[d].name)}</b><div class="perk"><strong>${h.perk}.</strong> ${h.desc}. Зарплата ${rub(h.pay)}/день.</div></div></div>
        <div class="namefield"><input type="text" id="nm${d}" value="${esc(S.heads[d].name)}" maxlength="40" aria-label="Имя начальника"><button class="buy sm alt" data-rename="${d}">Сохранить</button></div>
        <label class="chk"><input type="checkbox" data-pin="${d}" ${pinned?'checked':''}> Закрепить для новых игр</label>
        <div class="row2"><span>Сменить на:</span><div class="btns">${availHeads(d).filter(x=>x.key!==h.key).map(x=>`<button class="buy sm alt" data-head="${d}:${x.key}" ${dis} title="${x.perk}: ${x.desc}">${esc(x.name)}</button>`).join('')}</div></div>
        <p class="sub">Смена начальника: выходное пособие ${rub(15000)}.</p>
        <div class="row2"><span>Сотрудники (${rub(STAFF_PAY)}/день каждый)</span><div class="btns"><button class="buy sm alt" data-staff="${d}:-1" ${dis}>−</button><span class="count">${S.staff[d]}</span><button class="buy sm" data-staff="${d}:1" ${dis}>+</button></div></div>
        <div class="row2"><span>Обучение: ${S.train[d]}/3</span>${S.train[d]<3?`<button class="buy sm" data-train="${d}" ${dis}>Обучить −${rub(trainPrice(d))}</button>`:'<span class="done-tag">МАКС.</span>'}</div>
        <div class="row2"><span>Характер</span><span class="sub">${BIAS_N[headBias(d)]}</span></div>
        <div class="row2"><span>Отношения</span><span class="rel ${relOf(d)<0?'neg':''}" title="${relOf(d)}">${relHearts(relOf(d))}</span><button class="buy sm alt" data-hbonus="${d}" ${dis}>Премия ${rub(Math.round(10000*inf()))}</button></div>
        <div class="row2"><span>Риск провалов</span><b class="${r<=.8?'pos':r>1?'neg':''}">×${r.toFixed(2)}</b></div>
        ${load01(d)>0?`<p class="neg" style="font-size:14px">Отдел перегружен: ${d===0?'много водителей':'много машин'} на ${S.staff[d]} сотр. Наймите людей.</p>`:''}
        ${d===2?`<p class="sub">Чинит до ${repairCap()} машин в день.</p>`:''}
      </div></div>`}).join('')}</div>
      <div class="dcard" style="--dc:var(--taxi)"><div class="dh">УЧРЕДИТЕЛИ — ПРИЕЗЖАЮТ С ПРОВЕРКАМИ</div><div class="db">
        <div class="dept3">${FOUNDERS.map((F,i)=>`<div class="who"><canvas class="face big" width="16" height="16" data-face="founder:${i}"></canvas><div style="display:grid;gap:4px;flex:1;min-width:0"><input type="text" id="fn${i}" value="${esc(fName(i))}" maxlength="40" aria-label="Имя учредителя"><span class="perk">${F.about}</span></div></div>`).join('')}</div>
        <div class="btns"><button class="buy sm" id="saveFounders">Сохранить имена учредителей</button></div>
        <p class="sub">Проверка приходит без предупреждения раз в 5–9 дней. Обученный отдел с сильным начальником и без недавних провалов проходит её на «отлично».</p></div></div>`;
  }
  else if(uiTab==='base'){
    B.innerHTML=`<div class="grid">${upgKeys().map(k=>{const U=UPGRADES[k],has=S.upg[k];
      return `<div class="card2"><h3>${U.name}</h3><p class="kind">${U.desc}</p>${upgExtra(k)}<div class="spec"><span>Стоимость</span><b>${rub(upgPrice(k))}</b></div>
        <div class="btns">${has?'<span class="done-tag">ПОСТРОЕНО</span>':S.rank<(U.rank||0)?`<button class="buy" disabled>🔒 Звание «${rankName(U.rank)}»</button>`:(U.cars||0)>carsN()?`<button class="buy" disabled>🔒 Нужно ${U.cars} машин</button>`:`<button class="buy" data-upg="${k}" ${off||S.money<upgPrice(k)?'disabled':''}>Построить</button>`}</div></div>`}).join('')}
      <div class="card2"><h3>Склад запчастей</h3><p class="kind">Каждая ночная поломка берёт одну запчасть: ремонт со склада на 40% дешевле. Без запчастей — на 30% дороже.${crisisOn('parts')?' <span class="neg">Сейчас дефицит: цены вдвое выше.</span>':''}</p>
        <div class="spec"><span>На складе</span><b class="${S.parts?'':'neg'}">${S.parts} / ${partsCap()}</b></div><div class="bar ${S.parts>partsCap()*.3?'green':''}"><i style="width:${S.parts/partsCap()*100}%"></i></div>
        <div class="btns"><button class="buy sm" data-parts="10" ${off?'disabled':''}>+10 за ${rub(partPrice()*10)}</button><button class="buy sm" data-parts="30" ${off?'disabled':''}>+30 за ${rub(Math.round(partPrice()*.89)*30)}</button></div></div>
      <div class="card2"><h3>Расширение стоянки</h3><p class="kind">+8 машиномест. Можно расширять сколько угодно.</p>
        <div class="spec"><span>Сейчас мест</span><b>${S.spots}</b></div><div class="spec"><span>Стоимость</span><b>${rub(lotPrice())}</b></div>
        <div class="btns"><button class="buy" id="lotBtn" ${off||S.money<lotPrice()?'disabled':''}>Расширить</button>${b6()?`<button class="buy sm" id="lotSell" ${off||!lotBack()||S.spots-8<12||S.spots-carsN()<8?'disabled':''}>Продать 8 мест за ${rub(lotBack())}</button>`:''}</div>${b6()?'<p class="kind">Продать можно, если свободны 8 мест и осталось не меньше 12: вернётся половина цены последнего расширения.</p>':''}</div></div>`;
  }
  else if(uiTab==='fin'){
    const exp=[['Офис',Math.round(OFFICE*(ownHas('office')?.95:1))],...(mgmtCost()?[['Управление большим парком',mgmtCost()]]:[]),['Начальники и команды',payroll()],['Стоянка и страховка',carsN()*PARKING],['Лизинг',leaseSum()],['Кредиты',loanSum()]];
    const aggCard=!aggOn()?'':`<div class="card2" style="grid-column:1/-1"><h3>Агрегатор</h3>
        <p class="sub">Через него приходят заказы, за это он берёт комиссию с выручки. Менять можно раз в ${bal('aggGap')} дн., на следующий день половина парка простаивает.${S.aggLast?` Комиссия за прошлый день: ${rub(S.aggLast)}.`:''}</p>
        <div class="grid">${Object.keys(AGG).map(k=>{const A=bal('agg')[k],cur=(S.agg||'mig')===k,w=bal('aggGap')-(S.day-S.aggAt),o=Math.round((A.ord-1)*100);
          return `<div class="rentrow"><div class="row2"><span><b>${AGG[k].n}</b></span><b class="count">${Math.round(A.fee*100)}%</b></div>
          <p class="sub">${AGG[k].d}</p><div class="row2 sub"><span>Заказы ${o?(o>0?'+':'−')+Math.abs(o)+'%':'как обычно'}${A.poach<1?' · переманивание реже':''}</span></div>
          <button class="buy" style="min-height:44px" data-agg="${k}" ${off||cur||w>0?'disabled':''}>${cur?'Выбран':w>0?`Через ${w} дн.`:'Выбрать'}</button></div>`}).join('')}</div></div>`;
    B.innerHTML=`<div class="grid">${aggCard}
      <div class="card2" style="grid-column:1/-1"><h3>Ставки аренды по классам</h3>
        <p class="sub">Сколько водитель платит за сутки на машине этого класса. Выше рынка — больше денег, но водители уходят. Ниже — к вам тянутся люди.</p>
        <div class="grid">${CLASSES.map((cl,i)=>{const m=mk(cl),r=S.rents[cl],n=S.fleet.filter(c=>MODELS[c.m].cls===cl).length,dv=Math.round((r/m-1)*100);
          return `<div class="rentrow"><div class="row2"><span><b>${cl}</b> <span class="sub">· машин: ${n}</span></span><b class="count" id="rv_${i}">${rub(r)}</b></div>
          <input type="range" data-cls="${i}" min="${Math.round(m*.8/100)*100}" max="${Math.round(m*1.3/100)*100}" step="100" value="${r}" ${dis} aria-label="Ставка ${cl}">
          <div class="row2 sub"><span>Рынок ${rub(m)}</span><span id="rd_${i}" class="${dv>0?'neg':dv<0?'pos':''}">${dv?(dv>0?'+':'')+dv+'%':'по рынку'}</span></div></div>`}).join('')}</div>
        <p class="kind" id="rentInfo">${rentInfo()}</p></div>
      <div class="card2"><h3>Банк</h3>
        ${(S.bal>=5)?`<div class="row2 cred"><b class="cg g${cGrade()}">${cGrade()}</b><span>Кредитный рейтинг · счёт ${cSc()>0?'+':''}${cSc()}<br><small class="sub">Как поднять: не уходить в минус, платить по графику, гасить досрочно.</small></span></div>`:''}
        ${[0,1,2].slice(0,(S.bal>=5)&&cGrade()==='A'?3:2).map(i=>{const L=loanOffer(i);return`<div class="row2"><span>${i===2?'Третий кредит: ':''}${rub(L.amount)} на ${L.days} дн. · ${rub(loanPay(L))}/день</span><button class="buy sm tap" data-loan="${i}" ${off||!loanOk(i)?'disabled':''}>Взять</button></div>`}).join('')}
        <p class="sub">${S.bal<5?`Переплата ${Math.round((LOANS[0].rate-1)*100)}–${Math.round((LOANS[1].rate-1)*100)}%. Не больше двух кредитов сразу.`:cGrade()==='D'?`Переплата ${Math.round((loanOffer(0).rate-1)*100)}%. Только один кредит.`:`Переплата ${Math.round((loanOffer(0).rate-1)*100)}–${Math.round((loanOffer(1).rate-1)*100)}%. Не больше ${maxLoans()===3?'трёх кредитов сразу (третий — только малый)':'двух кредитов сразу'}.`}</p>
        ${S.loans.map((l,k)=>`<div class="spec"><span>Кредит ${rub(l.amount)}</span><b>${rub(l.pay)}/день · ещё ${l.left} дн.</b></div>${(S.bal>=5)?`<button class="buy sm tap" data-repay="${k}" ${off||S.money<l.pay*l.left?'disabled':''}>Погасить досрочно · ${rub(l.pay*l.left)}</button>`:''}`).join('')||'<p class="kind">Активных кредитов нет.</p>'}</div>
      <div class="card2"><h3>Расходы в день</h3><div class="specs">${exp.map(([a,b])=>`<div class="spec"><span>${a}</span><b>${rub(b)}</b></div>`).join('')}
        <div class="spec"><span>Итого</span><b>${rub(exp.reduce((a,e)=>a+e[1],0))}</b></div></div>
        <p class="sub">Плюс ремонт ночных поломок.</p><p class="sub">${fuelInfo()}</p></div></div>`;
  }
  else if(uiTab==='drivers'){
    const list=[...S.dlist].sort((a,b)=>b.r-a.r),canMonth=S.day-S.lastMonth>=30;
    B.innerHTML=`${b3()?shiftCard(dis):''}<p class="sub">У каждого водителя свой рейтинг, стаж, характер и лояльность. Лучшие водители садятся на лучшие машины. Низкая лояльность — и водитель уйдёт. ${canMonth?'<b class="pos">Можно выбрать водителя месяца (5 000 ₽, +2 к репутации).</b>':`Водителя месяца можно выбрать через ${30-(S.day-S.lastMonth)} дн.`}</p>
      <div class="row2"><span>Корпоратив для всех: лояльность +15, репутация +1 (раз в 30 дней)</span><button class="buy sm" id="partyBtn" ${off||S.day-S.lastParty<30?'disabled':''}>${S.day-S.lastParty<30?`Через ${30-(S.day-S.lastParty)} дн.`:'Устроить за '+rub(5000+S.drivers*500)}</button></div>
      ${S.upg.school?`<div class="row2"><span>Школа водителей: учеников ${S.school.length}/3${S.school.length?` (выпуск: ${S.school.map(x=>'день '+x.ready).join(', ')})`:''}</span><button class="buy sm" id="schoolBtn" ${dis}>Набрать ученика −4 000 ₽</button></div>`:'<p class="sub">Постройте «Школу водителей» во вкладке «База», чтобы учить новичков самим.</p>'}
      <div class="tablewrap"><table><thead><tr><th>Водитель</th><th>Рейтинг</th><th>Стаж</th><th>Характер</th><th>Лояльность</th><th></th></tr></thead><tbody>
      ${list.map(d=>{const T=TRAITS[d.t];return `<tr><td>${esc(d.n)}</td><td>★ ${d.r.toFixed(2)}</td><td>${d.xp} ${d.xp%10===1&&d.xp!==11?'год':d.xp%10>=2&&d.xp%10<=4&&(d.xp<10||d.xp>20)?'года':'лет'}</td>
        <td title="${T.d}">${T.n}<br><span class="sub" style="font-size:13px">${T.d}</span></td><td><div class="bar ${d.loy>=50?'green':''}"><i style="width:${d.loy}%"></i></div></td>
        <td><div class="btns"><button class="buy sm" data-dprem="${d.id}" ${dis}>Премия 3 000</button><button class="buy sm alt" data-dtalk="${d.id}" ${dis}>Беседа</button>
        ${canMonth?`<button class="buy sm" data-dmonth="${d.id}" ${dis}>★ Месяца</button>`:''}<button class="buy sm alt" data-dfire="${d.id}" ${dis}>${d.fireArm===S.day?'Точно?':'Уволить'}</button></div></td></tr>`}).join('')}
      </tbody></table></div>`;
  }
  else if(uiTab==='map'){
    const tot=Object.values(S.alloc).reduce((a,b)=>a+b,0)||1;
    B.innerHTML=`<div class="grid"><div class="card2" style="grid-column:1/-1"><h3>Карта города</h3><canvas id="mapC" class="mapc" width="240" height="135" aria-label="Карта районов"></canvas>
      <p class="sub">Сегодня: ${(S.dnews||[]).map(e=>`${DISTRICTS.find(D=>D.k===e.d).n} — ${e.t.toLowerCase()} (×${e.m})`).join('; ')||'обычный день'}. Множитель районов: <b>×${distFactor().toFixed(2)}</b>.</p></div>
      ${DISTRICTS.map(D=>{const sh=Math.round(S.alloc[D.k]/tot*100),mod=S.dmods[D.k];return `<div class="card2"><h3 style="color:${D.c}">${D.n}</h3>
        <div class="spec"><span>Доля машин</span><b>${sh}%</b></div><div class="spec"><span>Спрос сегодня</span><b class="${mod>1?'pos':mod<1?'neg':''}">×${(D.base*mod).toFixed(2)}</b></div>
        <div class="spec"><span>Без перегруза до</span><b>${Math.round(D.cap*100)}%</b></div>
        <input type="range" data-dist="${D.k}" min="0" max="100" step="5" value="${S.alloc[D.k]}" ${dis} aria-label="Доля ${D.n}"></div>`}).join('')}
      <div class="card2" style="grid-column:1/-1"><h3>Смена диспетчера</h3><p class="kind">Мини-игра на 60 секунд: раздавайте заказы машинам. За каждый выполненный — 1 500 ₽. Раз в день.</p>
        <div class="btns"><button class="buy" id="dpBtn" ${off||S.dispDay===S.day?'disabled':''}>${S.dispDay===S.day?'Сегодня уже была':'Сесть за пульт'}</button></div></div>
      ${b3()?'':shiftCard(dis)}</div>`;
    if(!mapRAF)mapRAF=requestAnimationFrame(mapLoop);
  }
  else if(uiTab==='biz'){
    const val=valuation();
    B.innerHTML=`<div class="grid">
      <div class="card2" style="grid-column:1/-1"><h3>Корпоративные контракты</h3>${S.contracts.length?S.contracts.map(c=>`<div class="spec"><span>${esc(c.co)} · ${c.cars} маш.</span><b>${rub(c.pay)}/маш. · ещё ${c.days} дн.</b></div>`).join(''):'<p class="kind">Контрактов нет. Предложения от компаний приходят утром.</p>'}</div>
      ${Object.entries(LINES).map(([k,L])=>`<div class="card2"><h3>${L.n}</h3><p class="kind">${L.d}</p><div class="spec"><span>Запуск</span><b>${rub(L.price)}</b></div>
        <div class="btns">${S.lines[k]?'<span class="done-tag">РАБОТАЕТ</span>':S.rank<(L.rank||0)?`<button class="buy" disabled>🔒 Звание «${rankName(L.rank)}»</button>`:`<button class="buy" data-line="${k}" ${off||S.money<L.price?'disabled':''}>Запустить</button>`}</div></div>`).join('')}
      <div class="card2"><h3>Реклама на машинах</h3><p class="kind">${S.ads?`Сейчас: ${S.ads.brand}. +${rub(carsN()*300)} в день.`:'Бренды платят 300 ₽ с машины в день. Часть пассажиров рекламу не любит: −1 к репутации раз в 5 дней.'}</p>
        <div class="btns"><button class="buy ${S.ads?'alt':''}" id="adsBtn" ${dis}>${S.ads?'Снять рекламу':'Взять рекламу'}</button></div></div>
      <div class="card2"><h3>Инвесторы</h3><p class="kind">Оценка парка: ${rub(val)}. Продав долю, вы получите деньги сразу, но инвесторы будут забирать свой процент прибыли каждый день и следить за результатами.</p>
        <div class="spec"><span>Доля инвесторов</span><b>${invShare()}%</b></div>${(S.investors||[]).map(i=>`<div class="spec"><span>${esc(i.name)}</span><b>${i.share}%</b></div>`).join('')}
        <div class="btns"><button class="buy" id="shareSell" ${off||invShare()>=40?'disabled':''}>Продать 10% за ${rub(Math.round(val*.1/1000)*1000)}</button>
        ${S.investors.length?`<button class="buy alt" id="shareBuy" ${dis}>Выкупить 10% за ${rub(Math.round(val*.125/1000)*1000)}</button>`:''}</div></div></div>`;
  }
  else if(uiTab==='stats'){
    const st=S.stat;
    B.innerHTML=st.length<2?'<p>Статистика появится после пары игровых дней.</p>':`<div class="grid">
      <div class="card2" style="grid-column:1/-1"><h3>Касса</h3>${svgChart(st,'money','var(--taxi)')}</div>
      <div class="card2" style="grid-column:1/-1"><h3>Чистая прибыль за день</h3>${svgBars(st,'net')}</div>
      <div class="card2"><h3>Машин в сети</h3>${svgChart(st,'cars','var(--d1)')}</div>
      <div class="card2"><h3>Репутация</h3>${svgChart(st,'rep','var(--d3)')}</div>
      <div class="card2"><h3>Итого за ${st.length} дн.</h3><div class="specs"><div class="spec"><span>Выручка</span><b>${rub(st.reduce((a,x)=>a+x.rev,0))}</b></div>
        <div class="spec"><span>Чистыми</span><b>${rub(st.reduce((a,x)=>a+x.net,0))}</b></div><div class="spec"><span>Лучший день</span><b>${rub(Math.max(...st.map(x=>x.net)))}</b></div>
        <div class="spec"><span>Худший день</span><b>${rub(Math.min(...st.map(x=>x.net)))}</b></div></div></div></div>`;
  }
  else if(uiTab==='style'){
    const C=S.custom;
    B.innerHTML=`<div class="grid">
      <div class="card2"><h3>Удобство</h3><label class="chk"><input type="checkbox" id="bigT" ${G.big?'checked':''}> Крупный текст</label><label class="chk"><input type="checkbox" id="cbT" ${G.cb?'checked':''}> Режим для дальтоников: синий и оранжевый вместо зелёного и красного, стрелки ▲▼</label></div>
      <div class="card2"><h3>Режим новичка</h3><label class="chk"><input type="checkbox" id="simpleT" ${G.simple!==false?'checked':''}> Открывать возможности постепенно, показывать подсказки и советы</label><p class="sub">Выключите, чтобы сразу видеть все вкладки и события.</p></div>
      <div class="card2"><h3>Название парка</h3><div class="namefield"><input type="text" id="pkName" value="${esc(C.name)}" maxlength="16" aria-label="Название парка"><button class="buy sm" id="pkSave">Сохранить</button></div><p class="sub">До 16 символов. Появится в заголовке, на вывеске и в газете.</p></div>
      <div class="card2"><h3>Цвет машин</h3><div class="btns">${Object.entries(COLORS).map(([k,c])=>{const lk=skinLock('color',k);return `<button class="buy sm ${C.color===k?'':'alt'}" data-color="${k}" ${lk?`disabled title="Откроется за достижение «${achName(lk)}»"`:''}>${lk?'🔒 ':''}${c.body?`<i class="sw" style="background:${c.body}"></i>`:''}${c.n}</button>`}).join('')}</div><p class="sub">Закрытые цвета, логотипы и аватары открываются за достижения.</p></div>
      <div class="card2"><h3>Раскраска</h3><div class="btns">${Object.entries(LIVERY).map(([k,n])=>{const lk=skinLock('livery',k);return `<button class="buy sm livb ${(C.livery||'none')===k?'':'alt'}" data-livery="${k}" ${lk?`disabled title="Откроется за достижение «${achName(lk)}»"`:''}><canvas class="mini" width="38" height="17" data-m="solaris" data-liv="${k}"></canvas>${lk?'🔒 ':''}${n}</button>`}).join('')}</div><p class="sub">Раскраски — только для красоты, на деньги не влияют.</p></div>
      <div class="card2"><h3>Логотип</h3><div class="btns">${Object.keys(LOGOS).map(k=>`<button class="buy sm ${C.logo===k?'':'alt'}" data-logo="${k}" ${skinLock('logo',k)?`disabled title="Откроется за достижение «${achName(skinLock('logo',k))}»"`:''}>${skinLock('logo',k)?'🔒 ':''}<canvas class="logo-c sm" width="8" height="8" data-logo-draw="${k}"></canvas>${LOGO_N[k]}</button>`).join('')}</div></div>
      <div class="card2"><h3>Аватар владельца</h3><div class="btns">${AVATARS.map((a,i)=>`<button class="buy sm ${C.avatar===i?'':'alt'}" data-avatar="${i}" aria-label="Аватар ${i+1}" ${skinLock('avatar',String(i))?`disabled title="Откроется за достижение «${achName(skinLock('avatar',String(i)))}»"`:''}>${skinLock('avatar',String(i))?'🔒':''}<canvas class="face" width="16" height="16" data-face="av:${i}"></canvas></button>`).join('')}</div></div>
      <div class="card2" style="grid-column:1/-1"><h3>Для себя</h3><p class="sub">${b6()?`Покупки владельца дают скромные постоянные бонусы и попадают в газету. Куплено: ${Object.keys(S.owned).length} из ${Object.keys(OWNER_ITEMS).length}.`:'Покупки владельца на бизнес не влияют — зато видны в профиле и газете.'} Статус: ${['скромный владелец','крепкий хозяйственник','солидный бизнесмен','олигарх местного масштаба','легенда города'][Math.min(4,Object.keys(S.owned).length)]}.</p>
        <div class="ownG">${Object.entries(OWNER_ITEMS).map(([k,I])=>`<div class="own ${S.owned[k]?'has':''}">${icon16('o_'+k,40)}<b>${I.n}</b><small>${b6()?I.b:'Для души'}</small>${S.owned[k]?'<span class="done-tag">ЕСТЬ</span>':`<button class="buy sm" data-own="${k}" ${off||S.money<I.price?'disabled':''}>${rub(I.price)}</button>`}</div>`).join('')}</div></div></div>`;
    document.querySelectorAll('[data-logo-draw]').forEach(el=>drawLogo(el.getContext('2d'),el.dataset.logoDraw,0,0,'#f7c331'));
  }
  else if(uiTab==='branch'){
    const site=branchSite(S.branches.length);
    B.innerHTML=S.rank<3?`<p>Филиалы откроются на звании <b>«Владелец сети»</b> (нужно ${RANKS[3].txt}). Сейчас: «${rankName(S.rank)}».</p>`:
     `<p class="sub">Филиал — отдельный парк в другом районе. Он работает сам и приносит прибыль каждый день. Машины филиалов считаются в общий размер сети.</p>
      <div class="grid">${S.branches.map((b,i)=>`<div class="card2"><h3>Филиал «${esc(b.n)}»</h3>
        <div class="specs"><div class="spec"><span>Машины</span><b>${b.cars}</b></div><div class="spec"><span>Водители</span><b>${b.drivers}</b></div>
        <div class="spec"><span>Директор филиала</span><b>ур. ${b.mgr}/3</b></div>${b.bonus>1?`<div class="spec"><span>Бонус района</span><b>+${Math.round((b.bonus-1)*100)}%</b></div>`:''}
        <div class="spec"><span>Вчера чистыми</span><b class="${b.last>=0?'pos':'neg'}">${b.last>=0?'+':''}${rub(b.last)}</b></div></div>
        <div class="btns"><button class="buy sm" data-br="${i}:car" ${dis}>+Машина 75 000</button><button class="buy sm" data-br="${i}:hire" ${dis}>Найм 6 000</button>
        ${b.mgr<3?`<button class="buy sm alt" data-br="${i}:mgr" ${dis}>Обучить директора ${rub(40000*b.mgr)}</button>`:''}</div></div>`).join('')}
      <div class="card2"><h3>Новый филиал «${site.n}»</h3><p class="kind">3 машины и 3 водителя на старте.${site.bonus>1?` Район приносит +${Math.round((site.bonus-1)*100)}% выручки.`:''}</p>
        <div class="spec"><span>Стоимость</span><b>${rub(site.price)}</b></div>
        <div class="btns"><button class="buy" id="brOpen" ${off||S.money<site.price?'disabled':''}>Открыть филиал</button></div></div></div>`;
  }
  else if(uiTab==='city'){
    const rows=[{name:'ДСТ-24 (вы)',cars:totalCars(),rep:S.rep,style:'',me:1}].concat(S.rivals.map(r=>({name:r.name,cars:r.cars,rep:r.rep,style:RIVAL_STYLES[r.style]}))).sort((a,b)=>b.cars-a.cars);
    const R=RANKS[(S.rank||0)+1];
    B.innerHTML=`<div class="grid"><div class="card2" style="grid-column:1/-1"><h3>Таксопарки города</h3>
      <div class="tablewrap"><table><thead><tr><th>#</th><th>Парк</th><th>Машин</th><th>Репутация</th><th>Стиль</th></tr></thead><tbody>
      ${rows.map((r,i)=>`<tr${r.me?' style="outline:3px solid var(--taxi)"':''}><td>${i+1}</td><td>${r.me?'<b>':''}${esc(r.name)}${r.me?'</b>':''}</td><td>${r.cars}</td><td>${r.rep}</td><td>${r.style}</td></tr>`).join('')}</tbody></table></div>
      <p class="sub">Если ваша репутация выше средней у конкурентов, пассажиры чаще выбирают вас: до +8% к спросу.</p></div>
      ${S.mode==='endless'?`<div class="card2"><h3>Франшиза</h3><p class="kind">Продайте парк и начните в новом городе с постоянными бонусами. ${B(7)?`Очков холдинга свободно: ${holdFree()}.`:`Престиж сейчас: ${prestige()}.`} За этот парк: ${prestPts()} очк.</p><div class="btns"><button class="buy" id="frBtn" ${S.over||(S.rank<4&&S.day<60)?'disabled':''}>${S.rank<4&&S.day<60?'Откроется на звании «Таксомагнат» или с 60-го дня':'Продать парк'}</button></div></div>`:''}
      <div class="card2"><h3>Ваше звание</h3><p><b class="pos">★ ${rankName(S.rank||0)}</b></p>${R?`<p class="kind">Следующее: «${R.n}» — нужно ${R.txt}. Откроет: ${R.unlock}.</p>`:'<p class="kind">Высшее звание получено!</p>'}</div>
      <div class="card2"><h3>Бензин и электро</h3><p class="kind">${fuelInfo()}</p>${evCars().length?`<p class="kind">Электромобилей в парке: ${evCars().length}${S.upg.charger?'.':`, без зарядной станции они теряют ≈${rub(evLoss())} в день.`}</p>`:''}</div>
      <div class="card2"><h3>Рейды и проверки</h3><p class="kind">${S.raid?`Идут рейды ГАИ: ещё ${S.raid.days} дн.`:'Рейдов ГАИ сейчас нет.'} Налоговая и учредители приходят без предупреждения.</p></div></div>`;
  }
  else if(uiTab==='ach'){
    const R=G.rec,got=ACH.filter(a=>S.ach[a[0]]).length;
    B.innerHTML=`<p class="sub">В этой игре: ${got} из ${ACH.length}. За всё время: ${ACH.filter(a=>G.ach[a[0]]).length}.</p>
      <div class="achs">${ACH.map(([id,n,desc])=>`<div class="ach ${S.ach[id]?'got':''}"><b>${S.ach[id]?'★ ':''}${n}</b><span>${desc}${unlockOf(id)?` · <em class="rew">Награда: ${unlockOf(id)}</em>`:''}${S.ach[id]?` · день ${S.ach[id]}`:G.ach[id]?' · было в прошлых играх':''}</span></div>`).join('')}</div>
      <div class="card2"><h3>${NET.url?'Рекорды':'Мои лучшие результаты'}</h3>${NET.url?netBoardHead():''}
        ${netView==='all'&&NET.url?netBoardRows():(G.board||[]).length?`<div class="tablewrap"><table><thead><tr><th>#</th><th>Дата</th><th>Режим</th><th>Дней</th><th>Машин</th><th>Касса</th><th>Итог</th></tr></thead><tbody>
        ${G.board.map((r,i)=>`<tr><td>${i+1}</td><td>${r.date}</td><td>${{campaign:'Кампания',endless:'Бесконечный',story:'Сюжет',daily:'Испытание дня',contest:'Соревнование'}[r.mode]||esc(r.mode)} · ${(DIFF[r.diff]||DIFF.normal).n}</td><td>${r.days}</td><td>${r.cars}</td><td>${rub(r.money)}</td><td>${r.st}${r.stars?' '+'★'.repeat(r.stars):''}</td></tr>`).join('')}</tbody></table></div>`:'<p class="kind">Пока пусто. Результат записывается, когда игра заканчивается.</p>'}
        ${NET.url?'':'<p class="sub">Таблица хранится на этом устройстве. Общий рейтинг для всех игроков требует своего сервера.</p>'}</div>
      <div class="card2"><h3>Рекорды бесконечного режима</h3><div class="specs">
        <div class="spec"><span>Дней продержались</span><b>${R.days}</b></div><div class="spec"><span>Машин в парке</span><b>${R.cars}</b></div>
        <div class="spec"><span>Денег в кассе</span><b>${rub(R.money)}</b></div><div class="spec"><span>Целей выполнено</span><b>${R.goals}</b></div></div></div>`;
  }
  if(uiTab==='ach'&&NET.url)netBoardBind();
  if(simpleOn()&&TAB_HINTS[uiTab])B.insertAdjacentHTML('afterbegin',`<p class="hintbox">${TAB_HINTS[uiTab]}</p>`);
  document.querySelectorAll('canvas.mini').forEach(drawMini);
}

/* ---- события интерфейса ---- */
$('desks').addEventListener('click',e=>{const b=e.target.closest('.choice');if(b){ensureAudio();choose(+b.dataset.d,+b.dataset.i)}});
$('mtabs').addEventListener('click',e=>{const g=e.target.closest('[data-mg]');if(g){const G2=MGROUPS.find(x=>x[0]===g.dataset.mg);const ls=lastSub[G2[0]];uiTab=ls&&tabOpen(ls)?ls:G2[2].find(tabOpen);sfx('click');renderMgmt();drawFaces();const mb=$('mbody');mb.classList.remove('swap');void mb.offsetWidth;mb.classList.add('swap');return}
  const b=e.target.closest('[data-mt]');if(b){uiTab=b.dataset.mt;sfx('click');renderMgmt();drawFaces();const mb=$('mbody');mb.classList.remove('swap');void mb.offsetWidth;mb.classList.add('swap')}});
$('mbody').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;ensureAudio();const ds=b.dataset;
  if(ds.tab){shopTab=ds.tab;renderMgmt();return}
  if(S.preview)return;
  if(ds.buy)return buy(ds.buy);
  if(b.id==='hireBtn')return hire();
  if(ds.sellcar)return sellCar(+ds.sellcar);
  if(ds.svc){if(service(S.fleet.find(c=>c.id===+ds.svc))){addLog('ТО: машина отправлена на плановое обслуживание.');sfx('coin');save();render()}else toast('Не хватает денег');return}
  if(ds.svcall)return serviceOverdue();
  if(ds.upg)return buyUpg(ds.upg);
  if(b.id==='lotBtn')return buyLot();
  if(b.id==='lotSell')return sellLot();
  if(ds.staff){const[d,v]=ds.staff.split(':');return staffChange(+d,+v)}
  if(ds.train)return train(+ds.train);
  if(ds.head){const[d,k]=ds.head.split(':');return changeHead(+d,k,false)}
  if(ds.rename)return renameHead(+ds.rename);
  if(ds.loan)return takeLoan(+ds.loan);
  if(ds.repay)return repayLoan(+ds.repay);
  if(ds.agg)return setAgg(ds.agg);
  if(b.id==='saveFounders')return saveFounders();
  if(ds.dprem)return drvAct(+ds.dprem,'prem');
  if(ds.dtalk)return drvAct(+ds.dtalk,'talk');
  if(ds.dfire)return drvAct(+ds.dfire,'fire');
  if(ds.dmonth)return drvAct(+ds.dmonth,'month');
  if(ds.br){const[i,a]=ds.br.split(':');return branchAct(+i,a)}
  if(b.id==='brOpen')return openBranch();
  if(b.id==='schoolBtn')return enrollSchool();
  if(ds.hbonus!==undefined)return headBonus(+ds.hbonus);
  if(b.id==='frBtn')return sellFranchise();
  if(ds.parts)return buyParts(+ds.parts);
  if(b.id==='dpBtn')return dispatcher();
  if(b.id==='partyBtn')return corpParty();
  if(ds.own)return buyOwner(ds.own);
  if(ds.tune){const[i,k]=ds.tune.split(':');return tuneCar(+i,k)}
  if(ds.line)return buyLine(ds.line);
  if(b.id==='adsBtn')return toggleAds();
  if(b.id==='shareSell')return sellShare();
  if(b.id==='shareBuy')return buyBack();
  if(b.id==='pkSave'){const v=($('pkName').value||'').trim().slice(0,16);if(v){setCustom('name',v);toast('Название сохранено')}return}
  if(ds.color)return setCustom('color',ds.color);
  if(ds.livery)return setCustom('livery',ds.livery);
  if(ds.logo)return setCustom('logo',ds.logo);
  if(ds.avatar!==undefined)return setCustom('avatar',+ds.avatar);
});
$('mbody').addEventListener('change',e=>{const t=e.target;if(t.id==='bigT'){G.big=t.checked;saveG();render();return}if(t.id==='cbT'){G.cb=t.checked;saveG();render();return}if(t.id==='simpleT'){G.simple=t.checked;saveG();render();return}if(S.preview)return;
  if(t.id==='simpleT'){G.simple=t.checked;saveG();render();return}
  if(t.dataset.pin)pinHead(+t.dataset.pin,t.checked);
  if(t.dataset.cls!==undefined){S.rents[CLASSES[+t.dataset.cls]]=+t.value;save();render()}
  if(t.dataset.dist){S.alloc[t.dataset.dist]=+t.value;save();render()}
  if(t.id==='nightR'){if(b3())S.shift2=+t.value;else S.night=+t.value;save();render()}});
$('mbody').addEventListener('input',e=>{const t=e.target;if(t.id==='nightR'&&!S.preview){$('nightV').textContent=t.value+'%'}if(t.dataset.cls!==undefined&&!S.preview){const i=+t.dataset.cls,cl=CLASSES[i],v=+t.value,dv=Math.round((v/mk(cl)-1)*100);
  S.rents[cl]=v;$('rv_'+i).textContent=rub(v);const rd=$('rd_'+i);rd.textContent=dv?(dv>0?'+':'')+dv+'%':'по рынку';rd.className=dv>0?'neg':dv<0?'pos':'';$('rentInfo').innerHTML=rentInfo()}});
$('endDay').onclick=()=>{ensureAudio();if(still)return endDay();
  $('endDay').disabled=true;const fx=document.createElement('div');fx.className='dayfx';fx.innerHTML='<div class="dfx-sun"></div><div class="dfx-t"></div>';document.body.appendChild(fx);
  setTimeout(()=>{endDay();fx.querySelector('.dfx-t').textContent='День '+S.day},560);setTimeout(()=>fx.remove(),1450)};
$('restart').onclick=pickMode;
$('helpBtn').onclick=()=>tutorial(0);
function openMenu(){const inS=S&&!S.preview;
  showModal(`<span class="step">МЕНЮ</span><h2>Игра и настройки</h2><div class="menu-grid">
    <button class="mode" id="mnMusic"><b>♪ МУЗЫКА: ${G.music?'ВКЛ':'ВЫКЛ'}</b></button>
    <button class="mode" id="mnSfx"><b>ЗВУКИ: ${G.sfx?'ВКЛ':'ВЫКЛ'}</b></button>
    <button class="mode" id="mnHelp"><b>КАК ИГРАТЬ</b><span>Короткое обучение</span></button>
    ${inS?'<button class="mode" id="mnPhoto"><b>ФОТО ПАРКА</b><span>Кадр вашего двора</span></button>':''}
    <button class="mode" id="mnSave"><b>СОХРАНЕНИЕ</b><span>Код для переноса прогресса</span></button>
    ${NET.url?`<button class="mode" id="mnNet"><b>ОНЛАЙН</b><span>${online()?esc(netSt.nick||'На связи'):'Вход, облако, рейтинг'}</span></button>`:''}
    ${inS?'<button class="mode" id="mnStyle"><b>ВИД И УДОБСТВО</b><span>Крупный текст, режим новичка</span></button>':''}
    ${installEvt?'<button class="mode" id="mnInst"><b>УСТАНОВИТЬ</b><span>Как приложение</span></button>':''}
    <button class="mode" id="mnNew"><b>НОВАЯ ИГРА</b><span>Начать заново</span></button>
  </div><div class="btns"><button class="btn ghost" id="mnClose">Закрыть</button></div>`);
  $('mnMusic').onclick=()=>{$('musicBtn').click();openMenu()};
  $('mnSfx').onclick=()=>{$('sfxBtn').click();openMenu()};
  $('mnHelp').onclick=()=>tutorial(0);
  if($('mnPhoto'))$('mnPhoto').onclick=()=>$('photoBtn').click();
  $('mnSave').onclick=()=>$('saveBtn').click();
  if($('mnNet'))$('mnNet').onclick=()=>openNetModal();
  if($('mnStyle'))$('mnStyle').onclick=()=>{hideModal();uiTab='style';renderMgmt();drawFaces();document.querySelector('.mgmt').scrollIntoView({behavior:'smooth',block:'start'})};
  if($('mnInst'))$('mnInst').onclick=()=>{hideModal();$('installBtn').click()};
  $('mnNew').onclick=()=>$('restart').click();
  $('mnClose').onclick=hideModal;
}
$('menuBtn').onclick=()=>{ensureAudio();sfx('click');openMenu()};
$('pauseBtn').innerHTML=icon16('pause',16);$('menuBtn').innerHTML=icon16('menu',16)+'Меню';
$('ticker').addEventListener('click',e=>{const n=e.target.closest('.nw,.wx');if(n&&n.title)toast(n.title)});
$('pauseBtn').onclick=()=>{ensureAudio();sfx('click');setPause(true)};
$('pauseGo').onclick=()=>{setPause(false);sfx('click')};
/* в паузе клавиши не доходят до мини-игр; Esc — продолжить */
window.addEventListener('keydown',e=>{if(!paused)return;e.stopImmediatePropagation();if(e.key==='Escape'){e.preventDefault();setPause(false)}},true);
/* свернули вкладку или приложение — встаём на паузу (кроме заставки) */
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!['studio','splash'].some(id=>$(id)&&!$(id).classList.contains('out')))setPause(true)});
$('photoBtn').onclick=()=>{ensureAudio();takePhoto()};
$('autoBtn').onclick=()=>{ensureAudio();autoResolve()};
let installEvt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;$('installBtn').hidden=false});
$('installBtn').onclick=async()=>{if(!installEvt)return;installEvt.prompt();try{await installEvt.userChoice}catch(e){}installEvt=null;$('installBtn').hidden=true};
$('saveBtn').onclick=()=>{ensureAudio();openSaveModal()};

/* ================= КОД СОХРАНЕНИЯ ================= */
const b64=bytes=>{let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode.apply(null,bytes.subarray(i,i+8192));return btoa(s)};
const unb64=str=>Uint8Array.from(atob(str),c=>c.charCodeAt(0));
async function pipe(bytes,stream){const r=new Response(new Blob([bytes]).stream().pipeThrough(stream));return new Uint8Array(await r.arrayBuffer())}
async function makeCode(){
  const st=Object.assign({},S,{log:S.log.slice(0,15)});
  const json=JSON.stringify({v:1,s:st,g:{pins:G.pins,founders:G.founders}});
  const raw=new TextEncoder().encode(json);
  if(window.CompressionStream){try{return 'DST24Z.'+b64(await pipe(raw,new CompressionStream('deflate-raw')))}catch(e){}}
  return 'DST24B.'+b64(raw);
}
async function readCode(code){
  code=(code||'').replace(/\s+/g,'');
  const m=code.match(/^DST24([ZB])\.(.+)$/);if(!m)throw new Error('format');
  let bytes=unb64(m[2]);
  if(m[1]==='Z'){if(!window.DecompressionStream)throw new Error('browser');bytes=await pipe(bytes,new DecompressionStream('deflate-raw'))}
  const data=JSON.parse(new TextDecoder().decode(bytes));
  const st=data&&data.s;
  if(!st||!Array.isArray(st.fleet)||!Array.isArray(st.heads)||st.heads.length!==3||typeof st.money!=='number')throw new Error('data');
  st.fleet=st.fleet.filter(c=>c&&MODELS[c.m]);
  st.heads=st.heads.map((h,d)=>HEADS[d].some(x=>x.key===(h&&h.key))?{key:h.key,name:String(h.name||'').slice(0,40)||HEADS[d].find(x=>x.key===h.key).name}:{key:HEADS[d][0].key,name:HEADS[d][0].name});
  st.today=(st.today||[]).map((r,d)=>typeof r==='string'?(CHAINS[r]?r:0):(EVENTS[d][r]?r:0));
  return {s:Object.assign(fixState(st),{preview:false}),g:data.g||{}};
}
function openSaveModal(){
  const canExport=S&&!S.preview;if(canExport){S.lastExport=S.day;save()}
  showModal(`<span class="step">ПЕРЕНОС ПРОГРЕССА</span><h2>Код сохранения</h2>
    ${canExport?`<p>Скопируйте код и сохраните его где угодно: в заметках, в мессенджере себе. На другом устройстве вставьте его ниже и нажмите «Загрузить».</p>
    <p class="note">День ${S.day} · ${S.mode==='endless'?'бесконечный режим':'кампания'} · ${rub(S.money)} · машин: ${carsN()}</p>
    <textarea class="codebox" id="codeOut" readonly aria-label="Код сохранения">Создаю код…</textarea>
    <div class="btns"><button class="buy" id="copyCode">Скопировать код</button></div>`:'<p>Пока нечего сохранять: начните игру. Ниже можно загрузить код из другой игры.</p>'}
    <h2 style="margin-top:6px">Загрузить игру</h2>
    <textarea class="codebox" id="codeIn" placeholder="Вставьте сюда код, который начинается с DST24" aria-label="Код для загрузки"></textarea>
    <p class="note" id="codeMsg"></p>
    <div class="btns"><button class="buy" id="loadCode">Загрузить</button><button class="buy alt" id="closeSave">Закрыть</button></div>`);
  if(canExport)makeCode().then(c=>{$('codeOut').value=c}).catch(()=>{$('codeOut').value='Не получилось создать код. Попробуйте ещё раз.'});
  if($('copyCode'))$('copyCode').onclick=()=>{const t=$('codeOut');const done=()=>{toast('Код скопирован');sfx('coin')};
    const fallback=()=>{t.focus();t.select();toast('Код выделен — скопируйте его вручную')};
    try{navigator.clipboard.writeText(t.value).then(done,fallback)}catch(e){fallback()}};
  let armed=false;
  $('loadCode').onclick=async()=>{
    const msg=$('codeMsg');let res;
    try{res=await readCode($('codeIn').value)}catch(e){
      msg.className='neg';msg.textContent=e.message==='browser'?'Этот браузер не умеет распаковывать код. Откройте игру в свежем Chrome, Safari или Firefox.':'Код не подошёл. Проверьте, что он скопирован целиком, от «DST24» до последнего символа.';sfx('bad');return}
    if(canExport&&!S.over&&!armed){armed=true;msg.className='neg';msg.textContent=`Текущая игра (день ${S.day}) заменится игрой из кода: день ${res.s.day}, ${rub(res.s.money)}. Нажмите «Загрузить» ещё раз, чтобы подтвердить.`;$('loadCode').textContent='Да, загрузить';return}
    S=res.s;ctSync(S);
    if(Array.isArray(res.g.pins)&&res.g.pins.length===3)G.pins=res.g.pins.map((p,d)=>p&&HEADS[d].some(x=>x.key===p.key)?{key:p.key,name:String(p.name||'').slice(0,40)}:null);
    if(Array.isArray(res.g.founders)&&res.g.founders.length===3)G.founders=res.g.founders.map((n,i)=>String(n||'').slice(0,40)||FOUNDERS[i].name);
    saveG();addLog('Игра загружена из кода сохранения.');movers=[];save();hideModal();render();toast(`Игра загружена: день ${S.day}`);sfx('win');
    if(S.over){hasLimit()&&S.day>dayLimit()?finale():gameOver()}else if(S.morning&&S.morning.length)runMorning();
  };
  $('closeSave').onclick=hideModal;
}
$('musicBtn').onclick=()=>{G.music=!G.music;saveG();ensureAudio();G.music?startMusic():stopMusic();render()};
$('sfxBtn').onclick=()=>{G.sfx=!G.sfx;saveG();ensureAudio();render();sfx('click')};
