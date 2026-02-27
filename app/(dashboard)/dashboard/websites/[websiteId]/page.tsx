"use client";

import { useState } from "react";
import Link from "next/link";
import { use } from "react";
import { Globe, Pencil, ExternalLink, ArrowLeft, Trash2, FileText, Eye, Plus } from "lucide-react";
import { DashboardTopbar } from "@/components/organisms/DashboardTopbar";
import { Card } from "@/components/molecules/Card";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Tabs } from "@/components/molecules/Tabs";
import { Skeleton } from "@/components/atoms/Skeleton";
import { Modal } from "@/components/molecules/Modal";
import Input from "@/components/atoms/Input/Input";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { useWebsiteDetailApi, useDeleteWebsiteApi, useCreatePageApi } from "@/hooks/use-api";
import { apiFetch } from "@/hooks/use-api";

interface WebsiteDetailPageProps {
  params: Promise<{ websiteId: string }>;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function WebsiteDetailPage({ params }: WebsiteDetailPageProps) {
  const { websiteId } = use(params);
  const [activeTab, setActiveTab] = useState("pages");
  const [showCreatePageModal, setShowCreatePageModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);

  const { data, loading, error, refetch } = useWebsiteDetailApi(websiteId);
  const { mutate: deleteWebsite, loading: deleting } = useDeleteWebsiteApi(websiteId, {
    onSuccess: () => {
      window.location.href = "/dashboard/websites";
    },
  });
  const { mutate: createPage, loading: creatingPage } = useCreatePageApi({
    onSuccess: () => {
      setShowCreatePageModal(false);
      setNewPageTitle("");
      setNewPageSlug("");
      refetch();
    },
  });

  const website = data?.website;

  const handleCreatePage = async () => {
    if (!newPageTitle.trim()) return;
    const slug = newPageSlug.trim() || `/${newPageTitle.trim().toLowerCase().replace(/\s+/g, "-")}`;
    await createPage({ websiteId, title: newPageTitle.trim(), slug });
  };

  const handleDeletePage = async () => {
    if (!deletingPageId) return;
    try {
      await apiFetch(`/api/pages/${deletingPageId}`, { method: 'DELETE' });
      setDeletingPageId(null);
      refetch();
    } catch {
      // error handling
    }
  };

  if (loading) {
    return (
      <>
        <DashboardTopbar pageTitle="Loading..." breadcrumb="Websites" />
        <div className="p-6 space-y-6">
          <Skeleton className="h-4 w-32" />
          <Card padding="md">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
          </Card>
          <Skeleton className="h-10 w-64" />
          <Card padding="none">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-border-light last:border-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </Card>
        </div>
      </>
    );
  }

  if (error || !website) {
    return (
      <>
        <DashboardTopbar pageTitle="Error" breadcrumb="Websites" />
        <div className="p-6">
          <Card padding="md" className="text-center py-10">
            <p className="text-sm text-text-muted">{error || "Website not found"}</p>
            <Link href="/dashboard/websites">
              <Button variant="secondary" className="mt-4">Back to Websites</Button>
            </Link>
          </Card>
        </div>
      </>
    );
  }

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
                  <Badge
                    variant={website.status === "published" ? "success" : website.status === "archived" ? "warning" : "default"}
                    dot
                  >
                    {website.status.charAt(0).toUpperCase() + website.status.slice(1)}
                  </Badge>
                </div>
                <p className="text-sm text-text-muted mt-0.5">
                  {website.subdomain}.sitepilot.pushkarshinde.in
                  {website.custom_domain && ` · ${website.custom_domain}`}
                  {" · Updated "}
                  {formatDate(website.updated_at)}
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
                onClick={() =>
                  window.open(
                    website.custom_domain
                      ? `https://${website.custom_domain}`
                      : `https://${website.subdomain}.sitepilot.pushkarshinde.in`,
                    "_blank"
                  )
                }
              >
                View Live
              </Button>
              <Button
                variant="danger"
                leftIcon={<Trash2 className="h-4 w-4" />}
                onClick={() => setShowDeleteConfirm(true)}
              >
                Archive
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
          <>
            <div className="flex justify-end">
              <Button
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setShowCreatePageModal(true)}
              >
                New Page
              </Button>
            </div>
            <Card padding="none">
              <div className="divide-y divide-border-light">
                {website.pages.length > 0 ? (
                  website.pages.map((page) => (
                    <div
                      key={page.id}
                      className="flex items-center justify-between px-5 py-4 hover:bg-bg-light/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-text-muted" />
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {page.title}
                            {page.is_homepage && (
                              <span className="ml-2"><Badge variant="info" size="sm">
                                Home
                              </Badge></span>
                            )}
                          </p>
                          <p className="text-xs text-text-muted">{page.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={page.status === "published" ? "success" : "default"}
                          dot
                        >
                          {page.status === "published" ? "Published" : "Draft"}
                        </Badge>
                        {!page.is_homepage && (
                          <button
                            onClick={() => setDeletingPageId(page.id)}
                            className="p-1.5 text-text-muted hover:text-red-600 rounded-lg hover:bg-bg-light transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-center text-sm text-text-muted">
                    No pages yet. Create one to get started.
                  </div>
                )}
              </div>
            </Card>
          </>
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

      {/* Create Page Modal */}
      <Modal
        isOpen={showCreatePageModal}
        onClose={() => setShowCreatePageModal(false)}
        title="Create New Page"
        description="Add a new page to your website."
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Page Title"
            placeholder="About Us"
            value={newPageTitle}
            onChange={(e) => setNewPageTitle(e.target.value)}
          />
          <Input
            label="Slug"
            placeholder="/about"
            value={newPageSlug}
            onChange={(e) => setNewPageSlug(e.target.value)}
            hint="Leave empty to auto-generate from title."
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCreatePageModal(false)}>Cancel</Button>
            <Button onClick={handleCreatePage} isLoading={creatingPage} disabled={!newPageTitle.trim()}>Create</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Website Confirm */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteWebsite()}
        title="Archive Website"
        description="This will archive the website. It can be restored later."
        confirmLabel="Archive"
        variant="danger"
      />

      {/* Delete Page Confirm */}
      <ConfirmDialog
        isOpen={!!deletingPageId}
        onCancel={() => setDeletingPageId(null)}
        onConfirm={handleDeletePage}
        title="Delete Page"
        description="This will permanently delete this page and all its components."
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}
