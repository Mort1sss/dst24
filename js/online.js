// Таксопарк «ДСТ-24» — онлайн: вход, облако, рекорды, события, подарки, город
/* ================= ОНЛАЙН ================= */
// Надстройка: без NET.url не делает ни одного запроса, все ошибки сети гасятся.
const NET={url:'https://rqliljvgabjefmkfefxb.supabase.co',key:'sb_publishable_duTc_qYnmM6pGsWrrF4fiA_vcPcOqJK',mail:'mort1sss.github.io'};
const NKEY='dst24-net-v1';
let netSt={};try{netSt=JSON.parse(localStorage.getItem(NKEY))||{}}catch(e){}
const netSave=()=>{try{localStorage.setItem(NKEY,JSON.stringify(netSt))}catch(e){}};
const online=()=>!!NET.url&&!!netSt.tok;
const NET_ERR={'invalid login credentials':'Неверный логин или пароль','user already registered':'Логин занят','email_exists':'Логин занят','weak_password':'Пароль слишком простой','over_request_rate_limit':'Слишком часто, подождите минуту','over_email_send_rate_limit':'Слишком часто, подождите минуту'};
const netTr=m=>{m=String(m||'').toLowerCase();for(const k in NET_ERR)if(m.includes(k))return NET_ERR[k];return m.includes('password')&&m.includes('6')?'Пароль не короче 6 символов':'Не получилось. Попробуйте ещё раз'};
// низкоуровневый запрос: {ok,st,data}; при сбое сети {ok:false,st:0}
async function netReq(path,o={},retry=true){
  if(!NET.url)return{ok:false,st:0};
  const ac=new AbortController(),tm=setTimeout(()=>ac.abort(),8000);
  try{
    const h={apikey:NET.key,Authorization:'Bearer '+((o.auth!==false&&netSt.tok)||NET.key),'Content-Type':'application/json'};if(o.prefer)h.Prefer=o.prefer;
    const r=await fetch(NET.url.replace(/\/$/,'')+path,{method:o.method||'GET',headers:h,body:o.body!=null?JSON.stringify(o.body):undefined,signal:ac.signal,keepalive:!!o.keep});
    let d=null;try{d=await r.json()}catch(e){}
    if(r.status===401&&retry&&o.auth!==false&&netSt.ref&&await netRefresh())return netReq(path,o,false);
    return{ok:r.ok,st:r.status,data:d}}
  catch(e){return{ok:false,st:0}}finally{clearTimeout(tm)}}
let netRef=null;
function netRefresh(){return netRef||(netRef=(async()=>{const r=await netReq('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:netSt.ref},auth:false},false);
  if(r.ok&&r.data&&r.data.access_token){netTokens(r.data);return true}
  if(r.st>=400&&r.st<500){netSt.tok=netSt.ref=null;netSave()}return false})().finally(()=>{netRef=null}))}
const netTokens=d=>{netSt.tok=d.access_token;netSt.ref=d.refresh_token;netSt.exp=Date.now()+(d.expires_in||3600)*1000;if(d.user)netSt.uid=d.user.id;netSave()};
const api=async(path,o)=>{const r=await netReq(path,o);return r.ok?(r.data==null?{}:r.data):null};
const rpc=(name,args)=>api('/rest/v1/rpc/'+name,{method:'POST',body:args||{}});
const netMail=l=>l+'@'+NET.mail;
const netLogin=l=>String(l||'').trim().toLowerCase();
async function netAuth(path,body,nick){
  const r=await netReq(path,{method:'POST',body,auth:false});
  if(!r.ok||!r.data||!r.data.access_token){if(!r.st)return'Нет связи с сервером';const d=r.data||{};return netTr(d.msg||d.error_description||d.message||d.error_code||d.error)}
  netTokens(r.data);netSt.nick=nick||(r.data.user&&r.data.user.user_metadata&&r.data.user.user_metadata.nick)||netSt.nick||'';netSave();
  rpc('touch');return''}
async function signUp(login,pass,nick){login=netLogin(login);nick=String(nick||'').trim();
  if(!/^[a-z0-9_]{3,20}$/.test(login))return'Логин: 3–20 символов, латиница, цифры и _';
  if(pass.length<6)return'Пароль не короче 6 символов';
  if(nick.length<2||nick.length>16)return'Ник: от 2 до 16 символов';
  const e=await netAuth('/auth/v1/signup',{email:netMail(login),password:pass,data:{nick}},nick);
  if(e||netSt.tok)return e;
  return netSignIn(login,pass)}
const netSignIn=async(login,pass)=>{const e=await netAuth('/auth/v1/token?grant_type=password',{email:netMail(login),password:pass});
  if(!e&&!netSt.nick){const p=await api('/rest/v1/profiles?select=nick&id=eq.'+netSt.uid);if(p&&p[0]){netSt.nick=p[0].nick;netSave()}}return e};
const signIn=(login,pass)=>{login=netLogin(login);if(!/^[a-z0-9_]{3,20}$/.test(login)||!pass)return Promise.resolve('Неверный логин или пароль');return netSignIn(login,pass)};
async function signOut(){if(netSt.tok)netReq('/auth/v1/logout',{method:'POST'},false);netSt={};netSave();netLB={}}
/* ---- облачные сохранения ---- */
let netHold=false,netPushT=0;
const cloudOk=()=>online()&&!netOff&&S&&!S.preview&&S.mode!=='sandbox'&&!netHold;
const livOpen=()=>Object.entries(UNLOCK.livery||{}).filter(([,a])=>G.ach&&G.ach[a]).map(([k])=>k);
function metaMerge(m){ // мета всегда объединяется, независимо от выбора партии
  if(!m||typeof m!=='object')return;try{
    const h0=JSON.stringify(G.hold),a0=Object.keys(G.ach||{}).length;
    G.hold=holdMerge(holdG(),m.hold);G.ach=G.ach||{};
    (Array.isArray(m.ach)?m.ach:[]).slice(0,500).forEach(k=>{if(typeof k==='string'&&k.length<40)G.ach[k]=true});
    (Array.isArray(m.liv)?m.liv:[]).slice(0,100).forEach(k=>{const a=UNLOCK.livery&&UNLOCK.livery[String(k)];if(a)G.ach[a]=true});
    if(JSON.stringify(G.hold)!==h0||Object.keys(G.ach).length!==a0){saveG();cloudPush(true)}}catch(e){}}
async function cloudPush(force,keep){
  if(!cloudOk()||(!force&&Date.now()-netPushT<30000))return;netPushT=Date.now();
  const body={data:S,meta:{hold:holdG(),ach:Object.keys(G.ach||{}),liv:livOpen(),at:Date.now()},mode:S.mode,day:S.day,money:Math.round(S.money),cars:totalCars(),stars:S.stars||0,bal:S.bal||1,updated_at:new Date().toISOString()};
  await api('/rest/v1/saves?on_conflict=user_id',{method:'POST',prefer:'resolution=merge-duplicates,return=minimal',body,keep:!!keep&&JSON.stringify(body).length<60000})}
const cloudInfo=r=>`${{campaign:'кампания',endless:'бесконечный',story:'сюжет',daily:'испытание дня',contest:'соревнование'}[r.mode]||esc(r.mode)}, день ${esc(r.day)}, касса ${rub(r.money)}${r.at?`, сохранено ${esc(new Date(r.at).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}))}`:''}`;
const netBusy=()=>!$('modal').hidden||!!(S&&S.morning&&S.morning.length);
async function cloudPull(tries=0){
  if(!online()||netOff)return;
  const a=await api('/rest/v1/saves?select=data,meta,mode,day,money,updated_at&limit=1');if(!a)return;
  const c=a[0],mine=S&&!S.preview&&S.mode!=='sandbox';if(c)metaMerge(c.meta);
  if(!c||!c.data||!c.data.fleet){if(mine)cloudPush(true);return}
  const use=()=>{S=Object.assign(fixState(c.data),{preview:false});ctSync(S);movers=[];save();hideModal();render();toast('Загружено из облака: день '+S.day);
    if(S.over){hasLimit()&&S.day>dayLimit()?finale():gameOver()}else if(S.morning&&S.morning.length)runMorning()};
  if(!mine){if(S&&S.mode==='sandbox')return;use();return}
  if(c.mode===S.mode&&c.day===S.day&&Math.round(c.money)===Math.round(S.money))return;
  if(S.gid&&c.data.gid===S.gid&&c.day<=S.day){cloudPush(true);return} // та же партия, здесь она не отстаёт
  if(netBusy()){if(tries<240)setTimeout(()=>cloudPull(tries+1),5000);return} // не поверх утра и мини-игр
  netHold=true;
  showModal(`<span class="step">ОБЛАКО</span><h2>Какую партию оставить?</h2><p>В облаке: ${cloudInfo({mode:c.mode,day:c.day,money:c.money,at:c.updated_at})}.</p><p>На этом устройстве: ${cloudInfo({mode:S.mode,day:S.day,money:S.money})}.</p><p class="note">Вторая партия будет заменена.</p>
    <div class="btns"><button class="buy" id="cvCloud">Из облака</button><button class="buy alt" id="cvHere">С этого устройства</button></div>`);
  $('cvCloud').onclick=()=>{netHold=false;use()};
  $('cvHere').onclick=()=>{netHold=false;hideModal();cloudPush(true)}}
document.addEventListener('visibilitychange',()=>{if(document.hidden)cloudPush(true,true)});
/* ---- рекорды ---- */
let netLB={},netView='mine',netLBMode='campaign',netLBDiff='normal';
let netSubP=null;
function netSubmit(r,sc){if(!online()||netOff)return;netSubP=rpc('submit_score',{p_mode:r.mode,p_diff:r.diff,p_day_key:r.mode==='daily'||r.mode==='contest'?S.dailyKey:'',p_score:Math.max(0,Math.round(sc)),p_stars:r.stars||0,p_days:r.days,p_cars:r.cars,p_money:r.money,p_bal:r.bal})}
async function netBoardLoad(mode,key){
  const df=mode==='campaign'&&DIFF[netLBDiff]?netLBDiff:'',k=mode+'|'+(key||'')+'|'+df;netLB[k]='load';
  const q=key?'&day_key=eq.'+encodeURIComponent(key):'';
  const rows=await api('/rest/v1/leaderboard?select=nick,mode,diff,score,stars,days,cars,money,created_at&mode=eq.'+mode+(df?'&diff=eq.'+df:'')+q+'&order=score.desc&limit='+(key?200:60));
  if(rows){const seen={};netLB[k]=rows.filter(x=>seen[x.nick]?0:(seen[x.nick]=1)).slice(0,key?200:20)}else netLB[k]='err';
  return netLB[k]}
async function netPlace(){
  const key=S.dailyKey,mine=netSt.nick,el=()=>$('dyPlace');
  if(!online()||!key)return;
  try{await netSubP}catch(e){}
  const rows=await netBoardLoad(S.mode==='contest'?'contest':'daily',key);if(!el())return;
  if(!Array.isArray(rows)){el().textContent='';return}
  const i=rows.findIndex(x=>x.nick===mine);el().textContent=i<0?'':`${S.mode==='contest'?'Место':'Сегодня: место'} ${i+1} из ${rows.length}`}
const NET_MODES=[['campaign','Кампания'],['endless','Бесконечный'],['story','Сюжет'],['daily','Испытание дня'],['contest','Соревнование']];
const netKey=()=>netLBMode==='daily'?todayKey():netLBMode==='contest'&&netContest()?'c'+netContest().id:'';
const netBoardHead=()=>`<div class="tabs" style="margin-bottom:8px"><button class="tab${netView==='mine'?' on':''}" data-nv="mine">Мои</button><button class="tab${netView==='all'?' on':''}" data-nv="all">Все игроки</button></div>${netView==='all'?`<div class="tabs" style="margin-bottom:8px">${NET_MODES.filter(([k])=>k!=='contest'||netContest()).map(([k,l])=>`<button class="tab${netLBMode===k?' on':''}" data-nm="${k}">${l}</button>`).join('')}</div>${netLBMode==='campaign'?`<div class="tabs" style="margin-bottom:8px">${['easy','normal','hard'].map(k=>`<button class="tab${netLBDiff===k?' on':''}" data-nd="${k}">${DIFF[k].n}</button>`).join('')}</div>`:''}`:''}`;
function netBoardRows(){
  if(!online())return'<p class="kind">Войдите через «Меню → Онлайн», чтобы видеть общий рейтинг.</p>';
  const key=netKey(),v=netLB[netLBMode+'|'+key+'|'+(netLBMode==='campaign'?netLBDiff:'')];
  if(!v||v==='load')return'<p class="kind">загрузка…</p>';
  if(v==='err')return'<p class="kind">нет связи</p>';
  if(!v.length)return'<p class="kind">Пока пусто.</p>';
  return`<div class="tablewrap"><table><thead><tr><th>#</th><th>Игрок</th><th>Дней</th><th>Машин</th><th>Касса</th><th>Очки</th></tr></thead><tbody>${v.map((r,i)=>`<tr${r.nick===netSt.nick?' style="outline:3px solid var(--taxi)"':''}><td>${i+1}</td><td>${esc(r.nick)}</td><td>${r.days}</td><td>${r.cars}</td><td>${rub(r.money)}</td><td>${Number(r.score).toLocaleString('ru-RU')}${r.stars?' '+'★'.repeat(r.stars):''}</td></tr>`).join('')}</tbody></table></div>`}
function netBoardBind(){
  const B=$('mbody');if(!B)return;
  const load=()=>{const key=netKey();if(online()&&netView==='all'){netBoardLoad(netLBMode,key).then(()=>{if(uiTab==='ach')renderMgmt()});}};
  B.querySelectorAll('[data-nv]').forEach(b=>b.onclick=()=>{netView=b.dataset.nv;if(netView==='all')load();renderMgmt()});
  B.querySelectorAll('[data-nd]').forEach(b=>b.onclick=()=>{netLBDiff=b.dataset.nd;load();renderMgmt()});
  B.querySelectorAll('[data-nm]').forEach(b=>b.onclick=()=>{netLBMode=b.dataset.nm;load();renderMgmt()})}
/* ---- окно «Онлайн» ---- */
const netDot=()=>`<span class="netdot ${online()?'on':''}"></span>`;
function openNetModal(msg){
  if(!NET.url){showModal(`<span class="step">ОНЛАЙН</span><h2>Онлайн не настроен</h2><p class="note">Игра работает без сети.</p><div class="btns"><button class="btn ghost" id="nvClose">Закрыть</button></div>`);$('nvClose').onclick=hideModal;return}
  if(online()){
    showModal(`<span class="step">ОНЛАЙН</span><h2>${netDot()} На связи</h2><p>Вы вошли как <b>${esc(netSt.nick||'игрок')}</b>. Партия копируется в облако после каждого дня, результаты уходят в общую таблицу.</p><p class="note" id="nvMsg">${msg?esc(msg):''}</p>
      <div class="btns"><button class="buy" id="nvCity">Город</button><button class="buy" id="nvSync">Синхронизировать</button><button class="buy alt" id="nvOut">Выйти</button><button class="btn ghost" id="nvClose">Закрыть</button></div>`);
    $('nvCity').onclick=openCity;
    $('nvSync').onclick=async()=>{$('nvMsg').textContent='Связываюсь…';netPushT=0;await cloudPull();if($('nvMsg'))$('nvMsg').textContent='Готово'};
    $('nvOut').onclick=async()=>{await signOut();openNetModal('Вы вышли.')};
  }else{
    showModal(`<span class="step">ОНЛАЙН</span><h2>${netDot()} Вход в диспетчерскую</h2><p class="note">Облачные сохранения и общий рейтинг. Без входа игра работает как раньше.</p>
      <div class="netform"><input type="text" id="nvLogin" placeholder="Логин (латиница)" autocomplete="username" autocapitalize="none" maxlength="20" aria-label="Логин"><input type="password" id="nvPass" placeholder="Пароль" autocomplete="current-password" maxlength="72" aria-label="Пароль"><input type="text" id="nvNick" placeholder="Ник (только для регистрации)" maxlength="16" aria-label="Ник"></div>
      <p class="neg" id="nvMsg">${msg?esc(msg):''}</p>
      <div class="btns"><button class="buy" id="nvIn">Войти</button><button class="buy alt" id="nvUp">Регистрация</button><button class="btn ghost" id="nvClose">Закрыть</button></div>`);
    const go=up=>async()=>{const m=$('nvMsg'),b=[$('nvIn'),$('nvUp')];m.className='note';m.textContent='Связываюсь…';b.forEach(x=>x.disabled=true);
      const e=await(up?signUp($('nvLogin').value,$('nvPass').value,$('nvNick').value):signIn($('nvLogin').value,$('nvPass').value));
      if(!$('nvMsg'))return;if(e){m.className='neg';m.textContent=e;b.forEach(x=>x.disabled=false);return}
      toast('Вы на связи: '+(netSt.nick||''));sfx('coin');openNetModal();await cloudPull();netGifts();netMailRun();render()};
    $('nvIn').onclick=go(0);$('nvUp').onclick=go(1)}
  $('nvClose').onclick=hideModal}
if(NET.url&&netSt.tok)setTimeout(async()=>{rpc('touch');await cloudPull();netGifts();netMailRun()},1500);
if(NET.url)setTimeout(netLoad,600);

/* ---- правки баланса, события, подарки ---- */
let netOff=false; // бот ?sim: онлайн-правки не видит
const netBC=new Map(),netToday=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const netIn=(e,t)=>(!e.starts||String(e.starts).slice(0,10)<=t)&&(!e.ends||String(e.ends).slice(0,10)>=t);
const netClamp=(x,a,b)=>Math.max(a,Math.min(b,+x||0));
async function netLoad(){if(!NET.url)return;
  const[c,e]=await Promise.all([api('/rest/v1/config?active=eq.true&select=rev,base,patch'),api('/rest/v1/events?active=eq.true&select=id,kind,title,text,params,starts,ends')]);
  if(Array.isArray(c)){netSt.cfg=c;netBC.clear()}if(Array.isArray(e))netSt.ev=e;if(c||e)netSave();if($('mCamp')&&!$('modal').hidden)pickMode()}
// последняя правка для текущей базы баланса: новая партия запоминает её номер
const netRevNow=()=>{let m=0;if(NET.url&&Array.isArray(netSt.cfg))for(const x of netSt.cfg)if(x&&+x.base===BAL_NEW&&+x.rev>m)m=+x.rev;return m};
// слияние: число к числу, объект к объекту; иное — база
const netMerge=(b,p)=>typeof b==='number'?(typeof p==='number'&&isFinite(p)?p:b):b&&typeof b==='object'&&!Array.isArray(b)?(p&&typeof p==='object'&&!Array.isArray(p)?Object.fromEntries(Object.entries(b).map(([k,x])=>[k,k in p?netMerge(x,p[k]):x])):b):b;
const netDeep=(a,p)=>a&&p&&typeof a==='object'&&typeof p==='object'&&!Array.isArray(a)&&!Array.isArray(p)?Object.assign({},a,Object.fromEntries(Object.entries(p).map(([k,x])=>[k,netDeep(a[k],x)]))):p;
// слепок всех активных правок для BAL_NEW по порядку rev: новая партия берёт его целиком, выключение правки её не меняет
function netSnap(){const o={};if(NET.url&&Array.isArray(netSt.cfg))netSt.cfg.filter(x=>x&&+x.base===BAL_NEW&&x.patch&&typeof x.patch==='object').sort((a,b)=>a.rev-b.rev).forEach(x=>{for(const k in x.patch)o[k]=netDeep(o[k],x.patch[k])});return o}
function netPatch(k,b){if(netOff||!S.balPatch)return b;const key=S.gid+'|'+S.balRev+'|'+S.bal+'|'+k;if(netBC.has(key))return netBC.get(key);
  const p=S.balPatch,r=k in p?netMerge(b,p[k]):b;netBC.set(key,r);if(netBC.size>400)netBC.clear();return r}
const netLiveGame=()=>!netOff&&!!S&&!S.preview&&!S.over&&S.mode!=='sandbox'&&!dailyLike()&&(S.bal||1)>=6;
const netRevK=()=>{if(!S.netRev||!S.netRev.length)return 1;const t=netToday();return netClamp(S.netRev.reduce((a,x)=>x.ends>=t?a*x.k:a,1),.5,1.5)};
function netDay(){
  if(!NET.url||!Array.isArray(netSt.ev)||!netLiveGame())return false;
  const t=netToday();let news=false;S.netSeen=S.netSeen||{};
  for(const e of netSt.ev){if(!e||S.netSeen[e.id]||!netIn(e,t))continue;const p=e.params||{};
    if(e.kind==='news'){S.netNews=(S.netNews||[]).concat([{t:String(e.title||'').slice(0,80),x:String(e.text||'').slice(0,400)}]);news=true}
    else if(e.kind==='rev'){const k=netClamp(p.k||1,.5,1.5);S.netRev=(S.netRev||[]).concat([{k,ends:e.ends?String(e.ends).slice(0,10):t}]);addLog(`Новости города: ${esc(String(e.title||'выручка').slice(0,60))} (выручка ×${k}).`)}
    else if(e.kind==='cash'){G.netSeen=G.netSeen||{};if(G.netSeen[e.id]){S.netSeen[e.id]=1;continue}G.netSeen[e.id]=1;saveG();const a=Math.round(netClamp(p.amount,-1e5,1e5));S.money+=a;addLog(`${esc(String(e.title||'Диспетчерская').slice(0,60))}: ${a<0?'−':'+'}${rub(Math.abs(a))}.`)}
    else if(e.kind==='event'){const id=typeof p.id==='string'&&isNaN(+p.id)?p.id:Math.round(+p.id),d=typeof id==='string'?(CHAINS[id]&&CHAINS[id].d):Math.round(+p.d);
      if(!(d>=0&&d<=2)||(typeof id==='string'?!CHAINS[id]:!EVENTS[d][id]))continue;S.queue.push({d,id,at:S.day})}
    else continue;
    S.netSeen[e.id]=1}
  return news}
function netNewsEv(){const n=S.netNews||[];S.netNews=[];
  if(!n.length){runMorning();return}
  n.forEach(x=>addLog('Новости: '+esc(x.t)));save();
  showModal(`<div class="paper"><div class="paper-head">СРОЧНО ИЗ ДИСПЕТЧЕРСКОЙ</div>${n.map(x=>`<h3>${esc(x.t)}</h3><p>${esc(x.x)}</p>`).join('')}</div><button class="btn" id="nnOk">Понятно</button>`);
  $('nnOk').onclick=()=>{hideModal();runMorning()}}
function netGrant(r){const p=r.params||{};
  if(r.kind==='ach'){const a=ACH.find(x=>x[0]===p.id);if(!a)return;G.ach[a[0]]=true;saveG();if(S&&!S.preview){S.ach[a[0]]=S.ach[a[0]]||S.day;addLog(`Достижение: «${a[1]}»`)}}
  else if(r.kind==='money'){const a=Math.round(netClamp(p.amount,0,1e5));if(!a)return;
    if(netLiveGame()){S.money+=a;addLog(`Подарок от диспетчерской: ${rub(a)}.`);save();render()}else{G.netGift=(+G.netGift||0)+a;saveG()}}
  else if(r.kind==='livery'){const a=UNLOCK.livery[String(p.id)];if(!a)return;G.ach[a]=true;saveG()}
  else if(r.kind==='note'){const t=String(p.text||p.note||'').slice(0,400);if(!t)return;
    if($('modal').hidden)showModal(`<span class="step">ДИСПЕТЧЕРСКАЯ</span><h2>Сообщение</h2><p>${esc(t)}</p><button class="btn" id="ngOk">Понятно</button>`),$('ngOk').onclick=hideModal;
    else if(S&&!S.preview)addLog('Диспетчерская: '+esc(t))}
  else return;
  toast(r.kind==='note'?'Записка от диспетчерской':'Подарок от диспетчерской');sfx('win')}
let netGB=false;
async function netGifts(){if(!online()||netGB||netOff)return;netGB=true;
  try{const l=await rpc('my_grants');if(!Array.isArray(l))return;
    for(const g of l.slice(0,20)){const id=Math.round(+g.id);if(!id)continue;const r=await rpc('claim_grant',{p_id:id});if(r&&r.kind)netGrant(r)}}
  catch(e){}finally{netGB=false}}
// входящие письма: сначала my_mail (список), mail_done забирает письмо, и только его ответ даёт награду/потерю
let netMB=false;
async function netMailRun(){if(!online()||netMB||!netLiveGame())return;netMB=true;
  try{const l=await rpc('my_mail');if(!Array.isArray(l))return;let any=false;
    for(const m of l.slice(0,10)){if(!netLiveGame())break;const id=Math.round(+m.id);if(!id)continue;
      const r=await rpc('mail_done',{p_id:id});if(!r||!r.kind||!netLiveGame())continue;
      const p=r.params||m.params||{},from=esc(String(p.from||(m.params&&m.params.from)||'другой таксопарк').slice(0,16));
      if(r.kind==='poach'){S.drivers=Math.max(1,S.drivers-1);syncDrivers();addLog(`Водителя переманил ${from}.`);toast('Водителя переманили')}
      else if(r.kind==='gift'){const a=Math.round(netClamp(p.amount,0,20000));if(!a)continue;S.money+=a;addLog(`Подарок от ${from}: ${rub(a)}.`);toast('Подарок от игрока')}
      else continue;any=true}
    if(any){save();render()}}
  catch(e){}finally{netMB=false}}
/* ---- соревнование недели ---- */
const netCt=e=>{const p=e.params||{},seed=Math.round(netClamp(p.seed,1,1e6))||1,sc=p.sc!=null&&p.sc!==''&&Number.isInteger(+p.sc)&&+p.sc>=0&&+p.sc<DAILY_SC.length?+p.sc:seed%DAILY_SC.length;return{seed,sc,diff:DIFF[p.diff]?p.diff:'normal'}};
const netContest=()=>{if(netOff||!NET.url||!Array.isArray(netSt.ev))return null;const t=netToday();return netSt.ev.find(e=>e&&e.kind==='contest'&&netIn(e,t))||null};
let ctOn=false,ctRnd0=null;
const mulberry32=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
function ctUse(seed,day){if(!ctOn){ctOn=true;ctRnd0=Math.random}Math.random=mulberry32((Math.round(+seed)||1)*1000+(+day||1))}
function ctSync(st){if(st&&st.mode==='contest'&&!st.over&&!st.preview)ctUse(st.seed,st.day);else if(ctOn){ctOn=false;Math.random=ctRnd0}}
/* ---- город ---- */
/* ---- общий город ---- */
// районы те же, что в supabase/schema.sql (set_town); r — прямоугольник на карте 192×128; числа — BAL[6].town
const TOWN={center:{n:'Центр',r:[0,0,64,64]},station:{n:'Вокзал',r:[64,0,64,64]},airport:{n:'Аэропорт',r:[128,0,64,64]},sleep:{n:'Спальный',r:[0,64,64,64]},univer:{n:'Студгородок',r:[64,64,64,64]},industry:{n:'Промзона',r:[128,64,64,64]}};
const TOWN_KEYS=Object.keys(TOWN),TOWN_H=48*36e5,tf2=x=>x.toFixed(2).replace('.',',');
const townOn=()=>!netOff&&online()&&!!netSt.townIn&&!!S&&netLiveGame()&&(camp()||endl())&&Array.isArray(netSt.town)&&Date.now()-(netSt.townAt||0)<TOWN_H;
const townGame=()=>netLiveGame()&&(camp()||endl());
const townCap=()=>Math.min(totalCars(),10+3*S.day,300); // не больше, чем допустит сервер и сохранение
const townSum=()=>TOWN_KEYS.reduce((a,d)=>a+(+S.townAlloc[d]||0),0);
// машин стало меньше — лишнее снимается с районов с конца списка
function townFix(){const a=S.townAlloc=S.townAlloc||{};let ex=townSum()-townCap(),ch=false;
  for(let i=TOWN_KEYS.length-1;i>=0&&ex>0;i--){const d=TOWN_KEYS[i],n=+a[d]||0,c=Math.min(n,ex);if(c){a[d]=n-c;ex-=c;ch=true}}
  TOWN_KEYS.forEach(d=>{if(!(a[d]>0))delete a[d]});if(ch&&netSt.townIn)townSave();return ch}
// по каждому району: мои/все машины, лидер ('*' — я, '' — нет), множитель kd
function townInfo(){const T=bal('town')||BAL[6].town,o={};
  TOWN_KEYS.forEach(d=>{const c=T[d]||{k:1,cap:99},mine=+S.townAlloc[d]||0,rv=[];
    (netSt.town||[]).forEach(r=>{const n=r&&!r.mine&&r.alloc?Math.max(0,+r.alloc[d]||0):0;if(n>0)rv.push([String(r.nick||'?'),n])});
    rv.sort((a,b)=>b[1]-a[1]);const top=rv.length?rv[0][1]:0,tot=mine+rv.reduce((a,x)=>a+x[1],0);
    const me=mine>top&&top>0,who=me?'*':top>mine&&(mine>0||rv.length>1)&&(rv.length<2||top>rv[1][1])?rv[0][0]:'';
    o[d]={n:TOWN[d].n,k:c.k,cap:c.cap,mine,tot,who,me,kd:c.k*Math.max(bal('townFloor'),tot>0?Math.min(1,c.cap/tot):1)*(me?1+bal('townLead'):1)}});
  return o}
// множитель выручки парка: машины вне районов работают с k=1
const townK=()=>{if(!townOn())return 1;townFix();const n=totalCars();if(!n)return 1;const i=townInfo();let s=0,m=0;
  TOWN_KEYS.forEach(d=>{s+=i[d].mine*i[d].kd;m+=i[d].mine});return netClamp((s+Math.max(0,n-m))/n,bal('townMin'),bal('townMax'))};
let townTry=0,townT=0;
async function townLoad(force){if(!online()||netOff||(!force&&Date.now()-townTry<3e5))return false;townTry=Date.now();
  const r=await rpc('town_state');if(!Array.isArray(r))return false;const was=!!netSt.townIn;
  netSt.town=r.filter(x=>x&&x.alloc&&typeof x.alloc==='object');netSt.townAt=Date.now();netSt.townIn=netSt.town.some(x=>x.mine);netSave();
  if(was&&!netSt.townIn){netSt.townLeads={};netSave();toast('Вы выбыли из города: 7 дней без ходов')}
  if(S&&!S.preview&&townGame()){townNews();const m=netSt.town.find(x=>x.mine);
    if(m&&(Date.now()-new Date(m.updated_at)>864e5||TOWN_KEYS.some(d=>(+m.alloc[d]||0)!==(+S.townAlloc[d]||0))))townSave()}
  return true}
// новости: кто стал лидером района
function townNews(){if(!townGame()||!netSt.townIn)return;const i=townInfo(),p=netSt.townLeads||{},o={};
  TOWN_KEYS.forEach(d=>{const w=i[d].who,n=i[d].n;o[d]=w;if(!(d in p)||p[d]===w)return;
    if(w==='*')addLog(`Вы стали лидером района «${n}»: там +${Math.round(bal('townLead')*100)}% к выручке.`);
    else if(p[d]==='*')addLog(`Вас вытеснили из лидеров района «${n}»${w?`: теперь там ${esc(w)}`:''}.`);
    else if(w)addLog(`${esc(w)} стал лидером района «${n}».`)});
  netSt.townLeads=o;netSave();save()}
// запись распределения на сервер (с задержкой, чтобы не слать на каждый клик)
const townSave=()=>{clearTimeout(townT);townT=setTimeout(townPush,2000)};
async function townPush(){if(!online()||netOff||!netSt.townIn||!S||S.preview||!townGame())return null;
  const a={};TOWN_KEYS.forEach(d=>{if(S.townAlloc[d]>0)a[d]=S.townAlloc[d]});const c=(COLORS[(S.custom||{}).color]||{}).body;
  await cloudPush(true); // сервер сверяет число машин с облачным сохранением
  const r=await rpc('set_town',{p_alloc:a,p_color:/^#[0-9a-f]{6}$/i.test(c)?c:null});
  if(r&&r.ok===false){toast(String(r.err||'Город не принял расстановку').slice(0,80));const m=(netSt.town||[]).find(x=>x.mine);
    if(m){S.townAlloc={};TOWN_KEYS.forEach(d=>{const n=+m.alloc[d]||0;if(n>0)S.townAlloc[d]=n});townFix();save();if($('townMap')&&!$('modal').hidden)cityMapView()}}
  return r}
function townDay(){if(netOff||!online()||!S||S.preview||!townGame())return;townFix();townLoad(false)}
async function townJoin(){if(!townGame())return'Город работает в кампании и бесконечном режиме';
  townFix();netSt.townIn=true;const a=await townPush();
  if(!a||!a.ok){netSt.townIn=false;return a&&a.err?String(a.err).slice(0,80):'Нет связи, попробуйте позже'}
  await townLoad(true);return''}
async function townLeave(){clearTimeout(townT);netSt.townIn=false;const a=await rpc('leave_town');if(!a){netSt.townIn=true;return'Нет связи, попробуйте позже'}
  netSt.town=(netSt.town||[]).filter(x=>!x.mine);netSt.townLeads={};netSave();return''}
// карта на canvas 192×128 (state — результат townInfo()); районы рисуются в рамке r, мелкими пикселями
let townSel='';
const TFONT={0:'111101101101111',1:'010110010010111',2:'111001111100111',3:'111001111001111',4:'101101111001001',5:'111100111001111',6:'111100111101111',7:'111001001010010',8:'111101111101111',9:'111101111001111','/':'001001010100100'};
function drawTown(cv,state){const g=cv.getContext('2d'),cs=getComputedStyle(document.documentElement),v=(n,f)=>cs.getPropertyValue(n).trim()||f;
  const NIGHT=v('--night','#1d1838'),PANEL=v('--panel','#2a2450'),EDGE=v('--edge','#0e0b1c'),INK=v('--ink','#f3ecdc'),MUTED=v('--muted','#a8a0cc'),TAXI=v('--taxi','#f7c331'),GOOD=v('--good','#86e06f'),BAD=v('--bad','#ff6b6b');
  const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
  const txt=(s,x,y,c)=>{for(const ch of s){const f=TFONT[ch];if(f)for(let i=0;i<15;i++)if(f[i]==='1')R(x+i%3,y+((i/3)|0),1,1,c);x+=4}};
  R(0,0,192,128,'#3a3368');
  [64,128].forEach(x=>R(x-1,0,2,128,'#4a427f'));R(0,63,192,2,'#4a427f');
  [[64,0,1,128],[128,0,1,128]].forEach(a=>{for(let i=0;i<128;i+=6)R(a[0]-.0,i,1,3,TAXI)});for(let i=0;i<192;i+=6)R(i,63,3,1,TAXI);
  const owner={};(netSt.town||[]).forEach(r=>{if(r&&r.nick!=null)owner[String(r.nick)]=/^#[0-9a-f]{6}$/i.test(r.color||'')?r.color:null});
  TOWN_KEYS.forEach(d=>{const t=TOWN[d],s=state&&state[d]||{tot:0,cap:1,mine:0,who:''},x=t.r[0]+3,y=t.r[1]+3,w=58;
    const lc=s.me?TAXI:s.who?(owner[s.who]||MUTED):null,sel=townSel===d;
    const gr={center:'#2f2a5a',station:'#2e3552',airport:'#33405a',sleep:'#2f3a50',univer:'#2c4a45',industry:'#41394f'}[d];
    R(x,y,w,w,gr);
    if(lc){g.globalAlpha=.28;R(x,y,w,w,lc);g.globalAlpha=1}
    // рисунок района
    if(d==='center'){[[5,12,8,26,'#6a63a8'],[16,4,9,34,'#8a82c8'],[28,16,8,22,'#6a63a8'],[39,8,10,30,'#8a82c8']].forEach(b=>{R(x+b[0],y+b[1],b[2],b[3],b[4]);for(let j=b[1]+3;j<36;j+=5)for(let i=b[0]+2;i<b[0]+b[2]-1;i+=3)R(x+i,y+j,1,2,(i+j)%4?TAXI:'#2a2450')});R(x+24,y+1,1,3,BAD)}
    if(d==='station'){R(x+4,y+10,34,16,'#a56a4a');R(x+4,y+8,34,3,'#6e4332');R(x+18,y+3,6,7,'#6e4332');R(x+19,y+4,4,4,INK);for(let i=7;i<36;i+=5)R(x+i,y+16,3,5,TAXI);R(x+20,y+19,2,7,EDGE);
      for(let r2=0;r2<2;r2++){R(x+2,y+31+r2*6,54,1,MUTED);R(x+2,y+34+r2*6,54,1,MUTED);for(let i=3;i<56;i+=4)R(x+i,y+30+r2*6,1,6,'#6e4332')}R(x+38,y+29,16,5,BAD);R(x+39,y+30,3,2,INK);R(x+44,y+30,3,2,INK)}
    if(d==='airport'){R(x+2,y+24,54,9,'#4a4f66');for(let i=4;i<54;i+=7)R(x+i,y+28,4,1,INK);R(x+4,y+8,10,10,'#5d6a8c');R(x+7,y+4,4,5,'#5d6a8c');R(x+8,y+3,2,2,TAXI);
      R(x+26,y+10,14,3,INK);R(x+36,y+8,6,1,INK);R(x+36,y+14,6,1,INK);R(x+38,y+9,2,5,INK);R(x+26,y+9,3,1,INK);R(x+39,y+11,3,1,BAD)}
    if(d==='sleep'){[[3,10,12,28],[18,4,12,34],[33,12,12,26],[47,6,8,32]].forEach(b=>{R(x+b[0],y+b[1],b[2],b[3],'#8c86b8');R(x+b[0],y+b[1],b[2],2,'#5a5490');for(let j=b[1]+4;j<b[1]+b[3]-2;j+=4)for(let i=b[0]+2;i<b[0]+b[2]-2;i+=4)R(x+i,y+j,2,2,(i*j)%3?TAXI:'#2a2450')})}
    if(d==='univer'){R(x+4,y+14,22,22,'#b07a55');R(x+2,y+12,26,3,'#7a4f38');R(x+13,y+6,4,6,'#7a4f38');R(x+14,y+3,2,3,TAXI);R(x+11,y+26,8,10,EDGE);for(let i=6;i<24;i+=6)R(x+i,y+19,3,4,TAXI);
      R(x+32,y+22,12,14,'#8c86b8');R(x+34,y+25,3,3,TAXI);R(x+39,y+25,3,3,TAXI);[[46,20],[51,28],[34,12],[50,10]].forEach(p=>{R(x+p[0]+1,y+p[1]+6,2,5,'#6e4332');R(x+p[0],y+p[1],4,3,'#3d8a45');R(x+p[0]-1,y+p[1]+2,6,4,'#4fae56')})}
    if(d==='industry'){R(x+3,y+18,30,20,'#7a7490');for(let i=0;i<3;i++){R(x+3+i*10,y+14,5,4,'#7a7490');R(x+5+i*10,y+20,3,4,EDGE)}
      [[38,8],[47,14]].forEach(p=>{R(x+p[0],y+p[1],5,24,'#a8a0cc');R(x+p[0],y+p[1],5,3,BAD);R(x+p[0]+1,y+p[1]-5,3,3,'#8a82a8');R(x+p[0]+3,y+p[1]-8,3,3,'#6a6488')});R(x+36,y+36,20,3,'#5a5490')}
    // машины
    const dots=[];for(let i=0;i<s.mine;i++)dots.push(TAXI);
    (netSt.town||[]).forEach(r=>{if(!r||r.mine||!r.alloc)return;const n=Math.max(0,+r.alloc[d]||0),c=/^#[0-9a-f]{6}$/i.test(r.color||'')?r.color:MUTED;for(let i=0;i<n;i++)dots.push(c)});
    dots.slice(0,12).forEach((c,i)=>{const cx=x+3+(i%6)*5,cy=y+41+((i/6)|0)*4;R(cx,cy,4,3,EDGE);R(cx,cy,4,2,c)});
    // плашка заполненности
    const lab=s.tot+'/'+s.cap,lw=lab.length*4+3,lx=x+w-lw-2,ly=y+w-9;
    R(lx,ly,lw,7,EDGE);txt(lab,lx+2,ly+1,s.tot>s.cap?BAD:s.tot?INK:MUTED);
    // рамка
    const bc=sel?INK:lc||EDGE;R(x,y,w,2,bc);R(x,y+w-2,w,2,bc);R(x,y,2,w,bc);R(x+w-2,y,2,w,bc);
    if(lc&&!sel){R(x+2,y+2,w-4,1,lc);R(x+2,y+w-3,w-4,1,lc);R(x+2,y+2,1,w-4,lc);R(x+w-3,y+2,1,w-4,lc)}
    if(s.me)R(x+w-9,y+3,6,5,TAXI),txt('1',x+w-7,y+3,EDGE);
  });
  cv.onclick=e=>{const b=cv.getBoundingClientRect(),px=(e.clientX-b.left)/b.width*192,py=(e.clientY-b.top)/b.height*128;
    const d=TOWN_KEYS.find(k=>{const r=TOWN[k].r;return px>=r[0]&&px<r[0]+r[2]&&py>=r[1]&&py<r[1]+r[3]});if(!d)return;
    townSel=d;drawTown(cv,state);const el=$('td-'+d);if(el){document.querySelectorAll('.tdrow').forEach(q=>q.style.outline='');el.style.outline='3px solid var(--taxi)';try{el.scrollIntoView({block:'center',behavior:'smooth'})}catch(x){el.scrollIntoView()}}}}
const cityTabs=t=>`<div class="tabs"><button class="tab" style="min-height:44px${t==='map'?';background:var(--taxi);color:var(--edge)':''}" id="ctTm">Карта</button><button class="tab" style="min-height:44px${t==='pk'?';background:var(--taxi);color:var(--edge)':''}" id="ctTp">Таксопарки</button><button class="tab" style="min-height:44px${t==='hd'?';background:var(--taxi);color:var(--edge)':''}" id="ctTh">Холдинги</button></div>`;
const cityTabBind=()=>{$('ctTm').onclick=()=>openCity('map');$('ctTp').onclick=()=>openCity('pk');$('ctTh').onclick=()=>openCity('hd')};
const openCity=t=>t==='pk'?cityParks():t==='hd'?cityHold():cityMap();
async function cityHold(){
  const bk=()=>{$('ctBack').onclick=()=>openNetModal();cityTabBind()};
  showModal(`<span class="step">ГОРОД</span><h2>Город</h2>${cityTabs('hd')}<p class="kind">загрузка…</p><div class="btns"><button class="btn ghost" id="ctBack">Назад</button></div>`);bk();
  const l=await rpc('holdings');if(!$('ctBack'))return;const rows=Array.isArray(l)?l.slice(0,20):null;
  showModal(`<span class="step">ГОРОД</span><h2>Город</h2>${cityTabs('hd')}<p class="note">Холдинги: проданные парки остаются франшизами. Оценка — сумма стоимости франшиз.</p>
    ${!rows?'<p class="kind">нет связи</p>':!rows.length?'<p class="kind">Пока пусто.</p>':`<div class="tablewrap"><table><thead><tr><th>Игрок</th><th>Франшиз</th><th>Оценка</th></tr></thead><tbody>${rows.map(r=>`<tr${r.nick===netSt.nick?' style="outline:3px solid var(--taxi)"':''}><td>${esc(r.nick)}<br><span class="sub">${esc('🥇'.repeat(Math.min(9,+r.golds||0))+'🥈'.repeat(Math.min(9,+r.silvers||0))+'🥉'.repeat(Math.min(9,+r.bronzes||0)))}</span></td><td>${+r.fr_count||0}</td><td>${rub(+r.hold_val||0)}</td></tr>`).join('')}</tbody></table></div>`}
    <div class="btns"><button class="btn ghost" id="ctBack">Назад</button></div>`);bk()}
async function cityMap(){
  showModal(`<span class="step">ГОРОД</span><h2>Город</h2>${cityTabs('map')}<p class="kind">загрузка…</p><div class="btns"><button class="btn ghost" id="ctBack">Назад</button></div>`);
  $('ctBack').onclick=()=>openNetModal();cityTabBind();
  const ok=await townLoad(true);if(!$('ctBack'))return;
  cityMapView(ok?'':'Нет связи — показаны прошлые данные.')}
function cityMapView(msg){
  const live=townGame(),inn=!!netSt.townIn,i=townInfo(),free=live?townCap()-townSum():0,k=townOn()?townK():1;
  const box=$('modal'),y=box.scrollTop,y2=$('modalCard').scrollTop;
  showModal(`<span class="step">ГОРОД</span><h2>Город</h2>${cityTabs('map')}
    <p class="note" id="ctMsg">${esc(msg||(live?(inn?'Расставьте машины по районам: где тесно, выручка делится; лидер района получает надбавку.':'Вступите в город, чтобы делить районы с другими таксопарками.'):'Город работает в живой партии: кампания или бесконечный режим.'))}</p>
    <canvas id="townMap" width="192" height="128" style="width:100%;max-width:420px;display:block;margin:6px auto;image-rendering:pixelated;border:3px solid var(--edge);box-sizing:border-box;cursor:pointer" aria-label="Карта города: нажмите на район"></canvas>
    ${inn&&live?`<p><b>Множитель выручки: ×${tf2(k)}</b><br><span class="sub">Свободных машин: ${free}${townOn()?'':' · данные города устарели'}</span></p>`:''}
    ${TOWN_KEYS.map(d=>{const x=i[d],full=x.tot>x.cap;return`<div class="card2 tdrow" id="td-${d}"><b>${esc(x.n)}</b>
      <span class="sub">выручка ×${tf2(x.k)} · заказов на ${x.cap} маш. · занято ${x.tot}/${x.cap}${full?' (тесно: ×'+tf2(x.kd)+')':''}</span>
      <span class="sub">Лидер: ${x.who==='*'?'вы':x.who?esc(x.who):'—'}</span>
      ${live&&inn?`<div class="btns"><button class="buy tap" style="flex:0 0 56px;min-height:48px" data-td="${d}" data-dx="-1" aria-label="Убрать машину из района ${esc(x.n)}"${x.mine?'':' disabled'}>−</button><b style="flex:1;text-align:center">Мои: ${x.mine}</b><button class="buy tap" style="flex:0 0 56px;min-height:48px" data-td="${d}" data-dx="1" aria-label="Добавить машину в район ${esc(x.n)}"${free>0?'':' disabled'}>+</button></div>`:''}</div>`}).join('')}
    <div class="btns">${live?`<button class="buy tap" id="ctJoin">${inn?'Выйти из города':'Вступить в город'}</button>`:''}<button class="btn ghost" id="ctBack">Назад</button></div>`);
  box.scrollTop=y;$('modalCard').scrollTop=y2;
  drawTown($('townMap'),i);cityTabBind();$('ctBack').onclick=()=>openNetModal();
  const m=t=>{const e=$('ctMsg');if(e)e.textContent=t};
  document.querySelectorAll('[data-td]').forEach(b=>b.onclick=()=>{const d=b.dataset.td,a=S.townAlloc,dx=+b.dataset.dx;
    if(dx>0&&townCap()-townSum()<=0)return;a[d]=Math.max(0,(+a[d]||0)+dx);townFix();save();townSave();cityMapView()});
  if($('ctJoin'))$('ctJoin').onclick=async()=>{$('ctJoin').disabled=true;m('Связываюсь…');
    const e=inn?await townLeave():await townJoin();if(!$('ctBack'))return;cityMapView(e||(inn?'Вы вышли из города':'Вы в городе'))}}

const cityLive=()=>netLiveGame();
async function cityParks(){
  showModal(`<span class="step">ГОРОД</span><h2>Город</h2>${cityTabs('pk')}<p class="kind">загрузка…</p><div class="btns"><button class="btn ghost" id="ctBack">Назад</button></div>`);
  $('ctBack').onclick=()=>openNetModal();cityTabBind();
  const l=await rpc('parks');if(!$('ctBack'))return;
  const rows=Array.isArray(l)?l.filter(x=>x&&x.nick):null;
  const MN={campaign:'кампания',endless:'бесконечный',story:'сюжет',daily:'испытание',contest:'соревнование',sandbox:'песочница'};
  const live=cityLive(),can5=live&&S.money>=5000;
  showModal(`<span class="step">ГОРОД</span><h2>Город</h2>${cityTabs('pk')}<p class="note" id="ctMsg">${live?'Переманить можно раз в сутки. Подарок — 5 000 ₽ из вашей кассы.':'Подарки и переманивание — только в живой партии (не песочница, не испытание).'}</p>
    ${!rows?'<p class="kind">нет связи</p>':!rows.length?'<p class="kind">Пока пусто.</p>':`<div class="tablewrap"><table><thead><tr><th>Игрок</th><th>День</th><th>Касса</th><th>Машин</th></tr></thead><tbody>${rows.map((r,i)=>`<tr${r.nick===netSt.nick?' style="outline:3px solid var(--taxi)"':''}><td>${esc(r.nick)}<br><span class="sub">${esc(MN[r.mode]||String(r.mode||''))}</span>${r.nick===netSt.nick?'':`<br><button class="buy sm" data-po="${i}"${live?'':' disabled'}>Переманить водителя</button> <button class="buy sm alt" data-gf="${i}"${can5?'':' disabled'}>Подарок 5 000 ₽</button>`}</td><td>${+r.day||0}</td><td>${rub(+r.money||0)}</td><td>${+r.cars||0}</td></tr>`).join('')}</tbody></table></div>`}
    <div class="btns"><button class="btn ghost" id="ctBack">Назад</button></div>`);
  $('ctBack').onclick=()=>openNetModal();cityTabBind();
  const msg=t=>{const m=$('ctMsg');if(m)m.textContent=t};
  document.querySelectorAll('[data-po]').forEach(b=>b.onclick=async()=>{const r=rows[+b.dataset.po];b.disabled=true;msg('Связываюсь…');
    const a=await rpc('poach',{p_nick:r.nick});
    if(a&&a.ok){if(cityLive()){S.drivers++;syncDrivers();addLog(`Вы переманили водителя у ${esc(r.nick)}.`);save();render()}msg('Водитель теперь ваш')}
    else msg(a&&a.err?String(a.err).slice(0,80):'Не получилось, попробуйте позже')});
  document.querySelectorAll('[data-gf]').forEach(b=>b.onclick=async()=>{const r=rows[+b.dataset.gf];if(!cityLive()||S.money<5000)return;b.disabled=true;msg('Связываюсь…');
    const a=await rpc('send_gift',{p_nick:r.nick,p_amount:5000});
    if(a&&a.ok){if(cityLive()&&S.money>=5000){S.money-=5000;addLog(`Подарок игроку ${esc(r.nick)}: −5 000 ₽.`);save();render()}msg('Подарок отправлен')}
    else msg(a&&a.err?String(a.err).slice(0,80):'Не получилось, попробуйте позже')})}
