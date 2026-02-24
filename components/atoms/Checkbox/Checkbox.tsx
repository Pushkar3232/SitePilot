"use client";

import { cn } from "@/utils/cn";
import { Check } from "lucide-react";

export interface CheckboxProps {
  checked?: boolean;
  label?: string;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

export default function Checkbox({
  checked = false,
  label,
  disabled = false,
  onChange,
}: CheckboxProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-2 cursor-pointer select-none",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          "h-5 w-5 rounded border-2 flex items-center justify-center transition-all duration-150",
          checked
            ? "bg-btn-primary border-btn-primary"
            : "bg-bg-white border-border-light hover:border-text-muted",
          "focus:outline-none focus:ring-2 focus:ring-accent-red/30 focus:ring-offset-1"
        )}
      >
        {checked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
      </button>
      {label && (
        <span className="text-sm text-text-primary">{label}</span>
      )}
    </label>
  );
}
