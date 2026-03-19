/* ═══════════════════════════════════════════════════════════════
   ChartReimaginer Service Worker v1
   Strategies:
     - Local assets:  cache-first (precached on install)
     - Firebase APIs: pass-through (Firestore handles its own cache)
     - CDN scripts:   cache-first with lazy caching
     - Navigation:    network-first → cached index.html fallback
═══════════════════════════════════════════════════════════════ */

const CACHE_NAME  = 'chart-reimaginer-v1';

const LOCAL_ASSETS = [
  '/chart-reimaginer/',
  '/chart-reimaginer/index.html',
  '/chart-reimaginer/manifest.json',
  '/chart-reimaginer/icons/icon-192.png',
  '/chart-reimaginer/icons/icon-512.png',
];

/* ── Install ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // Local assets must all succeed
      await cache.addAll(LOCAL_ASSETS);
      // External CDN assets — cache individually, failures are non-fatal
      const external = [
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700;800&display=swap',
        'https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js',
        'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
        'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js',
        'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js',
      ];
      for (const url of external) {
        try { await cache.add(url); } catch { /* non-fatal */ }
      }
      self.skipWaiting();
    })
  );
});

/* ── Activate: clean old caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch ── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // ── Firebase APIs: don't intercept — let Firestore's IndexedDB handle offline
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('firebase.googleapis.com') ||
    url.hostname.includes('firebaseio.com')
  ) return;

  // ── Navigation requests: network-first, fall back to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/chart-reimaginer/index.html')
      )
    );
    return;
  }

  // ── Google Fonts CSS + files: cache-first
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetchAndCache(request))
    );
    return;
  }

  // ── CDN scripts (Chart.js, Firebase SDK): cache-first
  if (
    url.hostname.includes('cdn.jsdelivr.net') ||
    url.hostname.includes('gstatic.com')
  ) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetchAndCache(request))
    );
    return;
  }

  // ── Static local assets: cache-first
  if (/\.(html|js|css|json|png|jpg|jpeg|svg|webp|gif|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetchAndCache(request))
    );
    return;
  }

  // ── Everything else: network-first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

async function fetchAndCache(request) {
  const response = await fetch(request);
  if (response && response.status === 200) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}
