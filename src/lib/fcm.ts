"use client";

import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { getDb, getFirebaseApp } from "./firebase";

let _messaging: Messaging | null = null;

function getMessagingInstance(): Messaging | null {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window)) return null;
  if (!_messaging) {
    try {
      _messaging = getMessaging(getFirebaseApp());
    } catch {
      return null;
    }
  }
  return _messaging;
}

export async function requestNotificationPermission(
  userId: string
): Promise<boolean> {
  const messaging = getMessagingInstance();
  if (!messaging) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  try {
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn("FCM VAPID key not configured");
      return false;
    }

    const token = await getToken(messaging, { vapidKey });
    if (token) {
      await saveFcmToken(userId, token);
      return true;
    }
  } catch (err) {
    console.error("Failed to get FCM token:", err);
  }

  return false;
}

async function saveFcmToken(userId: string, token: string) {
  const ref = doc(getDb(), "users", userId, "settings", "notifications");
  await setDoc(ref, { fcmToken: token, updatedAt: new Date() }, { merge: true });
}

export function onForegroundMessage(callback: (title: string, body: string) => void) {
  const messaging = getMessagingInstance();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? "Shelf Life";
    const body = payload.notification?.body ?? "";
    callback(title, body);
  });
}

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

export function getNotificationPermissionState(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}
