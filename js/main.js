// Таксопарк «ДСТ-24» — старт игры
/* ================= СТАРТ ================= */
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
studioLogo(splash);
S=load();ctSync(S);
if(!S){S=blankState('campaign');S.preview=true;START_FLEET.forEach(([m,k])=>addCar(m,k));S.today=[0,1,2].map(nextEvent);render();pickMode()}
else{render();if(S.over){hasLimit()&&S.day>dayLimit()?finale():gameOver()}else if(S.morning&&S.morning.length)runMorning()}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(draw);
fitScene();draw();if(!still)requestAnimationFrame(loop);else setInterval(()=>paused||draw(),1000);
document.addEventListener('pointerdown',()=>ensureAudio(),{once:true});
if(!(S&&S.preview)){setTimeout(checkLogin,400);setTimeout(townDay,1500)}else checkLoginQuiet();
/* ---- игра сама догоняет новую версию: игроку не нужно закрывать приложение ради обновления ---- */
let swReg=null,swBusy=0;
if('serviceWorker' in navigator)addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').then(r=>{swReg=r}).catch(()=>{})});
const swCheck=()=>{try{swReg&&swReg.update()}catch(e){}};
setInterval(swCheck,300000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)swCheck()});
navigator.serviceWorker&&navigator.serviceWorker.addEventListener('controllerchange',()=>{
  if(swBusy||/[?&]sim\b/.test(location.search))return;
  const go=()=>{try{save();cloudPush(true,1)}catch(e){}location.reload()};
  if(S&&S.preview){go();return}
  if(netBusy()){swBusy=0;toast('Есть новая версия: обновится, когда закончишь дело');
    const t=setInterval(()=>{if(netBusy())return;clearInterval(t);swBusy=1;go()},2000);return}
  swBusy=1;toast('Обновляем игру…');go();});
function checkLoginQuiet(){const k=todayKey();G.login=G.login||{};if(G.login.last===k)return;const y=new Date();y.setDate(y.getDate()-1);const yk=y.getFullYear()+'-'+(y.getMonth()+1)+'-'+y.getDate();const streak=G.login.last===yk?(G.login.streak||0)+1:1;G.login={last:k,streak};G.loginPending={streak};saveG()}
