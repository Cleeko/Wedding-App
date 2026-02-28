"use client";

import { useEffect } from "react";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxHeight?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  maxHeight = false,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-text/40 backdrop-blur-[2px] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={cn(
          "w-full max-w-md rounded-lg border border-border bg-surface p-8 shadow-elevated",
          maxHeight && "max-h-[90vh] overflow-y-auto",
        )}
      >
        <h2 className="mb-5 text-center text-xl font-heading tracking-wider text-text">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
