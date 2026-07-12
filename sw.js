const CACHE_NAME = 'hub-personale-v9';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icon.png',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './css/mobile.css',
  './css/apps/spesa.css',
  './css/apps/palestra.css',
  './css/apps/calendario.css',
  './css/apps/focus.css',
  './js/auth.js',
  './js/spesa.js',
  './js/palestra.js',
  './js/calendario.js',
  './js/focus.js',
  './js/meteo.js',
  './js/omnibar.js',
  './js/settings.js',
  './js/share.js',
  './js/tempo-libero.js'
];

// Installa il Service Worker e memorizza in cache gli asset principali
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Attiva e pulisci le vecchie cache
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Strategia Cache-First con fallback di rete (Consente all'app di caricarsi all'istante ed offline!)
self.addEventListener('fetch', (e) => {
  // Escludi le richieste a Supabase o meteo esterne (devono andare in rete)
  if (e.request.url.includes('supabase.co') || e.request.url.includes('open-meteo.com')) {
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Ritorna la copia in cache, ma aggiorna in background (Stale-While-Revalidate)
        fetch(e.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
          }
        }).catch(() => {/* ignora errori offline */});
        return cachedResponse;
      }
      return fetch(e.request);
    })
  );
});
