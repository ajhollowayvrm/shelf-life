"use client";

import { useEffect } from "react";
import { usePantryStore } from "@/store/usePantryStore";
import LoginScreen from "./LoginScreen";
import HouseholdSetup from "./HouseholdSetup";
import BottomNav from "./BottomNav";
import OfflineIndicator from "./OfflineIndicator";
import InstallPrompt from "./InstallPrompt";

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const init = usePantryStore((s) => s.init);
  const cleanup = usePantryStore((s) => s.cleanup);
  const authState = usePantryStore((s) => s.authState);

  useEffect(() => {
    init();
    return () => cleanup();
  }, [init, cleanup]);

  if (authState === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (authState === "signed-out") {
    return <LoginScreen />;
  }

  if (authState === "no-household") {
    return <HouseholdSetup />;
  }

  return (
    <>
      <OfflineIndicator />
      <InstallPrompt />
      {children}
      <BottomNav />
    </>
  );
}
