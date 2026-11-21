const CACHE_VERSION = 'pdf-edu-studio-v1.3.0';

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/pwa-192x192.png',
  '/icons/pwa-512x512.png',
  '/icons/pwa-maskable-512x512.png',
  '/icons/apple-touch-icon.png',
  '/fonts/DejaVuSans.ttf',
  '/fonts/DejaVuSans-Bold.ttf',
  '/fonts/DejaVuSerif.ttf',
  '/fonts/DejaVuSerif-Bold.ttf',
  '/workers/pdf.worker.min.mjs',
  '/mathlive/fonts/KaTeX_Main-Regular.woff2',
  '/mathlive/fonts/KaTeX_Main-Bold.woff2',
  '/mathlive/fonts/KaTeX_Math-Italic.woff2',
  '/mathlive/fonts/KaTeX_AMS-Regular.woff2',
  '/mathlive/fonts/KaTeX_Size1-Regular.woff2',
  '/mathlive/fonts/KaTeX_Size2-Regular.woff2',
];

/**
 * Validates that a network response is genuinely cacheable and has a matching Content-Type.
 * Prevents caching Vercel error pages, SPA HTML fallbacks for JSON/JS/font requests,
 * or private user PDF/project documents into shared Cache Storage.
 */
function isSafeToCache(url, response, isNavigate) {
  if (!response || !response.ok || response.status !== 200) return false;
  if (response.headers.get('x-vercel-error')) return false;

  const pathname = url.pathname.toLowerCase();
  const ct = (response.headers.get('content-type') || '').toLowerCase();

  // Never cache private user PDFs or exported project archives in shared SW cache
  if (
    pathname.endsWith('.pdf') ||
    pathname.endsWith('.pdfedu') ||
    ct.includes('application/pdf') ||
    ct.includes('application/zip')
  ) {
    return false;
  }

  if (isNavigate) {
    return ct.includes('text/html');
  }

  // Never cache HTML responses masquerading as manifest/JSON
  if (pathname.endsWith('.webmanifest') || pathname.endsWith('.json')) {
    return (ct.includes('json') || ct.includes('manifest')) && !ct.includes('text/html');
  }

  // Never cache HTML responses masquerading as JavaScript/Worker modules
  if (pathname.endsWith('.js') || pathname.endsWith('.mjs')) {
    return ct.includes('javascript') && !ct.includes('text/html');
  }

  // Never cache HTML responses masquerading as CSS
  if (pathname.endsWith('.css')) {
    return ct.includes('text/css') && !ct.includes('text/html');
  }

  // Fonts & WASM
  if (
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.ttf') ||
    pathname.endsWith('.otf') ||
    pathname.endsWith('.wasm')
  ) {
    return !ct.includes('text/html');
  }

  // Images / Icons
  if (
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg')
  ) {
    return ct.includes('image/') && !ct.includes('text/html');
  }

  return !ct.includes('text/html');
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      await Promise.allSettled(
        SHELL_ASSETS.map(async (assetPath) => {
          try {
            const reqUrl = new URL(assetPath, self.location.origin);
            const resp = await fetch(assetPath, { cache: 'no-cache' });
            const isNav = assetPath === '/' || assetPath === '/index.html';
            if (isSafeToCache(reqUrl, resp, isNav)) {
              await cache.put(assetPath, resp);
            }
          } catch {
            // Skip individual missing assets during dev mode
          }
        })
      );
      await self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  // Only delete outdated static asset caches; NEVER touch IndexedDB or user data
  event.waitUntil(
    caches.keys().then(async (keys) => {
      await Promise.all(
        keys
          .filter((key) => key.startsWith('pdf-edu-studio-') && key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })
  );
});

self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data.type === 'CACHE_URLS' && Array.isArray(event.data.urls)) {
    event.waitUntil(
      caches.open(CACHE_VERSION).then(async (cache) => {
        let cachedCount = 0;
        for (const rawUrl of event.data.urls) {
          try {
            const parsed = new URL(rawUrl, self.location.origin);
            if (parsed.origin !== self.location.origin) continue;
            const resp = await fetch(rawUrl);
            const isNav = parsed.pathname === '/' || parsed.pathname === '/index.html';
            if (isSafeToCache(parsed, resp, isNav)) {
              await cache.put(rawUrl, resp);
              cachedCount++;
            }
          } catch {
            // Ignore failed offline prefetch
          }
        }
        const clients = await self.clients.matchAll();
        clients.forEach((c) =>
          c.postMessage({ type: 'CACHE_COMPLETE', cachedCount, version: CACHE_VERSION })
        );
      })
    );
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Never cache or intercept private PDF files / project packages
  const lowerPath = url.pathname.toLowerCase();
  if (lowerPath.endsWith('.pdf') || lowerPath.endsWith('.pdfedu')) {
    return;
  }

  // Never intercept Vite dev module endpoints, react-refresh, or ?import worker URLs
  if (
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.startsWith('/@fs/') ||
    url.pathname.startsWith('/src/') ||
    url.searchParams.has('import') ||
    url.searchParams.has('v')
  ) {
    return;
  }

  // 1. Navigation requests: network-first, cache only valid 200 text/html, offline fallback to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (isSafeToCache(url, response, true)) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put('/index.html', clone));
          }
          return response;
        })
        .catch(async () => {
          return (
            (await caches.match(request)) ||
            (await caches.match('/index.html')) ||
            (await caches.match('/'))
          );
        })
    );
    return;
  }

  // 2. Web App Manifest & JSON files: network-first, strictly validate JSON MIME, NEVER fallback to HTML
  if (
    url.origin === self.location.origin &&
    (lowerPath.endsWith('.webmanifest') || lowerPath.endsWith('.json'))
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (isSafeToCache(url, response, false)) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || new Response('', { status: 503, statusText: 'Offline' });
        })
    );
    return;
  }

  // 3. Same-origin static assets (hashed /assets/*, /workers/*, /fonts/*, /mathlive/*, /icons/*):
  // Cache-first with safe background revalidation for non-hashed paths
  if (url.origin === self.location.origin) {
    const isImmutableStatic =
      url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/fonts/') ||
      url.pathname.startsWith('/mathlive/fonts/') ||
      url.pathname.startsWith('/workers/') ||
      url.pathname.startsWith('/icons/');

    if (isImmutableStatic) {
      event.respondWith(
        caches.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.type === 'basic' && isSafeToCache(url, response, false)) {
              const clone = response.clone();
              caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
            }
            return response;
          });
        })
      );
      return;
    }

    // Other same-origin static files: network-first with cache fallback
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.type === 'basic' && isSafeToCache(url, response, false)) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || new Response('', { status: 503, statusText: 'Offline' });
        })
    );
    return;
  }

  // 4. External fonts & OCR traineddata packs: cache-first when downloaded (never cache error pages)
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('tessdata') ||
    url.hostname.includes('jsdelivr')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const ct = (response.headers.get('content-type') || '').toLowerCase();
          if (response && response.ok && response.status === 200 && !ct.includes('text/html')) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
  }
});
