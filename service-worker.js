/* ============================================
DIALED DAWG - Service Worker
Offline-first caching strategy
============================================ */

const CACHE_NAME = ‘dialed-dawg-v1’;
const ASSETS = [
‘./’,
‘./index.html’,
‘./style.css’,
‘./script.js’,
‘./manifest.json’,
‘https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@300;400;500;600;700&display=swap’
];

// Install: cache all core assets
self.addEventListener(‘install’, event => {
event.waitUntil(
caches.open(CACHE_NAME).then(cache => {
return cache.addAll(ASSETS.filter(a => !a.startsWith(‘http’) || a.includes(‘googleapis’)));
})
);
self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener(‘activate’, event => {
event.waitUntil(
caches.keys().then(keys =>
Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
)
);
self.clients.claim();
});

// Fetch: cache-first for app assets, network-first for others
self.addEventListener(‘fetch’, event => {
const url = new URL(event.request.url);

// App shell — cache first
if (
url.pathname.endsWith(’.html’) ||
url.pathname.endsWith(’.css’) ||
url.pathname.endsWith(’.js’) ||
url.pathname.endsWith(’.json’) ||
url.pathname.endsWith(’.png’) ||
url.hostname.includes(‘fonts.googleapis.com’) ||
url.hostname.includes(‘fonts.gstatic.com’)
) {
event.respondWith(
caches.match(event.request).then(cached => {
return cached || fetch(event.request).then(response => {
return caches.open(CACHE_NAME).then(cache => {
cache.put(event.request, response.clone());
return response;
});
}).catch(() => cached);
})
);
} else {
// Network first, fallback to cache
event.respondWith(
fetch(event.request).catch(() => caches.match(event.request))
);
}
});