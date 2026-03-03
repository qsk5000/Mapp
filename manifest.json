const CACHE_NAME = ‘mizaniq-v2’;
const ASSETS = [
‘/’,
‘/index.html’,
‘/manifest.json’,
‘https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap’,
‘https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css’
];

// Install
self.addEventListener(‘install’, e => {
e.waitUntil(
caches.open(CACHE_NAME).then(cache => {
cache.addAll(ASSETS).catch(err => console.log(‘Some assets failed to cache:’, err));
})
);
self.skipWaiting();
});

// Activate - نضيف old caches
self.addEventListener(‘activate’, e => {
e.waitUntil(
caches.keys().then(keys =>
Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
)
);
self.clients.claim();
});

// Fetch event - Network first للصفحات، Cache first للملفات الثابتة
self.addEventListener(‘fetch’, e => {
const { request } = e;
const url = new URL(request.url);

// اترك الطلبات لـ domains مختلفة (Telegram, خارجي, إلخ)
if (url.origin !== location.origin) {
return;
}

// للصفحات HTML - جرب الشبكة أولاً
if (request.mode === ‘navigate’ || request.destination === ‘document’) {
e.respondWith(
fetch(request)
.then(response => {
// احفظ نسخة جديدة في الـ cache
if (response && response.status === 200) {
const clone = response.clone();
caches.open(CACHE_NAME).then(cache => {
cache.put(request, clone);
});
}
return response;
})
.catch(() => {
// إذا الشبكة فشلت، جرب الـ cache
return caches.match(request).then(cached => {
return cached || caches.match(’/index.html’);
});
})
);
return;
}

// للملفات الثابتة (JS, CSS, images, fonts) - Cache first
e.respondWith(
caches.match(request).then(cached => {
if (cached) return cached;

```
  return fetch(request).then(response => {
    if (!response || response.status !== 200) {
      return response;
    }
    
    const clone = response.clone();
    caches.open(CACHE_NAME).then(cache => {
      cache.put(request, clone);
    });
    return response;
  }).catch(() => {
    // Fallback للصور إذا ما تحملت
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect fill="#162338" width="200" height="200"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#7A8A9F" font-size="14" font-family="Arial">Offline</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    return caches.match('/index.html');
  });
})
```

);
});
