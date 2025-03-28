const CACHE_NAME = 'travel-planner-pro-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js', // Cache lo script principale
    '/icons/icon-192.png', // Cache icone
    '/icons/icon-512.png',
    '/icons/maskable-icon-512.png'
    // Aggiungi qui altri file statici se necessario
];

// Installazione: Caching delle risorse statiche
self.addEventListener('install', event => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('[SW] Install failed:', err))
  );
});

// Attivazione: Pulizia vecchie cache
self.addEventListener('activate', event => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategia Cache First per le richieste GET
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return; // Ignora richieste non GET

  // Risorse locali (quelle in urlsToCache) - Cache first
  if (urlsToCache.some(url => event.request.url.endsWith(url) || new URL(event.request.url).pathname === '/')) {
      event.respondWith(
          caches.match(event.request)
              .then(cachedResponse => {
                  if (cachedResponse) {
                      // console.log('[SW] Found in cache:', event.request.url);
                      return cachedResponse;
                  }
                  // console.log('[SW] Not in cache, fetching:', event.request.url);
                  return fetch(event.request).then(networkResponse => {
                       // Opzionale: Clona e metti in cache la nuova risposta per futuri accessi offline
                       // let responseToCache = networkResponse.clone();
                       // caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
                       return networkResponse;
                  }).catch(err => {
                      console.warn('[SW] Fetch failed (offline?):', event.request.url, err);
                      // Potresti restituire una risorsa offline generica qui
                  });
              })
      );
  } else {
      // Per altre richieste (es. CDN, API), prova prima la rete, poi fallback alla cache (Network first, then cache)
      // Questo è utile per librerie CDN, ma potresti volerle includere in urlsToCache se vuoi che siano disponibili offline al 100%
      event.respondWith(
          fetch(event.request)
              .catch(() => {
                  // Se la rete fallisce, prova la cache
                  console.log('[SW] Network failed, trying cache for:', event.request.url);
                  return caches.match(event.request);
              })
      );
  }
});
