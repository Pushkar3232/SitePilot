"use client";

import { DashboardSidebar } from "@/components/organisms/DashboardSidebar";
import { ToastContainer } from "@/components/molecules/Toast";
import { useUIStore } from "@/store/ui.store";
import { cn } from "@/utils/cn";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <div className="min-h-screen bg-bg-light">
      <DashboardSidebar />

      {/* Main content area */}
      <main
        className={cn(
          "transition-all duration-300",
          sidebarOpen ? "ml-[240px]" : "ml-[68px]"
        )}
      >
        {children}
      </main>

      <ToastContainer />
    </div>
  );
}
