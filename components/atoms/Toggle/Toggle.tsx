"use client";

import { cn } from "@/utils/cn";

export interface ToggleProps {
  checked?: boolean;
  label?: string;
  size?: "sm" | "md";
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

export default function Toggle({
  checked = false,
  label,
  size = "md",
  disabled = false,
  onChange,
}: ToggleProps) {
  const sizes = {
    sm: { track: "h-5 w-9", thumb: "h-3.5 w-3.5", translate: "translate-x-4" },
    md: { track: "h-6 w-11", thumb: "h-4.5 w-4.5", translate: "translate-x-5" },
  };

  const s = sizes[size];

  return (
    <label
      className={cn(
        "inline-flex items-center gap-2.5 cursor-pointer select-none",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          "relative inline-flex shrink-0 rounded-full transition-colors duration-200 ease-in-out",
          "focus:outline-none focus:ring-2 focus:ring-accent-red/30 focus:ring-offset-2",
          s.track,
          checked ? "bg-btn-primary" : "bg-border-light"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out",
            "translate-y-0.75 translate-x-0.75",
            s.thumb,
            checked && s.translate
          )}
        />
      </button>
      {label && (
        <span className="text-sm text-text-primary">{label}</span>
      )}
    </label>
  );
}
