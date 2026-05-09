// @ts-nocheck
self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      
      const title = data.title || 'StockFlow Alert';
      const options = {
        body: data.message || 'You have a new notification.',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        data: {
          url: data.url || '/'
        },
        vibrate: [200, 100, 200]
      };

      event.waitUntil(
        self.registration.showNotification(title, options)
      );
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
