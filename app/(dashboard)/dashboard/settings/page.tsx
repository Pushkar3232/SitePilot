"use client";

import { useState, useEffect } from "react";
import { Building2, Bell, Trash2, Shield } from "lucide-react";
import { DashboardTopbar } from "@/components/organisms/DashboardTopbar";
import { Card } from "@/components/molecules/Card";
import { Button } from "@/components/atoms/Button";
import Input from "@/components/atoms/Input/Input";
import { Textarea } from "@/components/atoms/Textarea";
import { Toggle } from "@/components/atoms/Toggle";
import { Divider } from "@/components/atoms/Divider";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { Skeleton } from "@/components/atoms/Skeleton";
import { useAuthStore } from "@/store/auth.store";
import { apiFetch } from "@/hooks/use-api";

export default function SettingsPage() {
  const { tenant } = useAuthStore();

  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteOrg, setShowDeleteOrg] = useState(false);

  // Populate from tenant data
  useEffect(() => {
    if (tenant) {
      setOrgName(tenant.name ?? "");
      setOrgSlug(tenant.slug ?? "");
    }
  }, [tenant]);

  const handleSave = async () => {
    if (!tenant) return;
    setIsSaving(true);
    try {
      await apiFetch(`/api/tenants/${tenant.id}`, {
        method: "PUT",
        body: { name: orgName, slug: orgSlug },
      });
    } catch {
      // toast or handle error
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOrg = async () => {
    if (!tenant) return;
    try {
      await apiFetch(`/api/tenants/${tenant.id}`, { method: "DELETE" });
      setShowDeleteOrg(false);
      window.location.href = "/login";
    } catch {
      setShowDeleteOrg(false);
    }
  };

  if (!tenant) {
    return (
      <>
        <DashboardTopbar pageTitle="Settings" />
        <div className="p-6 space-y-6 max-w-3xl">
          <Card padding="md">
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardTopbar pageTitle="Settings" />

      <div className="p-6 space-y-6 max-w-3xl">
        {/* Organization Settings */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-text-muted" />
            <h3 className="text-sm font-semibold text-text-primary">Organization</h3>
          </div>
          <div className="space-y-4">
            <Input
              label="Organization Name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
            <Input
              label="Slug"
              value={orgSlug}
              onChange={(e) => setOrgSlug(e.target.value)}
              hint="Used in your dashboard URL."
            />
            <Textarea
              label="Description"
              value={orgDescription}
              onChange={(e) => setOrgDescription(e.target.value)}
              rows={3}
            />
          </div>
        </Card>

        {/* Notifications */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-text-muted" />
            <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">Email Notifications</p>
                <p className="text-xs text-text-muted">Receive updates about your websites and team.</p>
              </div>
              <Toggle checked={emailNotifications} onChange={setEmailNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">Weekly Digest</p>
                <p className="text-xs text-text-muted">Get a summary of analytics every Monday.</p>
              </div>
              <Toggle checked={weeklyDigest} onChange={setWeeklyDigest} />
            </div>
          </div>
        </Card>

        {/* Security placeholder */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-text-muted" />
            <h3 className="text-sm font-semibold text-text-primary">Security</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Change Password</p>
              <p className="text-xs text-text-muted">Update your account password.</p>
            </div>
            <Button variant="secondary" size="sm">Change</Button>
          </div>
        </Card>

        <Divider />

        {/* Save button */}
        <div className="flex items-center justify-between">
          <Button onClick={handleSave} isLoading={isSaving}>
            Save Settings
          </Button>
        </div>

        <Divider />

        {/* Danger zone */}
        <Card padding="md" className="border-red-200">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="h-5 w-5 text-red-500" />
            <h3 className="text-sm font-semibold text-red-600">Danger Zone</h3>
          </div>
          <p className="text-sm text-text-muted mb-4">
            Deleting your organization will permanently remove all websites, pages, and data.
            This action cannot be undone.
          </p>
          <Button variant="danger" onClick={() => setShowDeleteOrg(true)}>
            Delete Organization
          </Button>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={showDeleteOrg}
        onCancel={() => setShowDeleteOrg(false)}
        onConfirm={handleDeleteOrg}
        title="Delete Organization"
        description="Are you absolutely sure? All websites, pages, team members, and data will be permanently deleted."
        confirmLabel="Delete Forever"
        variant="danger"
      />
    </>
  );
}
