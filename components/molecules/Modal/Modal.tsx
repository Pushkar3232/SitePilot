"use client";

import { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showClose?: boolean;
  children: React.ReactNode;
}

const sizeMap: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  showClose = true,
  children,
}: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full bg-bg-white rounded-2xl shadow-lg border border-border-light",
          "animate-in fade-in-0 zoom-in-95",
          sizeMap[size]
        )}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-start justify-between p-5 pb-0">
            <div>
              {title && (
                <h2 className="text-lg font-bold text-text-primary">{title}</h2>
              )}
              {description && (
                <p className="text-sm text-text-muted mt-1">{description}</p>
              )}
            </div>
            {showClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-dark transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
