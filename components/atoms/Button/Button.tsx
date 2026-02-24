"use client";

import { forwardRef } from "react";
import { cn } from "@/utils/cn";
import type { ButtonProps } from "./Button.types";

const variantStyles: Record<string, string> = {
  primary:
    "bg-btn-primary text-btn-primary-text hover:bg-[#222] active:bg-[#000] shadow-sm",
  secondary:
    "bg-transparent text-btn-primary border border-btn-secondary-border hover:bg-bg-dark active:bg-border-light",
  ghost:
    "bg-transparent text-text-secondary hover:bg-bg-dark active:bg-border-light",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
  outline:
    "bg-transparent text-text-primary border border-border-light hover:bg-bg-light active:bg-bg-dark",
};

const sizeStyles: Record<string, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-5 text-[14px] gap-2",
  lg: "h-12 px-6 text-[15px] gap-2.5",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-semibold rounded-full transition-all duration-150 cursor-pointer select-none",
          "focus:outline-none focus:ring-2 focus:ring-accent-red/30 focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
