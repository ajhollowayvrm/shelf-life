"use client";

import { useEffect, useRef, useCallback } from "react";

export function useFocusTrap(onEscape?: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Save the previously focused element and focus the container
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus the first focusable element in the container
    const container = containerRef.current;
    if (!container) return;

    const focusable = getFocusableElements(container);
    if (focusable.length > 0) {
      (focusable[0] as HTMLElement).focus();
    }

    return () => {
      // Return focus to the previously focused element
      previousFocusRef.current?.focus();
    };
  }, []);

  // Trap focus and handle Escape
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onEscape?.();
        return;
      }

      if (e.key !== "Tab") return;

      const container = containerRef.current;
      if (!container) return;

      const focusable = getFocusableElements(container);
      if (focusable.length === 0) return;

      const first = focusable[0] as HTMLElement;
      const last = focusable[focusable.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onEscape]
  );

  return { containerRef, handleKeyDown };
}

function getFocusableElements(container: HTMLElement): NodeListOf<Element> {
  return container.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
}
