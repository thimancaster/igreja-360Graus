// Service Worker for Push Notifications
self.addEventListener("push", (event) => {
  let data = { title: "Igreja360", body: "Nova notificação", type: "info" };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error("Error parsing push data:", e);
  }

  const isUrgent = data.type === "urgent";

  const options = {
    body: data.body,
    icon: "/pwa-icons/icon-192x192.png",
    badge: "/pwa-icons/icon-96x96.png",
    tag: isUrgent ? "urgent-" + Date.now() : "notification",
    renotify: true,
    requireInteraction: isUrgent,
    vibrate: isUrgent
      ? [500, 200, 500, 200, 500, 200, 500, 200, 500]
      : [200, 100, 200],
    data: {
      url: data.url || "/portal",
      type: data.type,
    },
    actions: isUrgent
      ? [{ action: "acknowledge", title: "🏃 Estou a caminho!" }]
      : [],
    urgency: isUrgent ? "high" : "normal",
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/portal";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes("/portal") && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
