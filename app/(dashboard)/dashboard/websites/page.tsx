"use client";

import { useState } from "react";
import { Plus, Globe } from "lucide-react";
import { DashboardTopbar } from "@/components/organisms/DashboardTopbar";
import { WebsiteCard } from "@/components/organisms/WebsiteCard";
import { SearchInput } from "@/components/molecules/SearchInput";
import { Button } from "@/components/atoms/Button";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Modal } from "@/components/molecules/Modal";
import Input from "@/components/atoms/Input/Input";
import type { Website } from "@/types/website.types";

// Mock data
const MOCK_WEBSITES: Website[] = [
  {
    id: "1",
    tenant_id: "t1",
    name: "Portfolio Site",
    subdomain: "john-portfolio-x7k2",
    status: "published",
    branding_config: {
      primary_color: "#111111",
      secondary_color: "#F5F5F5",
      accent_color: "#8B1A1A",
      font_heading: "Inter",
      font_body: "Inter",
    },
    created_at: "2025-12-01T10:00:00Z",
    updated_at: "2026-02-24T08:30:00Z",
    published_at: "2026-02-20T12:00:00Z",
  },
  {
    id: "2",
    tenant_id: "t1",
    name: "Coffee Shop",
    subdomain: "beans-cafe-r3m5",
    status: "draft",
    branding_config: {
      primary_color: "#5D3A1A",
      secondary_color: "#FFF8F0",
      accent_color: "#D4A574",
      font_heading: "Sora",
      font_body: "Inter",
    },
    created_at: "2026-01-15T14:00:00Z",
    updated_at: "2026-02-23T16:45:00Z",
  },
  {
    id: "3",
    tenant_id: "t1",
    name: "Tech Blog",
    subdomain: "tech-today-p8n1",
    custom_domain: "www.techtoday.com",
    status: "published",
    branding_config: {
      primary_color: "#0F172A",
      secondary_color: "#F8FAFC",
      accent_color: "#3B82F6",
      font_heading: "Inter",
      font_body: "Inter",
    },
    created_at: "2025-11-10T09:00:00Z",
    updated_at: "2026-02-21T11:00:00Z",
    published_at: "2026-02-21T11:00:00Z",
  },
];

export default function WebsitesPage() {
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWebsiteName, setNewWebsiteName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const filteredWebsites = MOCK_WEBSITES.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    setIsCreating(true);
    // TODO: POST /api/websites
    await new Promise((r) => setTimeout(r, 1000));
    setIsCreating(false);
    setShowCreateModal(false);
    setNewWebsiteName("");
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

        {/* Grid */}
        {filteredWebsites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredWebsites.map((website) => (
              <WebsiteCard
                key={website.id}
                website={website}
                canEdit
                canDelete
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Globe className="h-12 w-12" />}
            title="No websites yet"
            description="Create your first website to get started."
            action={{
              label: "Create Website",
              onClick: () => setShowCreateModal(true),
            }}
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
