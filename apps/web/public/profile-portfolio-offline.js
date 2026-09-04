const CACHE_NAME = 'wejammin-public-profile-v1';

const waitForController = () =>
  navigator.serviceWorker.controller !== null
    ? Promise.resolve()
    : new Promise((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', resolve, {
          once: true,
        });
      });

if ('serviceWorker' in navigator && typeof caches !== 'undefined') {
  void (async () => {
    await navigator.serviceWorker.register('/profile-portfolio-sw.js', {
      scope: '/profiles/',
    });
    await navigator.serviceWorker.ready;
    await waitForController();
    const response = await fetch(window.location.href, {
      credentials: 'omit',
      headers: { Accept: 'text/html' },
    });
    if (!response.ok) return;
    const cache = await caches.open(CACHE_NAME);
    await cache.put(window.location.href, response);
    document.body.dataset.offlineReady = 'true';
  })();
} else {
  document.body.dataset.offlineReady = 'true';
}
