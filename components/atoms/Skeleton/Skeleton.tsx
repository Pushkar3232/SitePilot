import { cn } from "@/utils/cn";

export interface SkeletonProps {
  variant?: "text" | "rect" | "circle";
  width?: string | number;
  height?: string | number;
  className?: string;
}

export default function Skeleton({
  variant = "text",
  width,
  height,
  className,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-border-light",
        variant === "text" && "h-4 rounded",
        variant === "rect" && "rounded-lg",
        variant === "circle" && "rounded-full",
        className
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
    />
  );
}
