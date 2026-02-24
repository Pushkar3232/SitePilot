"use client";

import { useState } from "react";
import { use } from "react";
import {
  Monitor,
  Tablet,
  Smartphone,
  Save,
  Eye,
  Upload,
  ChevronLeft,
  Plus,
  GripVertical,
  Trash2,
  Settings,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/atoms/Button";
import { Tabs } from "@/components/molecules/Tabs";
import Link from "next/link";

interface BuilderPageProps {
  params: Promise<{ websiteId: string }>;
}

export default function BuilderPage({ params }: BuilderPageProps) {
  const { websiteId } = use(params);
  const [viewport, setViewport] = useState("desktop");
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Mock blocks
  const [blocks] = useState([
    { id: "b1", type: "navbar", label: "Navigation" },
    { id: "b2", type: "hero", label: "Hero Section" },
    { id: "b3", type: "features", label: "Features" },
    { id: "b4", type: "cta", label: "Call to Action" },
    { id: "b5", type: "footer", label: "Footer" },
  ]);

  const viewportWidths: Record<string, string> = {
    desktop: "w-full",
    tablet: "w-[768px]",
    mobile: "w-[375px]",
  };

  return (
    <div className="flex h-screen bg-bg-dark overflow-hidden">
      {/* Left Panel — Block List */}
      <aside className="w-[260px] bg-bg-white border-r border-border-light flex flex-col shrink-0">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 h-14 border-b border-border-light">
          <Link
            href={`/dashboard/websites/${websiteId}`}
            className="p-1.5 rounded-lg text-text-muted hover:bg-bg-light hover:text-text-primary transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <span className="text-sm font-semibold text-text-primary truncate">
            Portfolio Site
          </span>
        </div>

        {/* Pages selector */}
        <div className="px-3 py-3 border-b border-border-light">
          <select className="w-full h-9 px-2 text-sm rounded-lg border border-border-light bg-bg-white text-text-primary">
            <option>Home</option>
            <option>About</option>
            <option>Contact</option>
          </select>
        </div>

        {/* Block list */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Blocks
            </span>
            <button className="p-1 rounded text-text-muted hover:bg-bg-light hover:text-text-primary transition-colors">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1">
            {blocks.map((block) => (
              <button
                key={block.id}
                onClick={() => setSelectedBlock(block.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left transition-all duration-150",
                  selectedBlock === block.id
                    ? "bg-bg-light text-text-primary font-medium shadow-sm"
                    : "text-text-secondary hover:bg-bg-light/60"
                )}
              >
                <GripVertical className="h-3.5 w-3.5 text-text-muted shrink-0" />
                <span className="truncate">{block.label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Center — Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <header className="flex items-center justify-between px-4 h-14 bg-bg-white border-b border-border-light shrink-0">
          {/* Viewport switcher */}
          <div className="flex items-center gap-1 bg-bg-light rounded-lg p-1">
            {[
              { value: "desktop", icon: <Monitor className="h-4 w-4" /> },
              { value: "tablet", icon: <Tablet className="h-4 w-4" /> },
              { value: "mobile", icon: <Smartphone className="h-4 w-4" /> },
            ].map((v) => (
              <button
                key={v.value}
                onClick={() => setViewport(v.value)}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  viewport === v.value
                    ? "bg-bg-white text-text-primary shadow-sm"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                {v.icon}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isDirty && (
              <Button variant="ghost" size="sm" leftIcon={<Save className="h-4 w-4" />}>
                Save
              </Button>
            )}
            <Button variant="secondary" size="sm" leftIcon={<Eye className="h-4 w-4" />}>
              Preview
            </Button>
            <Button size="sm" leftIcon={<Upload className="h-4 w-4" />}>
              Publish
            </Button>
          </div>
        </header>

        {/* Canvas area */}
        <div className="flex-1 overflow-auto p-6 flex justify-center">
          <div
            className={cn(
              "bg-white rounded-xl shadow-lg border border-border-light overflow-hidden transition-all duration-300 mx-auto",
              viewportWidths[viewport],
              viewport !== "desktop" && "max-w-full"
            )}
            style={{ minHeight: "600px" }}
          >
            {/* Rendered blocks */}
            {blocks.map((block) => (
              <div
                key={block.id}
                onClick={() => { setSelectedBlock(block.id); setIsDirty(true); }}
                className={cn(
                  "relative px-6 py-12 border-b border-border-light/50 cursor-pointer transition-all",
                  "hover:ring-2 hover:ring-accent-red/20 hover:ring-inset",
                  selectedBlock === block.id && "ring-2 ring-accent-red/40 ring-inset bg-accent-red/[0.02]"
                )}
              >
                <div className="text-center text-text-muted text-sm">
                  {block.label}
                </div>
                {selectedBlock === block.id && (
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button className="p-1 rounded bg-bg-white border border-border-light text-text-muted hover:text-text-primary">
                      <Settings className="h-3.5 w-3.5" />
                    </button>
                    <button className="p-1 rounded bg-bg-white border border-border-light text-red-500 hover:text-red-700">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Properties */}
      <aside className="w-[300px] bg-bg-white border-l border-border-light flex flex-col shrink-0">
        <div className="px-4 h-14 flex items-center border-b border-border-light">
          <h3 className="text-sm font-semibold text-text-primary">
            {selectedBlock ? "Block Settings" : "Page Settings"}
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {selectedBlock ? (
            <div className="space-y-4">
              <p className="text-xs text-text-muted">
                Editing: {blocks.find((b) => b.id === selectedBlock)?.label}
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-text-muted block mb-1">Heading</label>
                  <input
                    type="text"
                    defaultValue="Welcome to my site"
                    className="w-full h-9 px-3 text-sm rounded-lg border border-border-light bg-bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-red/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted block mb-1">Subheading</label>
                  <textarea
                    defaultValue="A short description about what I do"
                    rows={3}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border-light bg-bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-red/30 resize-y"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted block mb-1">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" defaultValue="#F5F5F5" className="h-9 w-9 rounded cursor-pointer" />
                    <input
                      type="text"
                      defaultValue="#F5F5F5"
                      className="flex-1 h-9 px-3 text-sm rounded-lg border border-border-light bg-bg-white text-text-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-text-muted">
                Select a block to edit its properties, or configure page-level settings below.
              </p>
              <div>
                <label className="text-xs font-medium text-text-muted block mb-1">Page Title</label>
                <input
                  type="text"
                  defaultValue="Home"
                  className="w-full h-9 px-3 text-sm rounded-lg border border-border-light bg-bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-red/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted block mb-1">SEO Description</label>
                <textarea
                  defaultValue="My portfolio website"
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border-light bg-bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-red/30 resize-y"
                />
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
