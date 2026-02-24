import { cn } from "@/utils/cn";

export interface CardProps {
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  border?: boolean;
  shadow?: boolean;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

const paddingMap: Record<string, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-5",
  lg: "p-7",
};

export default function Card({
  padding = "md",
  hover = false,
  border = true,
  shadow = false,
  className,
  onClick,
  children,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl bg-bg-white",
        paddingMap[padding],
        border && "border border-border-light",
        shadow && "shadow-card",
        hover && "hover:shadow-md hover:border-text-muted/20 transition-all duration-200 cursor-pointer",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
