// PWA 제거용 킬 스위치 (Kill Switch)
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  self.registration.unregister()
    .then(() => self.clients.matchAll())
    .then((clients) => {
      clients.forEach(client => client.navigate(client.url));
    });
});

// 기존 캐시 모두 삭제
caches.keys().then((names) => {
  for (let name of names) caches.delete(name);
});
