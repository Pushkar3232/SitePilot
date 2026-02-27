"use client";

import { useState } from "react";
import { DashboardTopbar } from "@/components/organisms/DashboardTopbar";
import { Card } from "@/components/molecules/Card";
import { 
  BarChart3, 
  Eye, 
  Users, 
  MousePointerClick, 
  TrendingUp, 
  Globe, 
  Monitor, 
  MapPin
} from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Skeleton } from "@/components/atoms/Skeleton";
import { Select } from "@/components/atoms/Select";
import { useAnalyticsDashboardApi } from "@/hooks/use-api";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const periodOptions = [
  { label: "Last 7 days", value: 7 },
  { label: "Last 30 days", value: 30 },
  { label: "Last 90 days", value: 90 },
];

const COLORS = ["#8B1A1A", "#E8533A", "#3A9E8A", "#111111", "#444444"];

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function formatPercentage(value: number | null): string {
  if (value === null) return "—";
  return `${value}%`;
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>("all");
  const { data, loading } = useAnalyticsDashboardApi(days, selectedWebsiteId === "all" ? undefined : selectedWebsiteId);

  const websitesList = data?.websitesList ?? [];
  const overview = data?.overview;
  const chartData = data?.chartData ?? [];
  const topPages = data?.topPages ?? [];
  const referrers = data?.referrers ?? [];
  const devices = data?.devices ?? [];
  const countries = data?.countries ?? [];

  const overviewStats = [
    { 
      label: "Page Views", 
      value: overview ? overview.totalPageViews.toLocaleString() : "0", 
      icon: <Eye className="h-5 w-5" />,
      change: overview ? `+${Math.round((overview.totalPageViews / (overview.period || 30)) * 100) / 100}/day` : ""
    },
    { 
      label: "Unique Visitors", 
      value: overview ? overview.totalUniqueVisitors.toLocaleString() : "0", 
      icon: <Users className="h-5 w-5" />,
      change: ""
    },
    { 
      label: "Avg. Session", 
      value: overview ? formatDuration(overview.avgSessionDuration) : "—", 
      icon: <MousePointerClick className="h-5 w-5" />,
      change: ""
    },
    { 
      label: "Bounce Rate", 
      value: overview ? formatPercentage(overview.avgBounceRate) : "—", 
      icon: <TrendingUp className="h-5 w-5" />,
      change: overview && overview.avgBounceRate !== null ? (overview.avgBounceRate > 50 ? "High" : "Healthy") : ""
    },
  ];

  const maxPageViews = topPages.length > 0 ? Math.max(...topPages.map((p) => p.views), 1) : 1;

  return (
    <>
      <DashboardTopbar pageTitle="Analytics" />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Website Selector */}
            <div className="min-w-48">
              <label className="block text-xs text-text-muted mb-1.5">Website</label>
              <Select
                value={selectedWebsiteId}
                onChange={(value) => setSelectedWebsiteId(value)}
                disabled={loading}
                options={[
                  { label: "All Websites", value: "all" },
                  ...websitesList.map((website) => ({
                    label: website.name,
                    value: website.id
                  }))
                ]}
              />
            </div>

            {/* Period Selector */}
            <div className="min-w-40">
              <label className="block text-xs text-text-muted mb-1.5">Period</label>
              <Select
                value={days.toString()}
                onChange={(value) => setDays(Number(value))}
                disabled={loading}
                options={periodOptions.map((o) => ({
                  label: o.label,
                  value: o.value.toString()
                }))}
              />
            </div>
          </div>

          <div className="text-sm text-text-muted flex items-center">
            <span>Showing {periodOptions.find(o => o.value === days)?.label.toLowerCase()}</span>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} padding="md">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </Card>
            ))
          ) : (
            overviewStats.map((stat) => (
              <Card key={stat.label} padding="md">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-text-muted">{stat.label}</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">{stat.value}</p>
                    {stat.change && (
                      <p className="text-xs mt-1" style={{ color: stat.change.includes('High') ? '#E8533A' : '#3A9E8A' }}>
                        {stat.change}
                      </p>
                    )}
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-bg-light flex items-center justify-center text-text-muted">
                    {stat.icon}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Page Views Chart */}
          <Card padding="md">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Page Views Over Time</h3>
            {loading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : chartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#888888' }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#888888' }}
                      width={40}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value) => [typeof value === 'number' ? value.toLocaleString() : value, 'Page Views']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pageViews" 
                      stroke="#8B1A1A" 
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#8B1A1A' }}
                      activeDot={{ r: 6, stroke: '#8B1A1A', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 bg-bg-light rounded-xl flex items-center justify-center text-text-muted text-sm">
                <BarChart3 className="h-8 w-8 mr-2 opacity-40" />
                No data available
              </div>
            )}
          </Card>

          {/* Visitors Chart */}
          <Card padding="md">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Unique Visitors</h3>
            {loading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : chartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#888888' }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#888888' }}
                      width={40}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value) => [typeof value === 'number' ? value.toLocaleString() : value, 'Visitors']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="visitors" 
                      stroke="#3A9E8A" 
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#3A9E8A' }}
                      activeDot={{ r: 6, stroke: '#3A9E8A', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 bg-bg-light rounded-xl flex items-center justify-center text-text-muted text-sm">
                <Users className="h-8 w-8 mr-2 opacity-40" />
                No data available
              </div>
            )}
          </Card>
        </div>

        {/* Top Pages & Referrers */}
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
              <p className="text-sm text-text-muted text-center py-8">No page data yet.</p>
            ) : (
              <div className="space-y-3">
                {topPages.map((page, index) => {
                  const pct = Math.round((page.views / maxPageViews) * 100);
                  return (
                    <div key={page.path} className="flex items-center gap-3">
                      <div className="text-xs text-text-muted w-5">{index + 1}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-text-primary truncate max-w-[180px]" title={page.path}>
                            {page.path}
                          </span>
                          <span className="text-xs text-text-muted">{page.views.toLocaleString()}</span>
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

          {/* Top Referrers */}
          <Card padding="md">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Traffic Sources</h3>
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
                {referrers.map((referrer) => (
                  <div key={referrer.source} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Globe className="h-4 w-4 text-text-muted flex-shrink-0" />
                      <span className="text-sm text-text-primary truncate" title={referrer.source}>
                        {referrer.source || "Direct"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">{referrer.visits.toLocaleString()}</span>
                      <Badge variant="default">{referrer.percent}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Device & Country Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Device Breakdown */}
          <Card padding="md">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Device Breakdown</h3>
            {loading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : devices.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={devices}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="device"
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {devices.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} visits`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 bg-bg-light rounded-xl flex items-center justify-center text-text-muted text-sm">
                <Monitor className="h-8 w-8 mr-2 opacity-40" />
                No device data
              </div>
            )}
          </Card>

          {/* Country Breakdown */}
          <Card padding="md">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Top Countries</h3>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            ) : countries.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">No country data yet.</p>
            ) : (
              <div className="space-y-3">
                {countries.map((country, index) => (
                  <div key={country.country} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-text-muted" />
                      <span className="text-sm text-text-primary">{country.country || "Unknown"}</span>
                    </div>
                    <span className="text-sm font-medium">{country.count.toLocaleString()}</span>
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
