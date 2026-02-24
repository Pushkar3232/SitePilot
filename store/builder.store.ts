import { create } from "zustand";
import type { SiteComponent } from "@/types/component.types";
import type { Page } from "@/types/page.types";

interface BuilderState {
  // Current state
  activePage: Page | null;
  components: SiteComponent[];
  selectedComponentId: string | null;
  activeViewport: "desktop" | "tablet" | "mobile";
  isDirty: boolean;
  isSaving: boolean;
  isPublishing: boolean;

  // Actions
  setActivePage: (page: Page | null) => void;
  setComponents: (components: SiteComponent[]) => void;
  selectComponent: (id: string | null) => void;
  setViewport: (viewport: "desktop" | "tablet" | "mobile") => void;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
  setPublishing: (publishing: boolean) => void;
  updateComponent: (id: string, props: Record<string, unknown>) => void;
  addComponent: (component: SiteComponent) => void;
  removeComponent: (id: string) => void;
  reorderComponents: (components: SiteComponent[]) => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  activePage: null,
  components: [],
  selectedComponentId: null,
  activeViewport: "desktop",
  isDirty: false,
  isSaving: false,
  isPublishing: false,

  setActivePage: (page) => set({ activePage: page }),
  setComponents: (components) => set({ components }),
  selectComponent: (id) => set({ selectedComponentId: id }),
  setViewport: (viewport) => set({ activeViewport: viewport }),
  setDirty: (dirty) => set({ isDirty: dirty }),
  setSaving: (saving) => set({ isSaving: saving }),
  setPublishing: (publishing) => set({ isPublishing: publishing }),

  updateComponent: (id, props) =>
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, props: { ...c.props, ...props } } : c
      ),
      isDirty: true,
    })),

  addComponent: (component) =>
    set((state) => ({
      components: [...state.components, component],
      isDirty: true,
    })),

  removeComponent: (id) =>
    set((state) => ({
      components: state.components.filter((c) => c.id !== id),
      selectedComponentId:
        state.selectedComponentId === id ? null : state.selectedComponentId,
      isDirty: true,
    })),

  reorderComponents: (components) =>
    set({ components, isDirty: true }),
}));
