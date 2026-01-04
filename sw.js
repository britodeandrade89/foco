// Service Worker FOCO App 2026
const CACHE_NAME = 'foco-andre-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn-icons-png.flaticon.com/512/3593/3593505.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME)
                  .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Simple pass-through or cache strategy
  if (event.request.url.includes('googleapis.com')) return;
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'FOCO: André!', body: 'Vá trabalhar agora!' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'FOCO', body: event.data.text() };
    }
  }
  const options = {
    body: data.body,
    icon: 'https://cdn-icons-png.flaticon.com/512/3593/3593505.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/3593/3593505.png',
    vibrate: [200, 100, 200]
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});