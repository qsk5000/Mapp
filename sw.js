const CACHE_NAME = 'mizaniq-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@300;400;500;700&display=swap'
];

// Install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // ✅ الروابط الخارجية تفتح عادي (بدون تدخل)
  if (url.origin !== self.location.origin) {
    return;
  }

  // ✅ Navigation requests (لما المستخدم يضغط رابط) → رجّع index.html دائماً
  if (request.mode === 'navigate') {
    e.respondWith(
      caches.match('/index.html').then(cached => {
        return cached || fetch('/index.html');
      })
    );
    return;
  }

  // ✅ باقي الطلبات (CSS, JS, Images) → Cache first
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(res => {
        if (!res  res.status !== 200  res.type !== 'basic') return res;
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, resClone));
        return res;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
