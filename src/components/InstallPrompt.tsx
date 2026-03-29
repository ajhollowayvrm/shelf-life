"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    if (sessionStorage.getItem("install-dismissed")) {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("install-dismissed", "1");
  };

  return (
    <div className="mx-4 mb-3 animate-fade-in">
      <div className="bg-primary/5 border border-primary/10 rounded-[var(--radius-lg)] p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">📲</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary">
              Install Shelf Life
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              Add to your home screen for quick access and notifications.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="h-8 px-4 bg-primary text-white text-xs font-semibold rounded-[var(--radius-md)] hover:bg-primary-light active:scale-[0.98] transition-all"
              >
                Add to Home Screen
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
