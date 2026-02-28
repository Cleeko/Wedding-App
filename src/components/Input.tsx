import { cn } from "@/lib/cn";

const baseClasses =
  "w-full rounded-md border border-border bg-surface px-4 py-3 text-base text-text transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return <input className={cn(baseClasses, className)} {...props} />;
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea className={cn(baseClasses, "resize-y", className)} {...props} />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select className={cn(baseClasses, className)} {...props}>
      {children}
    </select>
  );
}
