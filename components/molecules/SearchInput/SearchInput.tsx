"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/utils/cn";

export interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  debounceMs?: number;
  className?: string;
}

export default function SearchInput({
  placeholder = "Search...",
  value: controlledValue,
  onChange,
  onClear,
  className,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState("");
  const value = controlledValue ?? internalValue;

  const handleChange = (val: string) => {
    setInternalValue(val);
    onChange?.(val);
  };

  const handleClear = () => {
    setInternalValue("");
    onChange?.("");
    onClear?.();
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full h-10 pl-10 pr-9 rounded-lg border border-border-light bg-bg-white text-text-primary text-sm",
          "placeholder:text-text-muted",
          "focus:outline-none focus:ring-2 focus:ring-accent-red/30 focus:border-accent-red/50",
          "transition-all duration-150"
        )}
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
