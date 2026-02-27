"use client";

import { useState, useEffect } from "react";
import { Palette, Type, Image, RotateCcw } from "lucide-react";
import { DashboardTopbar } from "@/components/organisms/DashboardTopbar";
import { Card } from "@/components/molecules/Card";
import { Button } from "@/components/atoms/Button";
import { Divider } from "@/components/atoms/Divider";
import { Skeleton } from "@/components/atoms/Skeleton";
import { useWebsitesApi, apiFetch } from "@/hooks/use-api";

const PRESET_COLORS = [
  "#8B1A1A", "#0F172A", "#1E3A5F", "#14532D",
  "#7C3AED", "#EA580C", "#0891B2", "#DB2777",
];

const FONTS = [
  "Inter", "Sora", "Poppins", "DM Sans", "Outfit", "Space Grotesk", "Playfair Display", "Lora",
];

const DEFAULT_BRANDING = {
  primary_color: "#8B1A1A",
  secondary_color: "#F5F5F5",
  accent_color: "#0D0D0D",
  heading_font: "Inter",
  body_font: "Inter",
};

export default function BrandingPage() {
  const { data: websitesData, loading } = useWebsitesApi();
  const websites = websitesData?.websites ?? [];

  // Use the first website's branding config
  const website = websites?.[0];
  const savedBranding = website?.branding_config ?? {};

  const [primary, setPrimary] = useState(DEFAULT_BRANDING.primary_color);
  const [secondary, setSecondary] = useState(DEFAULT_BRANDING.secondary_color);
  const [accent, setAccent] = useState(DEFAULT_BRANDING.accent_color);
  const [headingFont, setHeadingFont] = useState(DEFAULT_BRANDING.heading_font);
  const [bodyFont, setBodyFont] = useState(DEFAULT_BRANDING.body_font);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>("");

  // Populate branding from selected website
  useEffect(() => {
    if (websites?.length && !selectedWebsiteId) {
      setSelectedWebsiteId(websites[0].id);
    }
  }, [websites, selectedWebsiteId]);

  useEffect(() => {
    const w = websites?.find((ws: any) => ws.id === selectedWebsiteId);
    const b = w?.branding_config ?? {};
    setPrimary(b.primary_color ?? DEFAULT_BRANDING.primary_color);
    setSecondary(b.secondary_color ?? DEFAULT_BRANDING.secondary_color);
    setAccent(b.accent_color ?? DEFAULT_BRANDING.accent_color);
    setHeadingFont(b.heading_font ?? DEFAULT_BRANDING.heading_font);
    setBodyFont(b.body_font ?? DEFAULT_BRANDING.body_font);
  }, [selectedWebsiteId, websites]);

  const handleSave = async () => {
    if (!selectedWebsiteId) return;
    setIsSaving(true);
    try {
      await apiFetch(`/api/websites/${selectedWebsiteId}`, {
        method: "PUT",
        body: {
          branding_config: {
            primary_color: primary,
            secondary_color: secondary,
            accent_color: accent,
            heading_font: headingFont,
            body_font: bodyFont,
          },
        },
      });
    } catch {
      // handle error
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPrimary(DEFAULT_BRANDING.primary_color);
    setSecondary(DEFAULT_BRANDING.secondary_color);
    setAccent(DEFAULT_BRANDING.accent_color);
    setHeadingFont(DEFAULT_BRANDING.heading_font);
    setBodyFont(DEFAULT_BRANDING.body_font);
  };

  if (loading) {
    return (
      <>
        <DashboardTopbar pageTitle="Branding" />
        <div className="p-6 space-y-6 max-w-3xl">
          <Card padding="md"><Skeleton className="h-40 w-full" /></Card>
          <Card padding="md"><Skeleton className="h-32 w-full" /></Card>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardTopbar pageTitle="Branding" />

      <div className="p-6 space-y-6 max-w-3xl">
        {/* Website selector */}
        {websites && websites.length > 1 && (
          <div>
            <label className="text-xs font-medium text-text-muted block mb-2">Website</label>
            <select
              value={selectedWebsiteId}
              onChange={(e) => setSelectedWebsiteId(e.target.value)}
              className="h-10 px-3 text-sm rounded-lg border border-border-light bg-bg-white text-text-primary w-full max-w-xs"
            >
              {websites.map((w: any) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Colors */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="h-5 w-5 text-text-muted" />
            <h3 className="text-sm font-semibold text-text-primary">Brand Colors</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { label: "Primary", value: primary, onChange: setPrimary },
              { label: "Secondary", value: secondary, onChange: setSecondary },
              { label: "Accent", value: accent, onChange: setAccent },
            ].map((c) => (
              <div key={c.label}>
                <label className="text-xs font-medium text-text-muted block mb-2">{c.label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={c.value}
                    onChange={(e) => c.onChange(e.target.value)}
                    className="h-10 w-10 rounded-lg cursor-pointer border border-border-light"
                  />
                  <input
                    type="text"
                    value={c.value}
                    onChange={(e) => c.onChange(e.target.value)}
                    className="flex-1 h-10 px-3 text-sm rounded-lg border border-border-light bg-bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-red/30"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Presets */}
          <div className="mt-4">
            <p className="text-xs text-text-muted mb-2">Preset colors</p>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setPrimary(color)}
                  className="h-8 w-8 rounded-full border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor: primary === color ? "#0D0D0D" : "transparent",
                  }}
                />
              ))}
            </div>
          </div>
        </Card>

        {/* Typography */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <Type className="h-5 w-5 text-text-muted" />
            <h3 className="text-sm font-semibold text-text-primary">Typography</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-medium text-text-muted block mb-2">Heading Font</label>
              <select
                value={headingFont}
                onChange={(e) => setHeadingFont(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-border-light bg-bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-red/30"
              >
                {FONTS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
              <p className="text-2xl mt-3 text-text-primary" style={{ fontFamily: headingFont }}>
                The quick brown fox
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted block mb-2">Body Font</label>
              <select
                value={bodyFont}
                onChange={(e) => setBodyFont(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-border-light bg-bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-red/30"
              >
                {FONTS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
              <p className="text-sm mt-3 text-text-secondary" style={{ fontFamily: bodyFont }}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
              </p>
            </div>
          </div>
        </Card>

        {/* Logo */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <Image className="h-5 w-5 text-text-muted" />
            <h3 className="text-sm font-semibold text-text-primary">Logo</h3>
          </div>
          <div className="border-2 border-dashed border-border-light rounded-xl p-8 text-center hover:border-accent-red/30 transition-colors cursor-pointer">
            <Image className="h-10 w-10 mx-auto text-text-muted mb-3" />
            <p className="text-sm text-text-secondary">
              Drag & drop your logo, or <span className="text-accent-red font-medium">browse</span>
            </p>
            <p className="text-xs text-text-muted mt-1">SVG, PNG, or JPG — max 2MB</p>
          </div>
        </Card>

        <Divider />

        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            Save Branding
          </Button>
        </div>
      </div>
    </>
  );
}
