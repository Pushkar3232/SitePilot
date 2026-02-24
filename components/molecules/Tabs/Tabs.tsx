"use client";

import { cn } from "@/utils/cn";

export interface Tab {
  label: string;
  value: string;
  icon?: React.ReactNode;
  badge?: string;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (value: string) => void;
  variant?: "underline" | "pills" | "bordered";
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "underline",
}: TabsProps) {
  return (
    <div
      className={cn(
        "flex gap-1",
        variant === "underline" && "border-b border-border-light gap-0"
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "inline-flex items-center gap-1.5 text-sm font-medium transition-all duration-150",
            // Underline variant
            variant === "underline" && [
              "px-4 py-2.5 border-b-2 -mb-px",
              activeTab === tab.value
                ? "border-btn-primary text-text-primary"
                : "border-transparent text-text-muted hover:text-text-secondary hover:border-border-light",
            ],
            // Pills variant
            variant === "pills" && [
              "px-3.5 py-2 rounded-full",
              activeTab === tab.value
                ? "bg-btn-primary text-white"
                : "text-text-muted hover:bg-bg-dark hover:text-text-secondary",
            ],
            // Bordered variant
            variant === "bordered" && [
              "px-3.5 py-2 rounded-lg border",
              activeTab === tab.value
                ? "border-btn-primary bg-bg-light text-text-primary"
                : "border-transparent text-text-muted hover:bg-bg-light hover:text-text-secondary",
            ]
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.badge && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-bg-dark text-text-muted">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
