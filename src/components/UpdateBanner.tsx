"use client";

import { useState, useEffect } from "react";

export default function UpdateBanner() {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // When a new service worker takes control, show the banner
    const onControllerChange = () => setShowUpdate(true);
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange
    );

    // Also check if there's a waiting worker already
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.waiting) {
        setShowUpdate(true);
      }

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            setShowUpdate(true);
          }
        });
      });
    });

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange
      );
    };
  }, []);

  if (!showUpdate) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] max-w-[440px] w-[calc(100%-32px)] animate-toast">
      <button
        onClick={() => window.location.reload()}
        className="w-full bg-accent text-white text-sm font-medium px-4 py-3 rounded-[var(--radius-md)] shadow-[var(--shadow-toast)] text-center active:scale-[0.98] transition-transform"
      >
        New version available — tap to update
      </button>
    </div>
  );
}
