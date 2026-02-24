import { cn } from "@/utils/cn";
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from "lucide-react";

export interface AlertProps {
  variant: "info" | "success" | "warning" | "danger";
  title: string;
  description?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: { label: string; onClick: () => void };
}

const variantStyles: Record<string, { bg: string; border: string; icon: React.ReactNode }> = {
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: <Info className="h-5 w-5 text-blue-600" />,
  },
  success: {
    bg: "bg-green-50",
    border: "border-green-200",
    icon: <CheckCircle className="h-5 w-5 text-green-600" />,
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
  },
  danger: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: <AlertCircle className="h-5 w-5 text-red-600" />,
  },
};

export default function Alert({
  variant,
  title,
  description,
  dismissible = false,
  onDismiss,
  action,
}: AlertProps) {
  const v = variantStyles[variant];

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border",
        v.bg,
        v.border
      )}
    >
      <div className="shrink-0 mt-0.5">{v.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        {description && (
          <p className="text-sm text-text-secondary mt-0.5">{description}</p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="text-sm font-medium text-btn-primary hover:underline mt-1.5"
          >
            {action.label}
          </button>
        )}
      </div>
      {dismissible && (
        <button
          onClick={onDismiss}
          className="shrink-0 p-1 text-text-muted hover:text-text-primary transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
