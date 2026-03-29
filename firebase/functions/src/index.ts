import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

interface PantryItemData {
  name: string;
  quantity: number;
  maxQuantity: number;
  lowStockThreshold: number;
  autoAddToShoppingList: boolean;
  expiryDate?: admin.firestore.Timestamp;
}

/**
 * Runs daily at 9:00 AM ET. For each user with notifications enabled:
 * 1. Finds pantry items below their low stock threshold
 * 2. Finds items expiring within 3 days
 * 3. Sends a summary push notification via FCM
 */
export const dailyStockCheck = onSchedule(
  {
    schedule: "every day 09:00",
    timeZone: "America/New_York",
    retryCount: 1,
  },
  async () => {
    const usersSnap = await db.collection("users").listDocuments();

    for (const userDoc of usersSnap) {
      try {
        await checkUserPantry(userDoc.id);
      } catch (err) {
        console.error(`Failed to check pantry for user ${userDoc.id}:`, err);
      }
    }
  }
);

async function checkUserPantry(userId: string) {
  // Get FCM token
  const notifDoc = await db
    .doc(`users/${userId}/settings/notifications`)
    .get();
  const fcmToken = notifDoc.data()?.fcmToken;
  if (!fcmToken) return;

  // Get pantry items
  const pantrySnap = await db
    .collection(`users/${userId}/pantryItems`)
    .get();

  const lowStockItems: string[] = [];
  const expiringItems: string[] = [];
  const expiredItems: string[] = [];
  const now = Date.now();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

  for (const doc of pantrySnap.docs) {
    const item = doc.data() as PantryItemData;

    // Check stock level
    if (item.maxQuantity > 0) {
      const pct = item.quantity / item.maxQuantity;
      const threshold = item.lowStockThreshold ?? 0.25;
      if (pct <= threshold) {
        lowStockItems.push(item.name);
      }
    }

    // Check expiry
    if (item.expiryDate) {
      const expiryMs = item.expiryDate.toMillis();
      const diff = expiryMs - now;
      if (diff < 0) {
        expiredItems.push(item.name);
      } else if (diff <= threeDaysMs) {
        expiringItems.push(item.name);
      }
    }
  }

  // Build notification
  const parts: string[] = [];
  if (lowStockItems.length > 0) {
    parts.push(
      lowStockItems.length === 1
        ? `${lowStockItems[0]} is running low`
        : `${lowStockItems.length} items running low`
    );
  }
  if (expiringItems.length > 0) {
    parts.push(
      expiringItems.length === 1
        ? `${expiringItems[0]} expires soon`
        : `${expiringItems.length} items expiring soon`
    );
  }
  if (expiredItems.length > 0) {
    parts.push(
      expiredItems.length === 1
        ? `${expiredItems[0]} is expired`
        : `${expiredItems.length} items expired`
    );
  }

  if (parts.length === 0) return;

  const body = parts.join(" · ");

  try {
    await messaging.send({
      token: fcmToken,
      notification: {
        title: "Shelf Life",
        body,
      },
      webpush: {
        fcmOptions: {
          link: "/pantry",
        },
      },
    });
  } catch (err: unknown) {
    // If token is invalid, clean it up
    const error = err as { code?: string };
    if (
      error.code === "messaging/invalid-registration-token" ||
      error.code === "messaging/registration-token-not-registered"
    ) {
      await db.doc(`users/${userId}/settings/notifications`).delete();
    }
    console.error(`FCM send failed for user ${userId}:`, err);
  }
}
