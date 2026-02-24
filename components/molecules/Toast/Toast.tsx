"use client";

import { useEffect } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/utils/cn";
import { useUIStore, type Toast as ToastType } from "@/store/ui.store";

const icons: Record<string, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-green-600" />,
  error: <AlertCircle className="h-5 w-5 text-red-600" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-600" />,
  info: <Info className="h-5 w-5 text-blue-600" />,
};

function ToastItem({ toast }: { toast: ToastType }) {
  const removeToast = useUIStore((s) => s.removeToast);

  useEffect(() => {
    const timer = setTimeout(
      () => removeToast(toast.id),
      toast.duration || 5000
    );
    return () => clearTimeout(timer);
  }, [toast, removeToast]);

  return (
    <div className="flex items-start gap-3 bg-bg-white border border-border-light rounded-xl shadow-lg p-4 min-w-[300px] max-w-md">
      <div className="shrink-0 mt-0.5">{icons[toast.variant]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">{toast.title}</p>
        {toast.description && (
          <p className="text-sm text-text-muted mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 p-1 text-text-muted hover:text-text-primary transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
