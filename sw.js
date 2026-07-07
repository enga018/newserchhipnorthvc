// Cache name auto-derived from app version passed via SW registration URL (sw.js?v=x.y.z)
const params = new URLSearchParams(self.location.search);
const appVersion = params.get('v') || 'unknown';
const CACHE_NAME = 'nsn-vc-survey-' + appVersion;
const urlsToCache = [
  './app/',
  './app/index.html',
  './manifest.json',
  './icons/icon-96.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  // Self-hosted vendor libraries (same origin as the app) — precached so the app loads
  // reliably on weak connections and works fully offline after the first visit.
  './vendor/firebase-app-compat.js',
  './vendor/firebase-auth-compat.js',
  './vendor/firebase-firestore-compat.js',
  './vendor/firebase-storage-compat.js',
  './vendor/jszip.min.js',
  './vendor/leaflet.min.css',
  './vendor/leaflet.min.js',
  './vendor/leaflet-heat.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    // Cache resources individually rather than cache.addAll(), which rejects the whole
    // install (breaking ALL offline caching) if any single URL fails to fetch. A missing
    // optional asset should never prevent the rest of the app shell from being cached.
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(urlsToCache.map(url =>
        cache.add(url).catch(err => console.warn('SW: failed to cache', url, err))
      ))
    )
  );
});

self.addEventListener('fetch', event => {
  // Self-hosted vendor libraries are versioned and immutable — serve them cache-first so a
  // slow/flaky connection never stalls the app waiting on them (they load instantly, offline
  // or online). Everything else stays network-first so app/HTML updates are picked up.
  if (event.request.url.includes('/vendor/')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }
  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
