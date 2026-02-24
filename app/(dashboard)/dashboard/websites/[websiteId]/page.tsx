"use client";

import { useState } from "react";
import Link from "next/link";
import { use } from "react";
import { Globe, Pencil, ExternalLink, ArrowLeft, Trash2, FileText, Eye } from "lucide-react";
import { DashboardTopbar } from "@/components/organisms/DashboardTopbar";
import { Card } from "@/components/molecules/Card";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Tabs } from "@/components/molecules/Tabs";

interface WebsiteDetailPageProps {
  params: Promise<{ websiteId: string }>;
}

export default function WebsiteDetailPage({ params }: WebsiteDetailPageProps) {
  const { websiteId } = use(params);
  const [activeTab, setActiveTab] = useState("pages");

  // Mock data
  const website = {
    id: websiteId,
    name: "Portfolio Site",
    subdomain: "john-portfolio-x7k2",
    status: "published",
    updatedAt: "Feb 24, 2026",
    pages: [
      { id: "1", title: "Home", slug: "/", isHomepage: true, isPublished: true },
      { id: "2", title: "About", slug: "/about", isHomepage: false, isPublished: true },
      { id: "3", title: "Contact", slug: "/contact", isHomepage: false, isPublished: false },
    ],
  };

  return (
    <>
      <DashboardTopbar
        pageTitle={website.name}
        breadcrumb="Websites"
      />

      <div className="p-6 space-y-6">
        {/* Back link */}
        <Link
          href="/dashboard/websites"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Websites
        </Link>

        {/* Header card */}
        <Card padding="md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-bg-dark flex items-center justify-center text-text-muted">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-text-primary">
                    {website.name}
                  </h2>
                  <Badge variant="success" dot>
                    Published
                  </Badge>
                </div>
                <p className="text-sm text-text-muted mt-0.5">
                  {website.subdomain}.sitepilot.io · Updated {website.updatedAt}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/dashboard/websites/${websiteId}/builder`}>
                <Button leftIcon={<Pencil className="h-4 w-4" />}>
                  Open Builder
                </Button>
              </Link>
              <Button
                variant="secondary"
                leftIcon={<ExternalLink className="h-4 w-4" />}
                onClick={() => window.open(`https://${website.subdomain}.sitepilot.io`, "_blank")}
              >
                View Live
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs
          tabs={[
            { label: "Pages", value: "pages", icon: <FileText className="h-4 w-4" /> },
            { label: "Settings", value: "settings", icon: <Eye className="h-4 w-4" /> },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Pages List */}
        {activeTab === "pages" && (
          <Card padding="none">
            <div className="divide-y divide-border-light">
              {website.pages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-bg-light/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-text-muted" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {page.title}
                        {page.isHomepage && (
                          <span className="ml-2"><Badge variant="info" size="sm">
                            Home
                          </Badge></span>
                        )}
                      </p>
                      <p className="text-xs text-text-muted">{page.slug}</p>
                    </div>
                  </div>
                  <Badge
                    variant={page.isPublished ? "success" : "default"}
                    dot
                  >
                    {page.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Settings placeholder */}
        {activeTab === "settings" && (
          <Card padding="md">
            <p className="text-sm text-text-muted">
              Website settings will be available here — SEO, subdomain, custom domain, danger zone.
            </p>
          </Card>
        )}
      </div>
    </>
  );
}
