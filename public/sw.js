// Service Worker for 풍수AI PWA
const CACHE_NAME = 'pungsoo-ai-v2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/images/masters/cheongpung.jpeg',
    '/images/masters/myeongwol.jpeg',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // API Request: Network First
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    // HTML Component (Index.html / Navigation): Network First caching to prevent blank white screens (MIME errors) 
    if (event.request.mode === 'navigate' || (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'))) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache-First fallback for static assets (images, css files, hashed js chunks)
    event.respondWith(
        caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
});
