import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  mobileSidebarOpen: boolean;
  activeModal: string | null;
  toasts: Toast[];
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  openModal: (id: string) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: "success" | "error" | "warning" | "info";
  duration?: number;
}

let toastId = 0;

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  mobileSidebarOpen: false,
  activeModal: null,
  toasts: [],

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  toggleMobileSidebar: () =>
    set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),

  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),

  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: `toast-${++toastId}` },
      ],
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
