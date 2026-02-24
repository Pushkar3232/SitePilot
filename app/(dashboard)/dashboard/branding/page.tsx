"use client";

import { useState } from "react";
import { Palette, Type, Image, RotateCcw } from "lucide-react";
import { DashboardTopbar } from "@/components/organisms/DashboardTopbar";
import { Card } from "@/components/molecules/Card";
import { Button } from "@/components/atoms/Button";
import Input from "@/components/atoms/Input/Input";
import { Divider } from "@/components/atoms/Divider";

const PRESET_COLORS = [
  "#8B1A1A", "#0F172A", "#1E3A5F", "#14532D",
  "#7C3AED", "#EA580C", "#0891B2", "#DB2777",
];

const FONTS = [
  "Inter", "Sora", "Poppins", "DM Sans", "Outfit", "Space Grotesk", "Playfair Display", "Lora",
];

export default function BrandingPage() {
  const [primary, setPrimary] = useState("#8B1A1A");
  const [secondary, setSecondary] = useState("#F5F5F5");
  const [accent, setAccent] = useState("#0D0D0D");
  const [headingFont, setHeadingFont] = useState("Inter");
  const [bodyFont, setBodyFont] = useState("Inter");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
  };

  return (
    <>
      <DashboardTopbar pageTitle="Branding" />

      <div className="p-6 space-y-6 max-w-3xl">
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
          <Button variant="secondary" leftIcon={<RotateCcw className="h-4 w-4" />}>
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
