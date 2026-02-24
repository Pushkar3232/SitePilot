"use client";

import Link from "next/link";
import { ExternalLink, MoreVertical, Pencil, Trash2, Copy, Eye } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Card } from "@/components/molecules/Card";
import { DropdownMenu } from "@/components/molecules/DropdownMenu";
import { formatRelativeTime } from "@/utils/format";
import type { Website } from "@/types/website.types";
import type { BadgeVariant } from "@/components/atoms/Badge/Badge";

interface WebsiteCardProps {
  website: Website;
  onEdit?: (website: Website) => void;
  onDelete?: (website: Website) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const statusMap: Record<string, { label: string; variant: BadgeVariant }> = {
  published: { label: "Published", variant: "success" },
  draft: { label: "Draft", variant: "default" },
  archived: { label: "Archived", variant: "warning" },
};

export default function WebsiteCard({
  website,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = false,
}: WebsiteCardProps) {
  const status = statusMap[website.status] || statusMap.draft;

  return (
    <Card hover padding="none">
      {/* Thumbnail */}
      <div className="relative h-40 bg-bg-dark overflow-hidden rounded-t-2xl">
        <div className="absolute inset-0 flex items-center justify-center text-text-muted text-sm">
          Preview
        </div>
        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <Badge variant={status.variant} dot>
            {status.label}
          </Badge>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text-primary truncate">
              {website.name}
            </h3>
            <p className="text-xs text-text-muted mt-0.5 truncate">
              {website.subdomain}.sitepilot.io
            </p>
          </div>

          <DropdownMenu
            trigger={
              <button className="p-1 rounded-lg text-text-muted hover:bg-bg-light hover:text-text-primary transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
            }
            items={[
              {
                label: "Open Builder",
                icon: <Pencil className="h-4 w-4" />,
                onClick: () => onEdit?.(website),
              },
              {
                label: "View Live",
                icon: <Eye className="h-4 w-4" />,
                onClick: () => window.open(`https://${website.subdomain}.sitepilot.io`, "_blank"),
              },
              {
                label: "Copy URL",
                icon: <Copy className="h-4 w-4" />,
                onClick: () => navigator.clipboard.writeText(`https://${website.subdomain}.sitepilot.io`),
              },
              ...(canDelete
                ? [
                    {
                      label: "Delete",
                      icon: <Trash2 className="h-4 w-4" />,
                      onClick: () => onDelete?.(website),
                      variant: "danger" as const,
                    },
                  ]
                : []),
            ]}
          />
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
          <span>Updated {formatRelativeTime(website.updated_at)}</span>
          {website.custom_domain && (
            <span className="flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              {website.custom_domain}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
