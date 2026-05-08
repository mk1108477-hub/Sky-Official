self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Sky Official";
  const options = {
    body: data.body || "You have a new notification.",
    icon: "/logo.jpg",
    badge: "/logo.jpg",
    tag: data.tag || "sky-official",
    data: data.url || "/",
    vibrate: [200, 100, 200],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const url = event.notification.data || "/";
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
