"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth";

export function useRequireAuth() {
  const { user, wedding, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/"); return; }
    if (!wedding) { router.push("/setup"); return; }
  }, [user, wedding, loading, router]);

  return { user, wedding, loading, signOut, ready: !loading && !!user && !!wedding };
}
