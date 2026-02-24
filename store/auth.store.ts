import { create } from "zustand";
import type { User } from "@/types/user.types";
import type { Tenant } from "@/types/tenant.types";

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setTenant: (tenant: Tenant | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) =>
    set({ user, isAuthenticated: !!user }),
  setTenant: (tenant) => set({ tenant }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () =>
    set({ user: null, tenant: null, isAuthenticated: false }),
}));
