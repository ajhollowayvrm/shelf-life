"use client";

import { useEffect } from "react";
import { usePantryStore } from "@/store/usePantryStore";

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const init = usePantryStore((s) => s.init);
  const cleanup = usePantryStore((s) => s.cleanup);

  useEffect(() => {
    init();
    return () => cleanup();
  }, [init, cleanup]);

  return <>{children}</>;
}
