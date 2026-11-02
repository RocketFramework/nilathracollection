// Minimal service worker: network-first, offline fallback to cache for the task page.
const CACHE = 'tasks-v1';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.includes('/admin/m-tasks')) return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request)));
});
self.addEventListener('push', e => {
  const d = e.data ? e.data.json() : { title: 'New task', body: '' };
  e.waitUntil(self.registration.showNotification(d.title, { body: d.body, icon: '/pwa-icon.png', data: { url: d.url || '/admin/m-tasks' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.openWindow(e.notification.data.url));
});
