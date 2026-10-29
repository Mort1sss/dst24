// Офлайн-режим: сначала сеть (чтобы приходили обновления игры), при её отсутствии — кэш.
const CACHE='dst24-v25';
const CORE=['./','index.html','css/game.css','js/data.js','js/state.js','js/day.js','js/minigames.js','js/ui.js','js/art.js','js/sim.js','js/online.js','js/main.js',
  'manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE.map(u=>new Request(u,{cache:'reload'})))));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
  // no-cache: файлы игры не смешиваются со старыми из HTTP-кэша браузера
  e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});return r})
    .catch(()=>caches.match(e.request).then(m=>m||(e.request.mode==='navigate'?caches.match('index.html'):Response.error()))));
});
