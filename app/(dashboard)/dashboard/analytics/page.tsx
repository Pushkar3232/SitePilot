"use client";

import { DashboardTopbar } from "@/components/organisms/DashboardTopbar";
import { Card } from "@/components/molecules/Card";
import { BarChart3, Eye, MousePointerClick, Globe, ArrowUpRight, TrendingUp } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";

const overviewStats = [
  { label: "Page Views", value: "12,489", change: "+23%", icon: <Eye className="h-5 w-5" /> },
  { label: "Unique Visitors", value: "3,841", change: "+15%", icon: <BarChart3 className="h-5 w-5" /> },
  { label: "Avg. Session", value: "2m 34s", change: "+8%", icon: <MousePointerClick className="h-5 w-5" /> },
  { label: "Bounce Rate", value: "42%", change: "-3%", icon: <TrendingUp className="h-5 w-5" /> },
];

const topPages = [
  { path: "/", views: 4821, pct: 100 },
  { path: "/about", views: 2130, pct: 44 },
  { path: "/projects", views: 1957, pct: 41 },
  { path: "/contact", views: 1240, pct: 26 },
  { path: "/blog", views: 890, pct: 18 },
];

const referrers = [
  { source: "Google", visits: 2400 },
  { source: "Direct", visits: 1800 },
  { source: "Twitter / X", visits: 860 },
  { source: "LinkedIn", visits: 540 },
  { source: "GitHub", visits: 310 },
];

export default function AnalyticsPage() {
  return (
    <>
      <DashboardTopbar pageTitle="Analytics" />

      <div className="p-6 space-y-6">
        {/* Period selector */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">Last 30 days</p>
          <select className="h-9 px-3 text-sm rounded-lg border border-border-light bg-bg-white text-text-primary">
            <option>Last 7 days</option>
            <option selected>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {overviewStats.map((s) => (
            <Card key={s.label} padding="md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-text-muted">{s.label}</p>
                  <p className="text-2xl font-bold text-text-primary mt-1">{s.value}</p>
                  <span className="text-xs font-medium text-tag-teal">{s.change}</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-bg-light flex items-center justify-center text-text-muted">
                  {s.icon}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Chart placeholder */}
        <Card padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Page Views Over Time</h3>
          <div className="h-64 bg-bg-light rounded-xl flex items-center justify-center text-text-muted text-sm">
            <BarChart3 className="h-8 w-8 mr-2 opacity-40" />
            Chart visualization will render here
          </div>
        </Card>

        {/* Two-column: Top Pages & Referrers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Pages */}
          <Card padding="md">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Top Pages</h3>
            <div className="space-y-3">
              {topPages.map((p) => (
                <div key={p.path} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-text-primary">{p.path}</span>
                      <span className="text-xs text-text-muted">{p.views.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-bg-dark rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-red rounded-full transition-all"
                        style={{ width: `${p.pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Referrers */}
          <Card padding="md">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Top Referrers</h3>
            <div className="space-y-3">
              {referrers.map((r) => (
                <div key={r.source} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-text-muted" />
                    <span className="text-sm text-text-primary">{r.source}</span>
                  </div>
                  <Badge variant="default">{r.visits.toLocaleString()} visits</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
