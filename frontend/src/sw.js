import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

// Precacheo de archivos estáticos (inyectado por vite-plugin-pwa)
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ─── Push notifications ───────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'Vigilancia Ciudadana', body: '' };
  try { data = event.data?.json() || data; } catch {}

  const options = {
    body:    data.body  || '',
    icon:    '/icon-192.png',
    badge:   '/icon-192.png',
    vibrate: [100, 50, 100],
    data:    { url: data.url || '/' },
    actions: [
      { action: 'open',    title: 'Ver reporte' },
      { action: 'dismiss', title: 'Cerrar'      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ─── Click en notificación ────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
