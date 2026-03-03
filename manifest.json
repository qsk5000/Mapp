const CACHE_NAME = 'mizaniq-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install - تحميل الملفات الأساسية
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // استخدام return هنا يضمن عدم انتهاء الـ install إلا بعد تحميل الأصول
      return cache.addAll(ASSETS); 
    }).catch(err => console.error('Caching failed:', err))
  );
  self.skipWaiting();
});

// Activate - تنظيف الكاش القديم
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  return self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // السماح بطلبات الـ API أو الروابط الخارجية (مثل تلغرام) بالذهاب للشبكة مباشرة
  if (url.origin !== location.origin && !request.url.startsWith('https://fonts.')) {
    return;
  }

  // استراتيجية Network First لصفحات الـ HTML (لضمان تحديث البيانات)
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

  // استراتيجية Cache First للملفات الثابتة (JS, CSS, Images)
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        // التحقق من صحة الاستجابة قبل تخزينها
        if (!response || response.status !== 200 || response.type !== 'basic' && !request.url.includes('googleapis')) {
          return response;
        }

        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
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
