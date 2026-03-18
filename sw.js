const CACHE_NAME = 'pass-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/quiz.html',
  '/mock.html',
  '/review.html',
  '/solved.html',
  '/style.css',
  '/data/cim.js',
  '/data/fia.js',
  '/data/crea1.js',
  '/data/crea2.js'
];

// 설치 시 캐시 저장
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
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
