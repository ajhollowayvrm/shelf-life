"use client";

import { useState, useEffect } from "react";
import { usePantryStore } from "@/store/usePantryStore";
import {
  isNotificationSupported,
  getNotificationPermissionState,
  requestNotificationPermission,
} from "@/lib/fcm";

export default function NotificationBanner() {
  const user = usePantryStore((s) => s.user);
  const userId = user?.uid;
  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    // Only show if notifications are supported and permission hasn't been decided
    if (!isNotificationSupported()) return;
    const state = getNotificationPermissionState();
    if (state === "default") {
      // Small delay so it doesn't appear instantly on first load
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible || !userId) return null;

  const handleEnable = async () => {
    setRequesting(true);
    await requestNotificationPermission(userId);
    setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
  };

  return (
    <div className="mx-4 mb-3 animate-fade-in">
      <div className="bg-accent/10 border border-accent/20 rounded-[var(--radius-lg)] p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">🔔</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary">
              Stay on top of your pantry
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              Get notified when items are running low or about to expire.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleEnable}
                disabled={requesting}
                className="h-8 px-4 bg-accent text-white text-xs font-semibold rounded-[var(--radius-md)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {requesting ? "Enabling..." : "Enable"}
              </button>
              <button
                onClick={handleDismiss}
                className="h-8 px-4 text-xs font-medium text-text-tertiary hover:text-text-secondary transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
