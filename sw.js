const CACHE_VERSION = 'shinyden-v6';
const CACHE_NAME = CACHE_VERSION;
const STATIC_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/banner.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_CACHE))
  );
  // Force immediate activation - don't wait for old SW to die
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  // Take control of all clients immediately
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Network-first for HTML (always get latest)
  if (event.request.url.endsWith('.html') || event.request.url.endsWith('/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  // Network-first for JSON data files (deals.json, ebay_deals.json)
  if (event.request.url.includes('.json')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  // Cache-first for everything else (images, fonts)
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
