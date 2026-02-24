import { cn } from "@/utils/cn";

export interface ProgressBarProps {
  value: number; // 0–100
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: "default" | "success" | "warning" | "danger";
  size?: "sm" | "md";
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  color = "default",
  size = "md",
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  // Auto-color based on percentage if default
  const resolvedColor =
    color === "default"
      ? percent >= 95
        ? "danger"
        : percent >= 80
        ? "warning"
        : "success"
      : color;

  const colorStyles: Record<string, string> = {
    success: "bg-green-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
  };

  return (
    <div className="flex flex-col gap-1">
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="text-text-secondary">{label}</span>}
          {showValue && (
            <span className="text-text-muted">
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          "w-full rounded-full bg-bg-dark overflow-hidden",
          size === "sm" ? "h-1.5" : "h-2.5"
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            colorStyles[resolvedColor]
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
