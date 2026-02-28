"use client";

import { useEffect } from "react";
import { ToastProvider, useToast } from "./toast";
import { AuthProvider } from "./auth";

function NetworkWatcher({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  useEffect(() => {
    function onOffline() { toast("You're offline — changes won't be saved.", "error"); }
    function onOnline() { toast("Back online!", "success"); }
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, [toast]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <NetworkWatcher>
        <AuthProvider>
          {children}
        </AuthProvider>
      </NetworkWatcher>
    </ToastProvider>
  );
}
