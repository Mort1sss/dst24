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
function checkLoginQuiet(){const k=todayKey();G.login=G.login||{};if(G.login.last===k)return;const y=new Date();y.setDate(y.getDate()-1);const yk=y.getFullYear()+'-'+(y.getMonth()+1)+'-'+y.getDate();const streak=G.login.last===yk?(G.login.streak||0)+1:1;G.login={last:k,streak};G.loginPending={streak};saveG()}
