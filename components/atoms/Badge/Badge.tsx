import { cn } from "@/utils/cn";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "purple";

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green-50 text-green-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-blue-50 text-blue-700",
  purple: "bg-purple-50 text-purple-700",
};

const dotStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-500",
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  purple: "bg-purple-500",
};

export default function Badge({
  variant = "default",
  size = "sm",
  dot = false,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full",
        variantStyles[variant],
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-[13px]"
      )}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", dotStyles[variant])}
        />
      )}
      {children}
    </span>
  );
}
