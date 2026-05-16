// ShinyDen Service Worker — auto-updates on each deploy
// Version controlled by BUILD_HASH in index.html

const CACHE_VERSION = 'shinyden-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/banner.png',
];

// Install — cache static assets
self.addEventListener('install', event => {
  // Skip waiting immediately — don't wait for old tabs to close
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
});

// Activate — delete all old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Take control of all clients immediately
      self.clients.claim(),
      // Delete old cache versions
      caches.keys().then(keys =>
        Promise.all(keys
          .filter(k => k !== CACHE_VERSION)
          .map(k => caches.delete(k))
        )
      ),
    ])
  );
});

// Fetch — network first, cache fallback
// This means users ALWAYS get fresh content when online
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API calls and GitHub raw data — always network, never cache
  if (
    url.hostname.includes('raw.githubusercontent.com') ||
    url.hostname.includes('api.github.com') ||
    url.hostname.includes('api.ebay.com') ||
    url.hostname.includes('svcs.ebay.com') ||
    url.hostname.includes('pokedata.io') ||
    url.pathname.includes('deals.json') ||
    url.pathname.includes('ebay_deals.json')
  ) {
    event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // For the main app files: network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Listen for SKIP_WAITING message from the page
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
