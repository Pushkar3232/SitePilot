"use client";

import Link from "next/link";
import { Globe, BarChart3, Users, ArrowUpRight, Plus } from "lucide-react";
import { DashboardTopbar } from "@/components/organisms/DashboardTopbar";
import { Card } from "@/components/molecules/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { ProgressBar } from "@/components/atoms/ProgressBar";
import { Skeleton } from "@/components/atoms/Skeleton";
import { useWebsitesApi, useAnalyticsDashboardApi, useTeamApi } from "@/hooks/use-api";

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardOverviewPage() {
  const { data: websitesData, loading: websitesLoading } = useWebsitesApi();
  const { data: analyticsData, loading: analyticsLoading } = useAnalyticsDashboardApi(30);
  const { data: teamData, loading: teamLoading } = useTeamApi();

  const websites = websitesData?.websites ?? [];
  const recentWebsites = websites.slice(0, 3);
  const isLoading = websitesLoading || analyticsLoading || teamLoading;

  const stats = [
    {
      label: "Total Websites",
      value: analyticsData ? `${analyticsData.websites.count}` : "—",
      icon: <Globe className="h-5 w-5" />,
      change: analyticsData ? `Limit: ${analyticsData.websites.limit}` : "",
    },
    {
      label: "Page Views",
      value: analyticsData ? analyticsData.pageViews.total.toLocaleString() : "—",
      icon: <BarChart3 className="h-5 w-5" />,
      change: "Last 30 days",
    },
    {
      label: "Team Members",
      value: teamData ? `${teamData.members.length}` : "—",
      icon: <Users className="h-5 w-5" />,
      change: teamData?.invitations?.length ? `${teamData.invitations.length} pending` : "",
    },
  ];

  return (
    <>
      <DashboardTopbar pageTitle="Overview" />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} padding="md">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-xl" />
                  </div>
                </Card>
              ))
            : stats.map((stat) => (
                <Card key={stat.label} padding="md">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-text-muted">{stat.label}</p>
                      <p className="text-2xl font-bold text-text-primary mt-1">{stat.value}</p>
                      {stat.change && (
                        <p className="text-xs text-tag-teal mt-1">{stat.change}</p>
                      )}
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-bg-light flex items-center justify-center text-text-muted">
                      {stat.icon}
                    </div>
                  </div>
                </Card>
              ))}
        </div>

        {/* Usage & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Usage */}
          <Card padding="md" className="lg:col-span-1">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Plan Usage</h3>
            {analyticsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : analyticsData ? (
              <div className="space-y-4">
                <ProgressBar
                  value={analyticsData.websites.count}
                  max={analyticsData.websites.limit}
                  label="Websites"
                  showValue
                />
                <ProgressBar
                  value={analyticsData.storage.usedMb}
                  max={analyticsData.storage.limitMb}
                  label="Storage (MB)"
                  showValue
                />
                <ProgressBar
                  value={analyticsData.aiCredits.used}
                  max={analyticsData.aiCredits.limit}
                  label="AI Credits"
                  showValue
                />
              </div>
            ) : (
              <p className="text-sm text-text-muted">Unable to load usage data.</p>
            )}
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent-red mt-4 hover:underline"
            >
              Upgrade Plan <ArrowUpRight className="h-3 w-3" />
            </Link>
          </Card>

          {/* Recent Websites */}
          <Card padding="md" className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary">Recent Websites</h3>
              <Link href="/dashboard/websites">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {websitesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                ))
              ) : recentWebsites.length > 0 ? (
                recentWebsites.map((site) => (
                  <Link
                    key={site.id}
                    href={`/dashboard/websites/${site.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-bg-light transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-bg-dark flex items-center justify-center text-text-muted">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{site.name}</p>
                        <p className="text-xs text-text-muted">{site.subdomain}.sitepilot.io</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-muted hidden sm:block">
                        {formatTimeAgo(site.updated_at)}
                      </span>
                      <Badge
                        variant={site.status === "published" ? "success" : "default"}
                        dot
                      >
                        {site.status === "published" ? "Published" : site.status === "archived" ? "Archived" : "Draft"}
                      </Badge>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-text-muted text-center py-6">
                  No websites yet. Create your first one!
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Action */}
        <Card padding="md" className="text-center py-10">
          <h3 className="text-lg font-bold text-text-primary">Create a new website</h3>
          <p className="text-sm text-text-muted mt-1">
            Start from scratch or use our AI to generate one for you.
          </p>
          <Link href="/dashboard/websites">
            <Button className="mt-4" leftIcon={<Plus className="h-4 w-4" />}>
              New Website
            </Button>
          </Link>
        </Card>
      </div>
    </>
  );
}
