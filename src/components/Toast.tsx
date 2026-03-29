"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  onDismiss: () => void;
  duration?: number;
}

export default function Toast({
  message,
  onDismiss,
  duration = 2500,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  return (
    <div className="fixed top-6 left-1/2 z-[60] max-w-[440px] w-[calc(100%-32px)] animate-toast">
      <div className="bg-primary text-white text-sm font-medium px-4 py-3 rounded-[var(--radius-md)] shadow-[var(--shadow-toast)] text-center">
        {message}
      </div>
    </div>
  );
}
