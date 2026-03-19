const CACHE_NAME = 'pass-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './quiz.html',
  './mock.html',
  './review.html',
  './solved.html',
  './style.css',
  './data/cim.js',
  './data/fia.js',
  './data/crea1.js',
  './data/crea2.js'
];

// 설치 시 캐시 저장 및 즉시 활성화 준비
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 활성화 시 오래된 캐시 삭제 및 제어권 획득
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// 네트워크 요청 가로채기 (오프라인 지원)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
