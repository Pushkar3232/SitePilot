"use client";

import { useState } from "react";
import { DashboardTopbar } from "@/components/organisms/DashboardTopbar";
import { Card } from "@/components/molecules/Card";
import { BarChart3, Eye, MousePointerClick, Globe, TrendingUp } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Skeleton } from "@/components/atoms/Skeleton";
import { useAnalyticsDashboardApi } from "@/hooks/use-api";

const periodOptions = [
  { label: "Last 7 days", value: 7 },
  { label: "Last 30 days", value: 30 },
  { label: "Last 90 days", value: 90 },
];

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data, loading, error, refetch } = useAnalyticsDashboardApi(days);

  const chartData = data?.pageViews?.chartData ?? [];
  const topPages: any[] = [];
  const referrers: any[] = [];

  const overviewStats = [
    { label: "Page Views", value: (data?.pageViews?.total ?? 0).toLocaleString(), icon: <Eye className="h-5 w-5" /> },
    { label: "Unique Visitors", value: "0", icon: <BarChart3 className="h-5 w-5" /> },
    { label: "Avg. Session", value: "—", icon: <MousePointerClick className="h-5 w-5" /> },
    { label: "Bounce Rate", value: "—", icon: <TrendingUp className="h-5 w-5" /> },
  ];

  const maxPageViews = topPages.length > 0 ? Math.max(...topPages.map((p: any) => p.views ?? 0), 1) : 1;

  return (
    <>
      <DashboardTopbar pageTitle="Analytics" />

      <div className="p-6 space-y-6">
        {/* Period selector */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">
            {periodOptions.find((o) => o.value === days)?.label}
          </p>
          <select
            className="h-9 px-3 text-sm rounded-lg border border-border-light bg-bg-white text-text-primary"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            {periodOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} padding="md">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card padding="md">
            <p className="text-sm text-text-muted text-center">{error}</p>
            <div className="flex justify-center mt-3">
              <button onClick={refetch} className="text-sm text-accent-red hover:underline">Retry</button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {overviewStats.map((s) => (
              <Card key={s.label} padding="md">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-text-muted">{s.label}</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">{s.value}</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-bg-light flex items-center justify-center text-text-muted">
                    {s.icon}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Chart placeholder */}
        <Card padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Page Views Over Time</h3>
          {loading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : chartData.length > 0 ? (
            <div className="h-64 flex items-end gap-1 px-2">
              {chartData.map((point: any, idx: number) => {
                const maxVal = Math.max(...chartData.map((c: any) => c.views ?? c.value ?? 0), 1);
                const val = point.views ?? point.value ?? 0;
                const heightPct = (val / maxVal) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div
                      className="w-full bg-accent-red rounded-t-sm min-h-0.5 transition-all"
                      style={{ height: `${heightPct}%` }}
                      title={`${point.date ?? point.label}: ${val}`}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 bg-bg-light rounded-xl flex items-center justify-center text-text-muted text-sm">
              <BarChart3 className="h-8 w-8 mr-2 opacity-40" />
              No chart data available
            </div>
          )}
        </Card>

        {/* Two-column: Top Pages & Referrers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Pages */}
          <Card padding="md">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Top Pages</h3>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : topPages.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">No page view data yet.</p>
            ) : (
              <div className="space-y-3">
                {topPages.map((p: any) => {
                  const pct = Math.round(((p.views ?? 0) / maxPageViews) * 100);
                  return (
                    <div key={p.path} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-text-primary">{p.path}</span>
                          <span className="text-xs text-text-muted">{(p.views ?? 0).toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 bg-bg-dark rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent-red rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Referrers */}
          <Card padding="md">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Top Referrers</h3>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : referrers.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">No referrer data yet.</p>
            ) : (
              <div className="space-y-3">
                {referrers.map((r: any) => (
                  <div key={r.source} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-text-muted" />
                      <span className="text-sm text-text-primary">{r.source}</span>
                    </div>
                    <Badge variant="default">{(r.visits ?? 0).toLocaleString()} visits</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
