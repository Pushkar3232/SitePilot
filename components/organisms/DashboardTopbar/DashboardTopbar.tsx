"use client";

import { Bell, LogOut, Settings, User } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { DropdownMenu } from "@/components/molecules/DropdownMenu";
import { useAuthStore } from "@/store/auth.store";

interface DashboardTopbarProps {
  pageTitle: string;
  breadcrumb?: string;
}

export default function DashboardTopbar({
  pageTitle,
  breadcrumb,
}: DashboardTopbarProps) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-bg-white/80 backdrop-blur-md border-b border-border-light">
      {/* Left: Title */}
      <div>
        {breadcrumb && (
          <p className="text-xs text-text-muted mb-0.5">{breadcrumb}</p>
        )}
        <h1 className="text-lg font-bold text-text-primary">{pageTitle}</h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Plan Badge */}
        <Badge variant="purple" size="md">
          Pro
        </Badge>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-text-muted hover:bg-bg-light hover:text-text-primary transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-tag-coral rounded-full" />
        </button>

        {/* User menu */}
        <DropdownMenu
          trigger={
            <button className="flex items-center gap-2 p-1 rounded-xl hover:bg-bg-light transition-colors">
              <Avatar
                src={user?.avatar_url}
                alt={user?.display_name || "User"}
                size="sm"
              />
            </button>
          }
          items={[
            {
              label: "Profile & Preferences",
              icon: <User className="h-4 w-4" />,
              onClick: () => {},
            },
            {
              label: "Settings",
              icon: <Settings className="h-4 w-4" />,
              onClick: () => {},
            },
            {
              label: "Logout",
              icon: <LogOut className="h-4 w-4" />,
              onClick: () => {},
              variant: "danger",
            },
          ]}
        />
      </div>
    </header>
  );
}
