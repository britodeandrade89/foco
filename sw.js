// Service Worker FOCO App - v10
const CACHE_NAME = 'foco-cache-v10';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn-icons-png.flaticon.com/512/3593/3593505.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Fallback silencioso se offline
        });

        return cachedResponse || fetchPromise;
      });
    })
  );
});

// Evento de Push (Mesmo com app fechado)
self.addEventListener('push', (event) => {
  let data = { title: 'FOCO', body: 'Você tem tarefas pendentes, André!' };
  
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
    vibrate: [200, 100, 200],
    data: { url: '/' },
    actions: [
      { action: 'view', title: 'Abrir App' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clique na Notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focar se já estiver aberto
      for (let client of windowClients) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      // Abrir se estiver fechado
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});