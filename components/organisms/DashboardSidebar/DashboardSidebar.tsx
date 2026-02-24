"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  Palette,
  Link2,
  Users,
  BarChart3,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useUIStore } from "@/store/ui.store";
import type { UserRole } from "@/types/user.types";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Overview",
    icon: <LayoutDashboard className="h-5 w-5" />,
    href: "/dashboard",
    roles: ["owner", "admin", "editor", "developer", "viewer"],
  },
  {
    label: "Websites",
    icon: <Globe className="h-5 w-5" />,
    href: "/dashboard/websites",
    roles: ["owner", "admin", "editor", "developer", "viewer"],
  },
  {
    label: "Branding",
    icon: <Palette className="h-5 w-5" />,
    href: "/dashboard/branding",
    roles: ["owner", "admin", "editor"],
  },
  {
    label: "Domains",
    icon: <Link2 className="h-5 w-5" />,
    href: "/dashboard/domains",
    roles: ["owner", "admin"],
  },
  {
    label: "Team",
    icon: <Users className="h-5 w-5" />,
    href: "/dashboard/team",
    roles: ["owner", "admin", "editor", "developer", "viewer"],
  },
  {
    label: "Analytics",
    icon: <BarChart3 className="h-5 w-5" />,
    href: "/dashboard/analytics",
    roles: ["owner", "admin", "editor", "viewer"],
  },
  {
    label: "Billing",
    icon: <CreditCard className="h-5 w-5" />,
    href: "/dashboard/billing",
    roles: ["owner", "admin"],
  },
  {
    label: "Settings",
    icon: <Settings className="h-5 w-5" />,
    href: "/dashboard/settings",
    roles: ["owner", "admin", "editor", "developer", "viewer"],
  },
];

interface DashboardSidebarProps {
  userRole?: UserRole;
}

export default function DashboardSidebar({ userRole = "owner" }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const filteredItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-bg-white border-r border-border-light transition-all duration-300",
        sidebarOpen ? "w-[240px]" : "w-[68px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-border-light">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-tag-teal flex items-center justify-center">
            <span className="text-white font-bold text-sm">SP</span>
          </div>
          {sidebarOpen && (
            <span className="text-base font-bold text-text-primary">
              SitePilot
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="flex flex-col gap-1">
          {filteredItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-bg-light text-text-primary font-semibold"
                      : "text-text-muted hover:bg-bg-light hover:text-text-secondary"
                  )}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 py-3 border-t border-border-light">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full h-9 rounded-lg text-text-muted hover:bg-bg-light hover:text-text-primary transition-colors"
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
