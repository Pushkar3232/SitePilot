import { cn } from "@/utils/cn";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-text-muted">{icon}</div>
      )}
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      {description && (
        <p className="text-sm text-text-muted mt-1.5 max-w-sm">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 inline-flex items-center justify-center h-10 px-5 bg-btn-primary text-btn-primary-text text-sm font-semibold rounded-full hover:bg-[#222] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
