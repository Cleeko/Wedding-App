import { cn } from "@/lib/cn";

const variants = {
  form: "rounded-lg border border-border bg-surface p-8 shadow-card",
  row: "rounded-md border border-border/60 bg-background p-4 transition-all hover:shadow-soft",
  panel: "rounded-md border border-border/40 bg-surface/50 p-4",
} as const;

interface CardProps {
  variant?: keyof typeof variants;
  className?: string;
  children: React.ReactNode;
}

export function Card({
  variant = "form",
  className,
  children,
}: CardProps) {
  return (
    <div className={cn(variants[variant], className)}>
      {children}
    </div>
  );
}
