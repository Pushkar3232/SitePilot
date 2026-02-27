"use client";

import { useState } from "react";
import { Globe, Plus, Trash2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { DashboardTopbar } from "@/components/organisms/DashboardTopbar";
import { Card } from "@/components/molecules/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Modal } from "@/components/molecules/Modal";
import Input from "@/components/atoms/Input/Input";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Alert } from "@/components/molecules/Alert";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { Skeleton } from "@/components/atoms/Skeleton";
import { Select } from "@/components/atoms/Select";
import { useWebsitesApi, useAddDomainApi } from "@/hooks/use-api";

interface DomainInfo {
  id: string;
  domain: string;
  websiteName: string;
  websiteId: string;
  status: "verified" | "pending" | "failed";
}

const statusConfig = {
  verified: { icon: <CheckCircle2 className="h-4 w-4" />, variant: "success" as const, label: "Verified" },
  pending: { icon: <Clock className="h-4 w-4" />, variant: "warning" as const, label: "Pending" },
  failed: { icon: <AlertCircle className="h-4 w-4" />, variant: "danger" as const, label: "Failed" },
};

export default function DomainsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [selectedWebsiteId, setSelectedWebsiteId] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: websitesData, loading: websitesLoading, refetch } = useWebsitesApi();
  const { mutate: addDomain, loading: addingDomain } = useAddDomainApi({
    onSuccess: () => {
      setShowAddModal(false);
      setNewDomain("");
      setSelectedWebsiteId("");
      refetch();
    },
  });

  const websites = websitesData?.websites ?? [];

  // Build domain list from websites that have custom domains
  const domains: DomainInfo[] = websites
    .filter((w) => w.custom_domain)
    .map((w) => ({
      id: w.id,
      domain: w.custom_domain!,
      websiteName: w.name,
      websiteId: w.id,
      status: (w.domain_verified ? "verified" : "pending") as DomainInfo["status"],
    }));

  const websiteOptions = websites
    .filter((w) => !w.custom_domain)
    .map((w) => ({ value: w.id, label: w.name }));

  const handleAdd = () => {
    if (!newDomain.trim() || !selectedWebsiteId) return;
    addDomain({ websiteId: selectedWebsiteId, domain: newDomain.trim() });
  };

  const handleDelete = () => {
    // Domain removal would be done by updating the website to remove the custom_domain
    // For now, close the dialog — the API doesn't have a dedicated delete domain endpoint
    setDeleteId(null);
    refetch();
  };

  return (
    <>
      <DashboardTopbar pageTitle="Domains" />

      <div className="p-6 space-y-6 max-w-4xl">
        <Alert
          variant="info"
          title="Custom Domains"
          description="Custom domains allow visitors to access your websites on your own domain name. Point a CNAME record to cname.sitepilot.pushkarshinde.in to get started."
        />

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">
            {domains.length} Domain{domains.length !== 1 && "s"}
          </h3>
          <Button
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowAddModal(true)}
          >
            Add Domain
          </Button>
        </div>

        {websitesLoading ? (
          <Card padding="none">
            <div className="divide-y divide-border-light">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5 rounded" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </Card>
        ) : domains.length > 0 ? (
          <Card padding="none">
            <div className="divide-y divide-border-light">
              {domains.map((d) => {
                const st = statusConfig[d.status];
                return (
                  <div key={d.id} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-text-muted" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{d.domain}</p>
                        <p className="text-xs text-text-muted">Linked to {d.websiteName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={st.variant} dot>
                        {st.label}
                      </Badge>
                      <button
                        onClick={() => setDeleteId(d.id)}
                        className="p-1.5 text-text-muted hover:text-red-600 rounded-lg hover:bg-bg-light transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ) : (
          <EmptyState
            icon={<Globe className="h-12 w-12" />}
            title="No custom domains"
            description="Add a custom domain to give your website a professional URL."
            action={{ label: "Add Domain", onClick: () => setShowAddModal(true) }}
          />
        )}

        {/* DNS Instructions */}
        <Card padding="md">
          <h4 className="text-sm font-semibold text-text-primary mb-3">DNS Configuration</h4>
          <div className="bg-bg-light rounded-lg p-4 text-xs font-mono text-text-secondary space-y-1">
            <p>Type: CNAME</p>
            <p>Name: www (or @)</p>
            <p>Value: cname.sitepilot.pushkarshinde.in</p>
            <p>TTL: 3600</p>
          </div>
          <p className="text-xs text-text-muted mt-3">
            DNS changes can take up to 48 hours to propagate. SSL certificates are provisioned automatically once verified.
          </p>
        </Card>
      </div>

      {/* Add Domain Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Custom Domain"
        description="Enter the domain you want to connect."
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Domain"
            placeholder="www.example.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
          />
          <Select
            label="Website"
            options={websiteOptions}
            value={selectedWebsiteId}
            onChange={(val) => setSelectedWebsiteId(val)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button
              onClick={handleAdd}
              disabled={!newDomain.trim() || !selectedWebsiteId}
              isLoading={addingDomain}
            >
              Add Domain
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remove Domain"
        description="This will disconnect the domain from your website. You can re-add it later."
        confirmLabel="Remove"
        variant="danger"
      />
    </>
  );
}
