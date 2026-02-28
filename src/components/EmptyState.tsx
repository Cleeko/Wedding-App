interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <p className="py-12 text-center italic text-text-muted">{message}</p>
  );
}
