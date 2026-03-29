/* eslint-disable no-undef */
// Firebase messaging service worker — handles background push notifications.
// Firebase SDK expects this file at /firebase-messaging-sw.js
//
// Note: The Firebase config values below are placeholders. Replace them with
// your actual Firebase project values before deploying. These are safe to
// expose client-side (they are not secrets).

importScripts(
  "https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyDjIiz8Ul51IR3l85R1PV-0UML-0MrF6Ac",
  projectId: "shelf-life-86dd9",
  messagingSenderId: "790726548716",
  appId: "1:790726548716:web:e200414e93d90dd7a4d9c9",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "Shelf Life";
  const body = payload.notification?.body ?? "You have a new notification";

  self.registration.showNotification(title, {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: payload.data,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) return client.focus();
        }
        return clients.openWindow("/pantry");
      })
  );
});
