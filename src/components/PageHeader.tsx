interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-6 text-center">
      <h1 className="text-2xl font-heading font-normal tracking-wider text-text">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1.5 text-base text-text-muted tracking-wide">
          {subtitle}
        </p>
      )}
    </div>
  );
}
