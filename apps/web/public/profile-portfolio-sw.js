const CACHE_NAME = 'wejammin-public-profile-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

const offlineDocument = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch: false });
  if (cached === undefined) return Response.error();
  const source = await cached.text();
  const degraded = source
    .replace('data-state="success"', 'data-state="degraded"')
    .replace(
      '<a class="profile-portfolio-skip-link" href="#profile-portfolio">',
      '<p data-last-verified>Offline. Last verified profile data is shown.</p><a class="profile-portfolio-skip-link" href="#profile-portfolio">',
    );
  const headers = new Headers(cached.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'no-store');
  return new Response(degraded, {
    status: 200,
    headers,
  });
};

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.mode !== 'navigate' || !url.pathname.startsWith('/profiles/'))
    return;
  event.respondWith(fetch(request).catch(() => offlineDocument(request)));
});
