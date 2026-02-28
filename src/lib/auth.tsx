"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";
import type { Wedding } from "./types";

interface AuthContextValue {
  user: User | null;
  wedding: Wedding | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refetchWedding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  wedding: null,
  loading: true,
  signOut: async () => {},
  refetchWedding: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWedding = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("weddings")
      .select("*")
      .eq("user_id", userId)
      .single();
    setWedding(data);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchWedding(user.id);
      }
      setLoading(false);
    }
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        await fetchWedding(session.user.id);
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setWedding(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchWedding]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setWedding(null);
  }, []);

  const refetchWedding = useCallback(async () => {
    if (user) await fetchWedding(user.id);
  }, [user, fetchWedding]);

  return (
    <AuthContext.Provider value={{ user, wedding, loading, signOut, refetchWedding }}>
      {children}
    </AuthContext.Provider>
  );
}
