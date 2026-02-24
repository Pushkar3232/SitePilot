"use client";

import { cn } from "@/utils/cn";

export interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function FormField({
  label,
  error,
  hint,
  required = false,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-sm font-medium text-text-primary">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  );
}
