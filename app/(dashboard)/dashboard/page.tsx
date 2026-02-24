"use client";

import Link from "next/link";
import { Globe, BarChart3, Users, ArrowUpRight, Plus } from "lucide-react";
import { DashboardTopbar } from "@/components/organisms/DashboardTopbar";
import { Card } from "@/components/molecules/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { ProgressBar } from "@/components/atoms/ProgressBar";

// Mock data
const stats = [
  { label: "Total Websites", value: "3", icon: <Globe className="h-5 w-5" />, change: "+1 this month" },
  { label: "Page Views", value: "12,489", icon: <BarChart3 className="h-5 w-5" />, change: "+23% vs last month" },
  { label: "Team Members", value: "5", icon: <Users className="h-5 w-5" />, change: "2 active today" },
];

const recentWebsites = [
  { id: "1", name: "Portfolio Site", subdomain: "john-portfolio", status: "published", updatedAt: "2 hours ago" },
  { id: "2", name: "Coffee Shop", subdomain: "beans-cafe", status: "draft", updatedAt: "1 day ago" },
  { id: "3", name: "Tech Blog", subdomain: "tech-today", status: "published", updatedAt: "3 days ago" },
];

export default function DashboardOverviewPage() {
  return (
    <>
      <DashboardTopbar pageTitle="Overview" />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} padding="md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-text-muted">{stat.label}</p>
                  <p className="text-2xl font-bold text-text-primary mt-1">{stat.value}</p>
                  <p className="text-xs text-tag-teal mt-1">{stat.change}</p>
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
            <div className="space-y-4">
              <ProgressBar value={3} max={5} label="Websites" showValue />
              <ProgressBar value={12} max={20} label="Pages" showValue />
              <ProgressBar value={256} max={1024} label="Storage (MB)" showValue />
              <ProgressBar value={45} max={100} label="AI Credits" showValue />
            </div>
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
              {recentWebsites.map((site) => (
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
                    <span className="text-xs text-text-muted hidden sm:block">{site.updatedAt}</span>
                    <Badge
                      variant={site.status === "published" ? "success" : "default"}
                      dot
                    >
                      {site.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </Link>
              ))}
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
