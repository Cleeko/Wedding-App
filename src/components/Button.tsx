import { cn } from "@/lib/cn";

const variants = {
  primary:
    "bg-primary text-background hover:bg-primary-hover hover:-translate-y-px hover:shadow-card",
  secondary:
    "bg-secondary text-background hover:bg-secondary-hover hover:shadow-soft",
  outline:
    "border border-primary/40 bg-transparent text-primary hover:bg-primary hover:text-background hover:-translate-y-px hover:shadow-card",
  ghost:
    "border border-secondary/40 bg-transparent text-secondary-hover hover:bg-secondary hover:text-background",
  link: "text-text-muted hover:text-primary uppercase-none tracking-normal",
  icon: "h-8 w-8 border border-transparent text-text-muted hover:border-border hover:bg-surface",
  danger:
    "h-8 w-8 border border-transparent text-text-muted hover:border-error/30 hover:text-error",
} as const;

const sizes = {
  sm: "px-3 py-1.5 text-xs tracking-[1.5px]",
  md: "px-5 py-2.5 text-sm tracking-[2px]",
  lg: "px-6 py-3 text-sm tracking-[2px]",
} as const;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isIconVariant = variant === "icon" || variant === "danger";
  const isLinkVariant = variant === "link";

  return (
    <button
      className={cn(
        "rounded-md uppercase transition-all duration-200 font-medium",
        "disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none",
        variants[variant],
        !isIconVariant && !isLinkVariant && sizes[size],
        isIconVariant && "flex items-center justify-center rounded-md",
        isLinkVariant && "text-sm normal-case",
        fullWidth && "w-full",
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
