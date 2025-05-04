const CACHE_NAME = "app-cache-v1";
const urlsToCache = [ "/", "/index.html", "/manifest.json" ];

self.addEventListener('install', event => {
  // Pré-cache des fichiers critiques
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  // Activation immédiate du nouveau service worker
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // Nettoyage des anciens caches si nécessaire
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Stratégie réseau d'abord pour les navigations, cache d'abord pour autres requêtes
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(response => {
          // Mise en cache des nouvelles ressources récupérées
          if (response && response.status === 200 && event.request.method === "GET") {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        }).catch(() => caches.match(event.request));
      })
    );
  }
});
