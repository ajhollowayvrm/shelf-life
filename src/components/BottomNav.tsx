"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePantryStore } from "@/store/usePantryStore";

const tabs = [
  { href: "/pantry", label: "Pantry", icon: "🏠" },
  { href: "/scan", label: "Scan", icon: "📷" },
  { href: "/shopping", label: "Shopping", icon: "🛒" },
  { href: "/recipes", label: "Recipes", icon: "📖" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const shoppingList = usePantryStore((s) => s.shoppingList);
  const autoCount = shoppingList.filter(
    (i) => i.source === "auto" && !i.checked
  ).length;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-bg border-t border-border">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full relative transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="text-xl leading-none relative">
                {tab.icon}
                {tab.href === "/shopping" && autoCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-stock-low text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {autoCount}
                  </span>
                )}
              </span>
              <span className="text-[11px] font-medium leading-none">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
      {/* Safe area padding for phones with home indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
