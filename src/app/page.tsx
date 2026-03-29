"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePantryStore } from "@/store/usePantryStore";

export default function Home() {
  const authState = usePantryStore((s) => s.authState);
  const router = useRouter();

  useEffect(() => {
    if (authState === "ready") {
      router.replace("/pantry");
    }
  }, [authState, router]);

  // StoreProvider handles showing login/household setup screens
  // Once ready, we redirect to /pantry
  return null;
}
