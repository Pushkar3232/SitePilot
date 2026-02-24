"use client";

import { cn } from "@/utils/cn";

export interface TooltipProps {
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
}

export default function Tooltip({
  content,
  position = "top",
  children,
}: TooltipProps) {
  const positionStyles: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div className="relative inline-flex group">
      {children}
      <div
        className={cn(
          "absolute z-50 px-2.5 py-1.5 text-xs font-medium text-white bg-text-primary rounded-md",
          "opacity-0 invisible group-hover:opacity-100 group-hover:visible",
          "transition-all duration-150 whitespace-nowrap pointer-events-none",
          positionStyles[position]
        )}
      >
        {content}
      </div>
    </div>
  );
}
