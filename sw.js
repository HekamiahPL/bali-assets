const CACHE = 'bali-2026-shell-v5';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './logo-180.png',
  './logo.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if(url.origin !== self.location.origin) return;

  // Nawigacja: świeża wersja, a przy braku internetu cached app shell.
  if(request.mode === 'navigate'){
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put('./index.html', copy));
          return response;
        })
        .catch(() =>
          caches.match('./index.html').then(cached => cached || caches.match('./'))
        )
    );
    return;
  }

  // Assety: szybki cache z odświeżeniem w tle.
  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});
