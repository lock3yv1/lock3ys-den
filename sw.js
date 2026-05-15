const CACHE = "shinyden-v1";
const ASSETS = ["/lock3ys-den/", "/lock3ys-den/index.html", "/lock3ys-den/banner.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(clients.claim());
});

self.addEventListener("fetch", e => {
  // Network first for deals.json, cache first for assets
  if (e.request.url.includes("deals.json")) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});

self.addEventListener("push", e => {
  let data = {};
  try { data = e.data.json(); } catch {}
  e.waitUntil(self.registration.showNotification(data.title || "Shiny Den", {
    body: data.body || "New deal found",
    icon: "/lock3ys-den/icon-192.png",
    badge: "/lock3ys-den/icon-192.png",
    tag: data.tag || "deal",
    data: { url: data.url || "/lock3ys-den/" },
    requireInteraction: true,
    vibrate: [200, 100, 200],
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data?.url || "/lock3ys-den/"));
});
