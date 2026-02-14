// Service Worker for SkillSwap KNUST Push Notifications

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || "SkillSwap KNUST";
  const options = {
    body: data.body || "You have a new notification",
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: data.tag || "default",
    data: { url: data.url || "/messages" },
    vibrate: [200, 100, 200],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/messages";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
