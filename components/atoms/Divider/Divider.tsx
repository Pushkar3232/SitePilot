import { cn } from "@/utils/cn";

export interface DividerProps {
  orientation?: "horizontal" | "vertical";
  label?: string;
  className?: string;
}

export default function Divider({
  orientation = "horizontal",
  label,
  className,
}: DividerProps) {
  if (orientation === "vertical") {
    return <div className={cn("w-px bg-border-light self-stretch", className)} />;
  }

  if (label) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="flex-1 h-px bg-border-light" />
        <span className="text-xs text-text-muted font-medium">{label}</span>
        <div className="flex-1 h-px bg-border-light" />
      </div>
    );
  }

  return <div className={cn("w-full h-px bg-border-light", className)} />;
}
