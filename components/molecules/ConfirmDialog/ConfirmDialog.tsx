"use client";

import { Button } from "@/components/atoms/Button";
import Modal from "@/components/molecules/Modal/Modal";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <p className="text-sm text-text-secondary mb-6">{description}</p>
      <div className="flex items-center justify-end gap-3">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === "danger" ? "danger" : "primary"}
          size="sm"
          isLoading={isLoading}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
