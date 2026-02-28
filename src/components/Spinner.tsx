interface SpinnerProps {
  label?: string;
  fullPage?: boolean;
}

export function Spinner({ label, fullPage = false }: SpinnerProps) {
  const spinner = (
    <div className="text-center">
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-3 border-border border-t-primary" />
      {label && <p className="text-text-muted">{label}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}
