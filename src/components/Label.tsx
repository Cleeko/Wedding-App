import { cn } from "@/lib/cn";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({
  required,
  className,
  children,
  ...props
}: LabelProps) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-sm font-medium text-text-muted",
        className,
      )}
      {...props}
    >
      {children}
      {required && " *"}
    </label>
  );
}
