const CACHE_NAME = 'mizaniq-v2';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '[https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap](https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap)',
    '[https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css](https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css)'
];

// Install - حفظ الملفات الأساسية
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            // استخدمنا map لتجنب توقف الكاش بالكامل إذا فشل ملف واحد
            return Promise.allSettled(
                ASSETS.map(url => cache.add(url).catch(err => console.log('Failed to cache:', url, err)))
            );
        })
    );
    self.skipWaiting();
});

// Activate - تنظيف الكاش القديم
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', e => {
    const { request } = e;
    const url = new URL(request.url);

    // السماح بالطلبات الخارجية (مثل تليجرام) دون التدخل فيها
    if (url.origin !== location.origin && !ASSETS.includes(request.url)) {
        return;
    }

    // استراتيجية Network First للصفحات (Navigate)
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
                .catch(() => caches.match('/index.html'))
        );
        return;
    }

    // استراتيجية Cache First للملفات الثابتة
    e.respondWith(
        caches.match(request).then(cached => {
            if (cached) return cached;

            return fetch(request).then(response => {
                if (!response || response.status !== 200) return response;

                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                return response;
            }).catch(() => {
                if (request.destination === 'image') {
                    return new Response(
                        '<svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" viewBox="0 0 200 200"><rect fill="#162338" width="200" height="200"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#7A8A9F" font-size="14" font-family="Arial">Offline</text></svg>',
                        { headers: { 'Content-Type': 'image/svg+xml' } }
                    );
                }
            });
        })
    );
});
