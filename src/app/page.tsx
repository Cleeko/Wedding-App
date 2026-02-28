"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email for a confirmation link!");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.push("/dashboard");
      }
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-normal uppercase tracking-[6px] text-text-dark">
            Thank You Tracker
          </h1>
          <p className="mt-2 text-lg italic text-text-muted tracking-wider">
            Wedding Gift Management
          </p>
        </div>

        {/* Card */}
        <div className="rounded-sm border border-dusty-blue/15 bg-gradient-to-br from-parchment to-parchment-dark p-8 shadow-md">
          <h2 className="mb-6 text-center text-xl font-normal tracking-wider uppercase text-text-dark">
            {isSignUp ? "Create Account" : "Sign In"}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[1.5px] text-text-muted">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-sm border border-warm-gray bg-parchment-dark px-4 py-3 text-base text-text-dark transition-colors focus:border-dusty-blue focus:outline-none"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs uppercase tracking-[1.5px] text-text-muted">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-sm border border-warm-gray bg-parchment-dark px-4 py-3 text-base text-text-dark transition-colors focus:border-dusty-blue focus:outline-none"
                placeholder="At least 6 characters"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
            {message && (
              <p className="text-sm text-sage text-center">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-sm bg-dusty-blue px-6 py-3 text-sm uppercase tracking-[2px] text-parchment transition-all hover:bg-dusty-blue-hover hover:-translate-y-px hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading
                ? "Please wait..."
                : isSignUp
                ? "Create Account"
                : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setMessage("");
              }}
              className="text-sm text-text-muted transition-colors hover:text-dusty-blue"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Need an account? Create one"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
