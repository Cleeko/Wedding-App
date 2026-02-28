"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }
      setUser(user);
      setLoading(false);
    }
    checkUser();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-3 border-warm-gray border-t-dusty-blue" />
          <p className="italic text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-normal uppercase tracking-[4px] text-text-dark">
            Thank You Tracker
          </h1>
          <p className="mt-1 text-sm italic text-text-muted">
            Welcome, {user?.email}
          </p>
        </div>

        {/* Dashboard Card */}
        <div className="rounded-sm border border-dusty-blue/15 bg-gradient-to-br from-parchment to-parchment-dark p-8 shadow-md">
          <h2 className="mb-4 text-center text-xl font-normal tracking-wider uppercase text-text-dark">
            Dashboard
          </h2>
          <p className="text-center italic text-text-muted">
            You&apos;re in! This is where your gift tracker will live.
          </p>
          <p className="mt-2 text-center text-sm text-text-muted">
            Phase 2 complete — auth is working.
          </p>
        </div>

        {/* Sign Out */}
        <div className="mt-6 text-center">
          <button
            onClick={handleSignOut}
            className="text-sm text-text-muted transition-colors hover:text-dusty-blue"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
