"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
  const [partner1, setPartner1] = useState("");
  const [partner2, setPartner2] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }

      // If they already have a wedding, skip to dashboard
      const { data } = await supabase
        .from("weddings")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (data) { router.push("/dashboard"); return; }
      setChecking(false);
    }
    check();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("weddings").insert({
      user_id: user.id,
      partner1_name: partner1.trim(),
      partner2_name: partner2.trim(),
      wedding_date: weddingDate || null,
    });

    if (error) {
      alert("Something went wrong: " + error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-warm-gray border-t-dusty-blue" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-normal uppercase tracking-[6px] text-text-dark">
            Welcome!
          </h1>
          <p className="mt-2 text-lg italic text-text-muted tracking-wider">
            Let&apos;s set up your wedding
          </p>
        </div>

        <div className="rounded-sm border border-dusty-blue/15 bg-gradient-to-br from-parchment to-parchment-dark p-8 shadow-md">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[1.5px] text-text-muted">
                Partner 1
              </label>
              <input
                type="text"
                value={partner1}
                onChange={(e) => setPartner1(e.target.value)}
                required
                className="w-full rounded-sm border border-warm-gray bg-parchment-dark px-4 py-3 text-base text-text-dark transition-colors focus:border-dusty-blue focus:outline-none"
                placeholder="First name"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs uppercase tracking-[1.5px] text-text-muted">
                Partner 2
              </label>
              <input
                type="text"
                value={partner2}
                onChange={(e) => setPartner2(e.target.value)}
                required
                className="w-full rounded-sm border border-warm-gray bg-parchment-dark px-4 py-3 text-base text-text-dark transition-colors focus:border-dusty-blue focus:outline-none"
                placeholder="First name"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs uppercase tracking-[1.5px] text-text-muted">
                Wedding Date (optional)
              </label>
              <input
                type="date"
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
                className="w-full rounded-sm border border-warm-gray bg-parchment-dark px-4 py-3 text-base text-text-dark transition-colors focus:border-dusty-blue focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-sm bg-dusty-blue px-6 py-3 text-sm uppercase tracking-[2px] text-parchment transition-all hover:bg-dusty-blue-hover hover:-translate-y-px hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Setting up..." : "Get Started"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
