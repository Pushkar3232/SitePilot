"use client";

import { useState } from "react";
import { UserPlus, MoreHorizontal, Trash2, Shield } from "lucide-react";
import { DashboardTopbar } from "@/components/organisms/DashboardTopbar";
import { Card } from "@/components/molecules/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Avatar } from "@/components/atoms/Avatar";
import { Modal } from "@/components/molecules/Modal";
import { DropdownMenu } from "@/components/molecules/DropdownMenu";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { Skeleton } from "@/components/atoms/Skeleton";
import Input from "@/components/atoms/Input/Input";
import { Select } from "@/components/atoms/Select";
import { useTeamApi, useInviteTeamMemberApi, apiFetch } from "@/hooks/use-api";

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "developer", label: "Developer" },
  { value: "viewer", label: "Viewer" },
];

const roleBadgeVariant: Record<string, "default" | "info" | "success" | "warning"> = {
  owner: "default",
  admin: "info",
  editor: "success",
  developer: "warning",
  viewer: "default",
};

export default function TeamPage() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [removeId, setRemoveId] = useState<string | null>(null);

  const { data: teamData, loading, error, refetch } = useTeamApi();
  const { mutate: invite, loading: inviting } = useInviteTeamMemberApi({
    onSuccess: () => {
      setInviteEmail("");
      setInviteRole("editor");
      setShowInviteModal(false);
      refetch();
    },
  });

  const members = teamData?.members ?? [];
  const invitations = teamData?.invitations ?? [];

  // Combine members and pending invitations for display
  const allMembers = [
    ...members.map((m) => ({
      id: m.id,
      name: m.full_name || m.email.split("@")[0],
      email: m.email,
      role: m.role as "owner" | "admin" | "editor" | "developer" | "viewer",
      status: "active" as const,
      avatarUrl: m.avatar_url,
    })),
    ...invitations
      .filter((inv) => inv.status === "pending")
      .map((inv) => ({
        id: inv.id,
        name: inv.email.split("@")[0],
        email: inv.email,
        role: inv.role as "owner" | "admin" | "editor" | "developer" | "viewer",
        status: "invited" as const,
        avatarUrl: undefined,
      })),
  ];

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    invite({ email: inviteEmail.trim(), role: inviteRole });
  };

  const handleRemove = async () => {
    if (!removeId) return;
    try {
      await apiFetch(`/api/team/${removeId}`, { method: 'DELETE' });
      setRemoveId(null);
      refetch();
    } catch {
      setRemoveId(null);
    }
  };

  return (
    <>
      <DashboardTopbar pageTitle="Team" />

      <div className="p-6 space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              {allMembers.length} team member{allMembers.length !== 1 && "s"}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">Manage who has access to your workspace.</p>
          </div>
          <Button
            size="sm"
            leftIcon={<UserPlus className="h-4 w-4" />}
            onClick={() => setShowInviteModal(true)}
          >
            Invite
          </Button>
        </div>

        {/* Members Table */}
        {loading ? (
          <Card padding="none">
            <div className="divide-y divide-border-light">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </Card>
        ) : error ? (
          <Card padding="md">
            <p className="text-sm text-text-muted text-center">{error}</p>
            <div className="flex justify-center mt-3">
              <Button variant="secondary" size="sm" onClick={refetch}>Retry</Button>
            </div>
          </Card>
        ) : (
          <Card padding="none">
            <div className="divide-y divide-border-light">
              {allMembers.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar fallback={m.name.split(" ").map(n => n[0]).join("").toUpperCase()} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-text-primary">{m.name}</p>
                        {m.status === "invited" && (
                          <Badge variant="warning" size="sm">Invited</Badge>
                        )}
                      </div>
                      <p className="text-xs text-text-muted">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={roleBadgeVariant[m.role] ?? "default"}>
                      <Shield className="h-3 w-3 mr-1 inline" />
                      {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                    </Badge>
                    {m.role !== "owner" && (
                      <DropdownMenu
                        trigger={
                          <button className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-bg-light transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        }
                        items={[
                          { label: "Remove", onClick: () => setRemoveId(m.id), variant: "danger" },
                        ]}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Team Member"
        description="Send an invite link via email."
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="colleague@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <Select
            label="Role"
            options={roleOptions}
            value={inviteRole}
            onChange={(val) => setInviteRole(val)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowInviteModal(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={!inviteEmail.trim()} isLoading={inviting}>
              Send Invite
            </Button>
          </div>
        </div>
      </Modal>

      {/* Remove Confirm */}
      <ConfirmDialog
        isOpen={!!removeId}
        onCancel={() => setRemoveId(null)}
        onConfirm={handleRemove}
        title="Remove Member"
        description="This person will lose access to the workspace immediately."
        confirmLabel="Remove"
        variant="danger"
      />
    </>
  );
}
