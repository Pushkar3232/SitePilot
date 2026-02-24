import { cn } from "@/utils/cn";

export interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  ring?: boolean;
}

const sizeMap: Record<string, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

export default function Avatar({
  src,
  alt = "",
  fallback,
  size = "md",
  ring = false,
}: AvatarProps) {
  const initials =
    fallback ||
    alt
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full bg-bg-dark text-text-muted font-semibold overflow-hidden shrink-0",
        sizeMap[size],
        ring && "ring-2 ring-white"
      )}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span>{initials || "?"}</span>
      )}
    </div>
  );
}
