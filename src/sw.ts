/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare let self: ServiceWorkerGlobalScope;

// Force the service worker to activate immediately and take control of all clients
self.skipWaiting();
clientsClaim();

// Precache resources
precacheAndRoute(self.__WB_MANIFEST || []);

// Handle incoming push events
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'Alerta Criminal';
    const options: NotificationOptions = {
      body: data.body || 'Nova notificação de segurança',
      icon: '/pwa-192x192.png',
      badge: '/favicon-32x32.png',
      vibrate: [200, 100, 200, 100, 200], // SOS pattern
      data: {
        url: data.url || '/',
      },
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: 'Ver Detalhes',
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error('Error parsing push event data:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open with this URL
      for (const client of clientList) {
        if (client.url === new URL(urlToOpen, self.location.origin).href && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
