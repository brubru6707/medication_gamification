self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {}
  const title = data.title || "MedMinder";
  const body = data.body || "You have a new alert.";
  const options = { body, icon: "/icon-192.png", badge: "/badge.png", data };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const c of wins) if ("focus" in c) return c.focus();
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
