"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Globe } from "lucide-react";
import { DashboardTopbar } from "@/components/organisms/DashboardTopbar";
import { WebsiteCard } from "@/components/organisms/WebsiteCard";
import { SearchInput } from "@/components/molecules/SearchInput";
import { Button } from "@/components/atoms/Button";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Modal } from "@/components/molecules/Modal";
import Input from "@/components/atoms/Input/Input";
import { Skeleton } from "@/components/atoms/Skeleton";
import { Card } from "@/components/molecules/Card";
import { useWebsitesApi, useCreateWebsiteApi } from "@/hooks/use-api";
import type { Website } from "@/types/website.types";

export default function WebsitesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWebsiteName, setNewWebsiteName] = useState("");

  const { data, loading, error, refetch } = useWebsitesApi();
  const { mutate: createWebsite, loading: isCreating } = useCreateWebsiteApi({
    onSuccess: () => {
      setShowCreateModal(false);
      setNewWebsiteName("");
      refetch();
    },
  });

  const websites: Website[] = (data?.websites ?? []).map((w) => ({
    id: w.id,
    tenant_id: "",
    name: w.name,
    subdomain: w.subdomain,
    custom_domain: w.custom_domain ?? undefined,
    status: w.status,
    branding_config: {
      primary_color: (w.branding_config?.primary_color as string) ?? "#0D0D0D",
      secondary_color: (w.branding_config?.secondary_color as string) ?? "#F5F5F5",
      accent_color: (w.branding_config?.accent_color as string) ?? "#8B1A1A",
      font_heading: (w.branding_config?.font_heading as string) ?? "Inter",
      font_body: (w.branding_config?.font_body as string) ?? "Inter",
    },
    created_at: w.created_at,
    updated_at: w.updated_at,
    published_at: w.last_deployed_at ?? undefined,
  }));

  const filteredWebsites = websites.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newWebsiteName.trim()) return;
    await createWebsite({ name: newWebsiteName.trim() });
  };

  return (
    <>
      <DashboardTopbar pageTitle="Websites" />

      <div className="p-6">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <SearchInput
            placeholder="Search websites..."
            value={search}
            onChange={setSearch}
            className="w-full sm:w-72"
          />
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            New Website
          </Button>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} padding="md">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={<Globe className="h-12 w-12" />}
            title="Failed to load websites"
            description={error}
            action={{ label: "Retry", onClick: refetch }}
          />
        ) : filteredWebsites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredWebsites.map((website) => (
              <WebsiteCard
                key={website.id}
                website={website}
                canEdit
                canDelete
                onEdit={(w) => router.push(`/dashboard/websites/${w.id}/builder`)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Globe className="h-12 w-12" />}
            title={search ? "No matching websites" : "No websites yet"}
            description={search ? "Try a different search term." : "Create your first website to get started."}
            action={
              search
                ? { label: "Clear Search", onClick: () => setSearch("") }
                : { label: "Create Website", onClick: () => setShowCreateModal(true) }
            }
          />
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Website"
        description="Give your website a name. You can change it later."
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Website Name"
            placeholder="My Awesome Website"
            value={newWebsiteName}
            onChange={(e) => setNewWebsiteName(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              isLoading={isCreating}
              disabled={!newWebsiteName.trim()}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
