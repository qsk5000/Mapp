const CACHE_NAME = 'mizaniq-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// --- مرحلة التثبيت (Install) ---
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching assets...');
      return cache.addAll(ASSETS);
    }).catch(err => console.error('Asset caching failed:', err))
  );
  self.skipWaiting();
});

// --- مرحلة التفعيل (Activate) - تنظيف الكاش القديم ---
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// --- معالجة الطلبات (Fetch) ---
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // السماح بطلبات الـ Domains الخارجية (مثل API أو خطوط جوجل) دون قيود المصدر نفسه
  // لكن سنطبق سياسة التخزين عليها لاحقاً إذا رغبت
  
  // 1. استراتيجية Network First للصفحات (Navigate)
  if (request.mode === 'navigate' || request.destination === 'document') {
    e.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then(cached => cached || caches.match('/index.html'));
        })
    );
    return;
  }

  // 2. استراتيجية Cache First للملفات الثابتة (JS, CSS, Images, Fonts)
  e.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then(networkResponse => {
        // التحقق من صحة الاستجابة قبل تخزينها
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && url.origin !== location.origin) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback في حالة الأوفلاين للصور
        if (request.destination === 'image') {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect fill="#162338" width="200" height="200"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#7A8A9F" font-size="14" font-family="Arial">Offline</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
      });
    })
  );
});
