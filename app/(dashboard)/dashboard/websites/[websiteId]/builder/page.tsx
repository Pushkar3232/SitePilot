"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { use } from "react";
import {
  Monitor, Tablet, Smartphone, Save, Eye, Upload, ChevronLeft, Plus,
  GripVertical, Trash2, Layers, LayoutGrid, Sparkles, PanelBottom,
  Grid3X3, ImageIcon, Type, LayoutList, MessageSquare, Users, BarChart3,
  MousePointer, DollarSign, Mail, HelpCircle, Play, Menu, EyeOff,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Skeleton } from "@/components/atoms/Skeleton";
import Link from "next/link";
import {
  useWebsiteDetailApi,
  useComponentsApi,
  usePublishWebsiteApi,
  useCreateVersionApi,
  apiFetch,
} from "@/hooks/use-api";

// ── Types ────────────────────────────────────────────────────────────────────

interface BuilderPageProps {
  params: Promise<{ websiteId: string }>;
}

interface PaletteItem {
  type: string;
  label: string;
  icon: React.ReactNode;
  category: string;
  defaultProps: Record<string, unknown>;
}

// ── Component Palette ────────────────────────────────────────────────────────

const PALETTE: PaletteItem[] = [
  { type: "navbar", label: "Navbar", icon: <Menu className="h-4 w-4" />, category: "Layout",
    defaultProps: { brand: "My Site", links: ["Home", "About", "Services", "Contact"], bg_color: "#ffffff", text_color: "#0d0d0d", cta_text: "Get Started" } },
  { type: "hero", label: "Hero", icon: <Sparkles className="h-4 w-4" />, category: "Layout",
    defaultProps: { heading: "Build Something Amazing", subheading: "Create beautiful websites in minutes with our powerful builder.", cta_primary: "Get Started", cta_secondary: "Learn More", bg_color: "#f8f8f8" } },
  { type: "footer", label: "Footer", icon: <PanelBottom className="h-4 w-4" />, category: "Layout",
    defaultProps: { brand: "My Site", tagline: "Building the web, one page at a time.", links: ["Home", "About", "Contact", "Privacy"], bg_color: "#0d0d0d", text_color: "#ffffff" } },
  { type: "features", label: "Features", icon: <Grid3X3 className="h-4 w-4" />, category: "Content",
    defaultProps: { heading: "Why Choose Us", subheading: "Everything you need to build great products.", columns: 3, items: [
      { icon: "⚡", title: "Fast & Reliable", description: "Built for performance and uptime." },
      { icon: "🎨", title: "Beautiful Design", description: "Polished UI right out of the box." },
      { icon: "🔒", title: "Secure by Default", description: "Enterprise-grade security built in." },
    ]} },
  { type: "rich_text", label: "Rich Text", icon: <Type className="h-4 w-4" />, category: "Content",
    defaultProps: { heading: "About This Section", content: "Add your content here. Tell your story, share your values, or explain your services.", align: "left" } },
  { type: "image_text", label: "Image + Text", icon: <LayoutList className="h-4 w-4" />, category: "Content",
    defaultProps: { heading: "Our Story", text: "We started with a simple idea: make it easy for anyone to build a professional website.", image_url: "", image_side: "right", cta_text: "Learn More" } },
  { type: "gallery", label: "Gallery", icon: <ImageIcon className="h-4 w-4" />, category: "Content",
    defaultProps: { heading: "Our Work", columns: 3, images: [] } },
  { type: "testimonials", label: "Testimonials", icon: <MessageSquare className="h-4 w-4" />, category: "Social Proof",
    defaultProps: { heading: "What Our Customers Say", items: [
      { name: "Sarah K.", role: "CEO, Acme Inc.", quote: "This tool transformed how we build our web presence. Highly recommend!" },
      { name: "James T.", role: "Freelancer", quote: "The easiest website builder I've ever used. Beautiful results in minutes." },
      { name: "Maria L.", role: "Marketing Lead", quote: "Our conversion rate doubled after switching to this platform." },
    ]} },
  { type: "team", label: "Team", icon: <Users className="h-4 w-4" />, category: "Social Proof",
    defaultProps: { heading: "Meet the Team", subheading: "The people behind our success.", members: [
      { name: "Alex Johnson", role: "CEO & Founder", avatar: "" },
      { name: "Priya Sharma", role: "CTO", avatar: "" },
      { name: "Chris Lee", role: "Head of Design", avatar: "" },
    ]} },
  { type: "stats", label: "Stats", icon: <BarChart3 className="h-4 w-4" />, category: "Social Proof",
    defaultProps: { heading: "By the Numbers", items: [
      { value: "10K+", label: "Active Users" }, { value: "50K+", label: "Sites Built" },
      { value: "99.9%", label: "Uptime" }, { value: "4.9★", label: "Avg Rating" },
    ]} },
  { type: "cta", label: "Call to Action", icon: <MousePointer className="h-4 w-4" />, category: "Conversion",
    defaultProps: { heading: "Ready to Get Started?", subheading: "Join thousands of businesses already on SitePilot.", button_text: "Start for Free", bg_color: "#0d0d0d", text_color: "#ffffff" } },
  { type: "pricing", label: "Pricing", icon: <DollarSign className="h-4 w-4" />, category: "Conversion",
    defaultProps: { heading: "Simple Pricing", subheading: "No hidden fees. Cancel anytime.", plans: [
      { name: "Starter", price: "$0", period: "month", features: ["1 website", "10 pages", "Basic analytics"], cta: "Start Free" },
      { name: "Pro", price: "$29", period: "month", features: ["5 websites", "Unlimited pages", "Custom domains"], cta: "Go Pro", highlight: true },
      { name: "Enterprise", price: "$99", period: "month", features: ["Unlimited sites", "Priority support", "SLA"], cta: "Contact Us" },
    ]} },
  { type: "contact_form", label: "Contact Form", icon: <Mail className="h-4 w-4" />, category: "Conversion",
    defaultProps: { heading: "Get in Touch", subheading: "We'd love to hear from you!", fields: ["name", "email", "message"], submit_text: "Send Message" } },
  { type: "faq", label: "FAQ", icon: <HelpCircle className="h-4 w-4" />, category: "Conversion",
    defaultProps: { heading: "Frequently Asked Questions", items: [
      { question: "How do I get started?", answer: "Simply sign up, create a website, and start building." },
      { question: "Can I use my own domain?", answer: "Yes! Pro and Enterprise plans support custom domain mapping." },
      { question: "Is there a free plan?", answer: "Absolutely. Our Starter plan is free forever." },
    ]} },
  { type: "video_embed", label: "Video", icon: <Play className="h-4 w-4" />, category: "Media",
    defaultProps: { heading: "Watch Our Demo", url: "", autoplay: false } },
];

const PALETTE_CATEGORIES = ["Layout", "Content", "Social Proof", "Conversion", "Media"];

// ── Canvas Block Renderer ────────────────────────────────────────────────────

function BlockRenderer({ type, props }: { type: string; props: Record<string, unknown> }) {
  switch (type) {
    case "navbar":
      return (
        <div className="w-full flex items-center justify-between px-8 py-4 border-b border-gray-200" style={{ backgroundColor: String(props.bg_color || "#ffffff") }}>
          <span className="font-bold text-lg" style={{ color: String(props.text_color || "#0d0d0d") }}>{String(props.brand || "Brand")}</span>
          <div className="flex items-center gap-6">
            {((props.links as string[]) || []).map((link, i) => (
              <span key={i} className="text-sm" style={{ color: String(props.text_color || "#0d0d0d") }}>{link}</span>
            ))}
            {props.cta_text ? <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-gray-900 text-white">{String(props.cta_text)}</span> : null}
          </div>
        </div>
      );
    case "hero":
      return (
        <div className="w-full py-20 px-8 text-center" style={{ backgroundColor: String(props.bg_color || "#f8f8f8") }}>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{String(props.heading || "Hero Heading")}</h1>
          {props.subheading ? <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">{String(props.subheading)}</p> : null}
          <div className="flex items-center justify-center gap-3">
            {props.cta_primary ? <span className="px-6 py-2.5 rounded-full text-sm font-semibold bg-gray-900 text-white">{String(props.cta_primary)}</span> : null}
            {props.cta_secondary ? <span className="px-6 py-2.5 rounded-full text-sm font-semibold border border-gray-300 text-gray-700">{String(props.cta_secondary)}</span> : null}
          </div>
        </div>
      );
    case "features": {
      const items = (props.items as Array<{ icon: string; title: string; description: string }>) || [];
      return (
        <div className="w-full py-16 px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">{String(props.heading || "Features")}</h2>
            {props.subheading ? <p className="text-gray-500 mt-2">{String(props.subheading)}</p> : null}
          </div>
          <div className="grid grid-cols-3 gap-8">
            {items.map((item, i) => (
              <div key={i} className="text-center p-6 rounded-xl border border-gray-100 bg-gray-50">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "rich_text":
      return (
        <div className="w-full py-12 px-8" style={{ textAlign: (props.align as "left" | "center" | "right") || "left" }}>
          {props.heading ? <h2 className="text-2xl font-bold text-gray-900 mb-4">{String(props.heading)}</h2> : null}
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{String(props.content || "Your content here...")}</p>
        </div>
      );
    case "image_text":
      return (
        <div className={cn("w-full py-16 px-8 flex items-center gap-12", props.image_side === "right" ? "flex-row" : "flex-row-reverse")}>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{String(props.heading || "Heading")}</h2>
            <p className="text-gray-600 leading-relaxed mb-6">{String(props.text || "")}</p>
            {props.cta_text ? <span className="px-5 py-2 rounded-full text-sm font-semibold bg-gray-900 text-white cursor-pointer">{String(props.cta_text)}</span> : null}
          </div>
          <div className="flex-1 h-56 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
            {props.image_url ? <img src={String(props.image_url)} className="w-full h-full object-cover rounded-xl" alt="" /> : "Image placeholder"}
          </div>
        </div>
      );
    case "gallery":
      return (
        <div className="w-full py-12 px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{String(props.heading || "Gallery")}</h2>
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-36 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">Photo {i}</div>)}
          </div>
        </div>
      );
    case "testimonials": {
      const items = (props.items as Array<{ name: string; role: string; quote: string }>) || [];
      return (
        <div className="w-full py-16 px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">{String(props.heading || "Testimonials")}</h2>
          <div className="grid grid-cols-3 gap-6">
            {items.map((t, i) => (
              <div key={i} className="p-6 rounded-xl border border-gray-100 bg-gray-50">
                <p className="text-gray-600 text-sm mb-4 italic">"{t.quote}"</p>
                <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                <p className="text-gray-400 text-xs">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "team": {
      const members = (props.members as Array<{ name: string; role: string }>) || [];
      return (
        <div className="w-full py-16 px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{String(props.heading || "Our Team")}</h2>
          {props.subheading ? <p className="text-gray-500 mb-10">{String(props.subheading)}</p> : null}
          <div className="flex justify-center gap-8">
            {members.map((m, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-bold mb-3">{m.name.charAt(0)}</div>
                <p className="font-semibold text-gray-900 text-sm">{m.name}</p>
                <p className="text-gray-400 text-xs">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "stats": {
      const items = (props.items as Array<{ value: string; label: string }>) || [];
      return (
        <div className="w-full py-14 px-8">
          {props.heading ? <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">{String(props.heading)}</h2> : null}
          <div className="grid grid-cols-4 gap-6 text-center">
            {items.map((stat, i) => (
              <div key={i}><p className="text-4xl font-bold text-gray-900">{stat.value}</p><p className="text-sm text-gray-500 mt-1">{stat.label}</p></div>
            ))}
          </div>
        </div>
      );
    }
    case "cta":
      return (
        <div className="w-full py-20 px-8 text-center" style={{ backgroundColor: String(props.bg_color || "#0d0d0d") }}>
          <h2 className="text-3xl font-bold mb-3" style={{ color: String(props.text_color || "#ffffff") }}>{String(props.heading || "Call To Action")}</h2>
          {props.subheading ? <p className="mb-8 opacity-70" style={{ color: String(props.text_color || "#ffffff") }}>{String(props.subheading)}</p> : null}
          <span className="px-8 py-3 rounded-full font-semibold bg-white text-gray-900 text-sm">{String(props.button_text || "Get Started")}</span>
        </div>
      );
    case "pricing": {
      const plans = (props.plans as Array<{ name: string; price: string; period: string; features: string[]; cta: string; highlight?: boolean }>) || [];
      return (
        <div className="w-full py-16 px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">{String(props.heading || "Pricing")}</h2>
            {props.subheading ? <p className="text-gray-500 mt-2">{String(props.subheading)}</p> : null}
          </div>
          <div className="grid grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div key={i} className={cn("p-6 rounded-2xl border", plan.highlight ? "border-gray-900 bg-gray-900 text-white shadow-xl" : "border-gray-200 bg-white")}>
                <p className={cn("font-semibold mb-1", plan.highlight ? "text-white" : "text-gray-900")}>{plan.name}</p>
                <p className={cn("text-3xl font-bold my-3", plan.highlight ? "text-white" : "text-gray-900")}>{plan.price}<span className="text-sm font-normal opacity-60">/{plan.period}</span></p>
                <ul className="space-y-2 mb-6">{plan.features.map((f, j) => <li key={j} className={cn("text-sm flex items-center gap-2", plan.highlight ? "text-gray-300" : "text-gray-600")}><span>✓</span>{f}</li>)}</ul>
                <span className={cn("block text-center py-2 rounded-full text-sm font-medium", plan.highlight ? "bg-white text-gray-900" : "bg-gray-900 text-white")}>{plan.cta}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "contact_form": {
      const fields = (props.fields as string[]) || ["name", "email", "message"];
      return (
        <div className="w-full py-16 px-8 max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">{String(props.heading || "Contact Us")}</h2>
          {props.subheading ? <p className="text-gray-500 text-center mb-8">{String(props.subheading)}</p> : null}
          <div className="space-y-4">
            {fields.map((field, i) => field === "message"
              ? <textarea key={i} placeholder="Message" rows={4} className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm resize-none" readOnly />
              : <input key={i} type={field === "email" ? "email" : "text"} placeholder={field.charAt(0).toUpperCase() + field.slice(1)} className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm" readOnly />
            )}
            <button className="w-full py-3 rounded-full bg-gray-900 text-white text-sm font-semibold">{String(props.submit_text || "Send Message")}</button>
          </div>
        </div>
      );
    }
    case "faq": {
      const items = (props.items as Array<{ question: string; answer: string }>) || [];
      return (
        <div className="w-full py-16 px-8 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">{String(props.heading || "FAQ")}</h2>
          <div className="space-y-4">
            {items.map((item, i) => (
              <div key={i} className="p-5 rounded-xl border border-gray-100 bg-gray-50">
                <p className="font-semibold text-gray-900 mb-2">{item.question}</p>
                <p className="text-sm text-gray-500">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "video_embed":
      return (
        <div className="w-full py-12 px-8">
          {props.heading ? <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">{String(props.heading)}</h2> : null}
          <div className="h-72 bg-gray-900 rounded-xl flex items-center justify-center">
            {props.url ? <iframe src={String(props.url)} className="w-full h-full rounded-xl" allow="autoplay" /> : <div className="flex flex-col items-center gap-2 text-gray-400"><Play className="h-10 w-10" /><span className="text-sm">Add video URL in settings</span></div>}
          </div>
        </div>
      );
    case "footer": {
      const links = (props.links as string[]) || [];
      return (
        <div className="w-full py-12 px-8" style={{ backgroundColor: String(props.bg_color || "#0d0d0d") }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg mb-1" style={{ color: String(props.text_color || "#ffffff") }}>{String(props.brand || "Brand")}</p>
              {props.tagline ? <p className="text-sm opacity-50" style={{ color: String(props.text_color || "#ffffff") }}>{String(props.tagline)}</p> : null}
            </div>
            <div className="flex items-center gap-6">
              {links.map((link, i) => <span key={i} className="text-sm opacity-60" style={{ color: String(props.text_color || "#ffffff") }}>{link}</span>)}
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs opacity-30" style={{ color: String(props.text_color || "#ffffff") }}>
            © {new Date().getFullYear()} {String(props.brand || "Brand")}. All rights reserved.
          </div>
        </div>
      );
    }
    default:
      return <div className="w-full py-10 px-8 flex items-center justify-center bg-gray-50"><span className="text-sm text-gray-400 capitalize">{type.replace(/_/g, " ")} block</span></div>;
  }
}

export default function BuilderPage({ params }: BuilderPageProps) {
  const { websiteId } = use(params);
  const [viewport, setViewport] = useState("desktop");
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [editingProps, setEditingProps] = useState<Record<string, unknown> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [leftTab, setLeftTab] = useState<"layers" | "add">("layers");
  const [activeCategory, setActiveCategory] = useState("Layout");
  const [addingType, setAddingType] = useState<string | null>(null);
  const [creatingPage, setCreatingPage] = useState(false);
  const autoCreatedRef = useRef(false);

  // Fetch website detail for name and pages
  const { data: websiteData, loading: websiteLoading, refetch: refetchWebsite } = useWebsiteDetailApi(websiteId);
  const website = websiteData?.website;
  const pages = website?.pages ?? [];

  // Auto-select first (home) page
  useEffect(() => {
    if (pages.length > 0 && !selectedPageId) {
      const homePage = pages.find((p: { is_homepage: boolean }) => p.is_homepage) ?? pages[0];
      setSelectedPageId((homePage as { id: string }).id);
    }
  }, [pages, selectedPageId]);

  // Auto-create home page for websites that have none (e.g. created before bug was fixed)
  useEffect(() => {
    if (!websiteLoading && pages.length === 0 && !autoCreatedRef.current) {
      autoCreatedRef.current = true;
      setCreatingPage(true);
      apiFetch("/api/pages", {
        method: "POST",
        body: { websiteId, title: "Home", slug: "/", status: "draft", is_homepage: true },
      })
        .then(() => refetchWebsite())
        .catch(() => { /* ignore */ })
        .finally(() => setCreatingPage(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [websiteLoading, pages.length]);

  // Fetch components for the selected page
  const { data: componentsData, loading: componentsLoading, refetch: refetchComponents } = useComponentsApi(selectedPageId);
  const blocks = componentsData?.components ?? [];

  // Publish
  const { mutate: publish, loading: publishing } = usePublishWebsiteApi(websiteId, {
    onSuccess: () => { setIsDirty(false); },
  });

  // Save version
  const { mutate: saveVersion } = useCreateVersionApi();

  const handleSave = async () => {
    if (!selectedPageId) return;
    setIsSaving(true);
    try {
      await saveVersion({ pageId: selectedPageId, label: "Manual save" });
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Add a block from palette
  const handleAddBlock = useCallback(async (item: PaletteItem) => {
    if (!selectedPageId) return;
    setAddingType(item.type);
    try {
      await apiFetch("/api/components", {
        method: "POST",
        body: {
          pageId: selectedPageId,
          type: item.type,
          props: item.defaultProps,
          order_key: `${Date.now()}`,
        },
      });
      setIsDirty(true);
      refetchComponents();
      setLeftTab("layers");
    } catch {
      // error adding block
    } finally {
      setAddingType(null);
    }
  }, [selectedPageId, refetchComponents]);

  // Update component props
  const handleUpdateProps = useCallback(async (componentId: string, props: Record<string, unknown>) => {
    try {
      await apiFetch(`/api/components/${componentId}`, { method: "PUT", body: { props } });
      setIsDirty(true);
      refetchComponents();
    } catch {
      // error handling
    }
  }, [refetchComponents]);

  // Toggle visibility
  const handleToggleVisibility = useCallback(async (componentId: string, current: boolean) => {
    try {
      await apiFetch(`/api/components/${componentId}`, { method: "PUT", body: { is_visible: !current } });
      refetchComponents();
    } catch {
      // error handling
    }
  }, [refetchComponents]);

  // Delete component
  const handleDeleteBlock = useCallback(async (componentId: string) => {
    try {
      await apiFetch(`/api/components/${componentId}`, { method: "DELETE" });
      setSelectedBlock(null);
      setEditingProps(null);
      refetchComponents();
    } catch {
      // error handling
    }
  }, [refetchComponents]);

  // When selecting a block, load its props
  useEffect(() => {
    if (selectedBlock) {
      const block = blocks.find((b: { id: string }) => b.id === selectedBlock);
      setEditingProps((block as { props?: Record<string, unknown> })?.props ?? null);
    } else {
      setEditingProps(null);
    }
  }, [selectedBlock, blocks]);

  const viewportWidths: Record<string, string> = {
    desktop: "w-full",
    tablet: "w-[768px]",
    mobile: "w-[375px]",
  };

  const selectedBlockData = blocks.find((b: { id: string }) => b.id === selectedBlock) as {
    id: string; type: string; is_visible: boolean; props: Record<string, unknown>;
  } | undefined;

  const filteredPalette = PALETTE.filter((p) => p.category === activeCategory);

  return (
    <div className="flex h-screen bg-bg-dark overflow-hidden">
      {/* ── Left Panel ───────────────────────────────────────────── */}
      <aside className="w-65 bg-bg-white border-r border-border-light flex flex-col shrink-0">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 h-14 border-b border-border-light">
          <Link
            href={`/dashboard/websites/${websiteId}`}
            className="p-1.5 rounded-lg text-text-muted hover:bg-bg-light hover:text-text-primary transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <span className="text-sm font-semibold text-text-primary truncate">
            {websiteLoading ? "Loading..." : website?.name ?? "Website"}
          </span>
        </div>

        {/* Page selector */}
        <div className="px-3 py-3 border-b border-border-light">
          {websiteLoading ? (
            <Skeleton className="h-9 w-full rounded-lg" />
          ) : (
            <select
              className="w-full h-9 px-2 text-sm rounded-lg border border-border-light bg-bg-white text-text-primary"
              value={selectedPageId ?? ""}
              onChange={(e) => { setSelectedPageId(e.target.value); setSelectedBlock(null); }}
            >
              {pages.map((page: { id: string; title: string; is_homepage: boolean }) => (
                <option key={page.id} value={page.id}>
                  {page.title}{page.is_homepage ? " (Home)" : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Tabs: Layers / Add Block */}
        <div className="flex border-b border-border-light">
          {(["layers", "add"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setLeftTab(tab)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
                leftTab === tab
                  ? "border-b-2 border-gray-900 text-text-primary"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              {tab === "layers" ? <Layers className="h-3.5 w-3.5" /> : <LayoutGrid className="h-3.5 w-3.5" />}
              {tab === "layers" ? "Layers" : "Add Block"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {leftTab === "layers" ? (
            <div className="p-3">
              {componentsLoading ? (
                <div className="space-y-1">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
              ) : blocks.length > 0 ? (
                <div className="space-y-1">
                  {(blocks as Array<{ id: string; type: string; is_visible: boolean }>).map((block) => (
                    <button
                      key={block.id}
                      onClick={() => setSelectedBlock(block.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left transition-all duration-150",
                        selectedBlock === block.id
                          ? "bg-bg-light text-text-primary font-medium shadow-sm"
                          : "text-text-secondary hover:bg-bg-light/60",
                        !block.is_visible && "opacity-50"
                      )}
                    >
                      <GripVertical className="h-3.5 w-3.5 text-text-muted shrink-0" />
                      <span className="flex-1 truncate capitalize">{block.type.replace(/_/g, " ")}</span>
                      <span
                        className="ml-auto p-0.5 rounded text-text-muted hover:text-text-primary"
                        onClick={(e) => { e.stopPropagation(); handleToggleVisibility(block.id, block.is_visible); }}
                      >
                        {block.is_visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-xs text-text-muted">No blocks yet.</p>
                  <button
                    onClick={() => setLeftTab("add")}
                    className="mt-3 text-xs text-gray-900 font-medium underline underline-offset-2"
                  >
                    Add your first block →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Category pills */}
              <div className="flex flex-wrap gap-1.5 p-3 border-b border-border-light">
                {PALETTE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                      activeCategory === cat
                        ? "bg-gray-900 text-white"
                        : "bg-bg-light text-text-secondary hover:bg-gray-200"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Palette grid */}
              <div className="p-3 grid grid-cols-2 gap-2 overflow-y-auto">
                {filteredPalette.map((item) => (
                  <button
                    key={item.type}
                    disabled={addingType === item.type || !selectedPageId}
                    onClick={() => handleAddBlock(item)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border border-border-light bg-bg-white text-center transition-all",
                      "hover:border-gray-400 hover:shadow-sm active:scale-95",
                      addingType === item.type && "opacity-50 pointer-events-none",
                      !selectedPageId && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <div className="h-8 w-8 rounded-lg bg-bg-light flex items-center justify-center text-text-secondary">
                      {item.icon}
                    </div>
                    <span className="text-[11px] font-medium text-text-secondary leading-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Center Canvas ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <header className="flex items-center justify-between px-4 h-14 bg-bg-white border-b border-border-light shrink-0">
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
                  viewport === v.value ? "bg-bg-white text-text-primary shadow-sm" : "text-text-muted hover:text-text-secondary"
                )}
              >
                {v.icon}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {isDirty && (
              <Button variant="ghost" size="sm" leftIcon={<Save className="h-4 w-4" />} onClick={handleSave} isLoading={isSaving}>
                Save
              </Button>
            )}
            <Button
              variant="secondary" size="sm" leftIcon={<Eye className="h-4 w-4" />}
              onClick={() => {
                if (website) {
                  const liveUrl = website.custom_domain && website.domain_verified
                    ? `https://${website.custom_domain}`
                    : `https://${website.subdomain}.sitepilot.pushkarshinde.in`;
                  window.open(liveUrl, "_blank");
                }
              }}
            >
              Preview
            </Button>
            <Button size="sm" leftIcon={<Upload className="h-4 w-4" />} onClick={() => publish()} isLoading={publishing}>
              Publish
            </Button>
          </div>
        </header>

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-6 flex justify-center bg-bg-dark/40">
          <div
            className={cn(
              "bg-white rounded-xl shadow-lg border border-border-light overflow-hidden transition-all duration-300 mx-auto",
              viewportWidths[viewport],
              viewport !== "desktop" && "max-w-full"
            )}
            style={{ minHeight: "600px" }}
          >
            {componentsLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
              </div>
            ) : blocks.length > 0 ? (
              (blocks as Array<{ id: string; type: string; is_visible: boolean; props: Record<string, unknown> }>).map((block) => (
                <div
                  key={block.id}
                  onClick={() => setSelectedBlock(block.id)}
                  className={cn(
                    "relative group cursor-pointer transition-all",
                    "ring-inset hover:ring-2 hover:ring-blue-300",
                    selectedBlock === block.id && "ring-2 ring-blue-500",
                    !block.is_visible && "opacity-40"
                  )}
                >
                  <BlockRenderer type={block.type} props={block.props ?? {}} />

                  {/* Overlay label + actions */}
                  <div className={cn(
                    "absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-1.5 bg-blue-500 text-white text-xs font-medium transition-all",
                    selectedBlock === block.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}>
                    <span className="capitalize">{block.type.replace(/_/g, " ")}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleVisibility(block.id, block.is_visible); }}
                        className="p-1 rounded hover:bg-white/20"
                        title={block.is_visible ? "Hide" : "Show"}
                      >
                        {block.is_visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }}
                        className="p-1 rounded hover:bg-red-500/80"
                        title="Delete block"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-24 gap-4 text-text-muted">
                <LayoutGrid className="h-10 w-10 opacity-30" />
                <div className="text-center">
                  <p className="text-sm font-medium">No blocks yet</p>
                  <p className="text-xs mt-1">Add blocks from the &ldquo;Add Block&rdquo; panel on the left</p>
                </div>
                <Button size="sm" variant="secondary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setLeftTab("add")}>
                  Add First Block
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right Panel — Properties ──────────────────────────────── */}
      <aside className="w-70 bg-bg-white border-l border-border-light flex flex-col shrink-0">
        <div className="px-4 h-14 flex items-center border-b border-border-light">
          <h3 className="text-sm font-semibold text-text-primary">
            {selectedBlock ? "Block Settings" : "Page Settings"}
          </h3>
          {selectedBlock && (
            <span className="ml-auto">
              <Badge variant="info">
                {selectedBlockData?.type.replace(/_/g, " ")}
              </Badge>
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {selectedBlock && selectedBlockData ? (
            <div className="space-y-4">
              {/* Visibility toggle */}
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-bg-light">
                <span className="text-xs font-medium text-text-secondary">Visible</span>
                <button
                  onClick={() => handleToggleVisibility(selectedBlock, selectedBlockData.is_visible)}
                  className={cn(
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                    selectedBlockData.is_visible ? "bg-gray-900" : "bg-gray-300"
                  )}
                >
                  <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform", selectedBlockData.is_visible ? "translate-x-4.5" : "translate-x-0.5")} />
                </button>
              </div>

              <div className="space-y-3">
                {Object.entries(editingProps ?? {}).map(([key, value]) => {
                  if (Array.isArray(value)) {
                    return (
                      <div key={key}>
                        <label className="text-xs font-medium text-text-muted block mb-1 capitalize">{key.replace(/_/g, " ")}</label>
                        <div className="space-y-1">
                          {(value as string[]).map((item, idx) => typeof item === "string" ? (
                            <input key={idx} type="text" value={item}
                              onChange={(e) => {
                                const arr = [...(editingProps![key] as string[])];
                                arr[idx] = e.target.value;
                                const np = { ...editingProps, [key]: arr };
                                setEditingProps(np); setIsDirty(true);
                              }}
                              onBlur={() => { if (editingProps) handleUpdateProps(selectedBlock, editingProps); }}
                              className="w-full h-8 px-2 text-xs rounded border border-border-light bg-bg-white text-text-primary focus:outline-none focus:ring-1 focus:ring-gray-400"
                            />
                          ) : null)}
                        </div>
                      </div>
                    );
                  }
                  if (typeof value === "string") {
                    return (
                      <div key={key}>
                        <label className="text-xs font-medium text-text-muted block mb-1 capitalize">{key.replace(/_/g, " ")}</label>
                        {value.length > 80 ? (
                          <textarea
                            value={value} rows={3}
                            onChange={(e) => { const np = { ...editingProps, [key]: e.target.value }; setEditingProps(np); setIsDirty(true); }}
                            onBlur={() => { if (editingProps) handleUpdateProps(selectedBlock, editingProps); }}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-border-light bg-bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-gray-400/30 resize-y"
                          />
                        ) : (
                          <input
                            type={key.includes("color") || key.includes("Color") ? "color" : "text"}
                            value={value}
                            onChange={(e) => { const np = { ...editingProps, [key]: e.target.value }; setEditingProps(np); setIsDirty(true); }}
                            onBlur={() => { if (editingProps) handleUpdateProps(selectedBlock, editingProps); }}
                            className="w-full h-9 px-3 text-sm rounded-lg border border-border-light bg-bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-gray-400/30"
                          />
                        )}
                      </div>
                    );
                  }
                  if (typeof value === "boolean") {
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <label className="text-xs font-medium text-text-muted capitalize">{key.replace(/_/g, " ")}</label>
                        <input type="checkbox" checked={value}
                          onChange={(e) => {
                            const np = { ...editingProps, [key]: e.target.checked };
                            setEditingProps(np); setIsDirty(true);
                            handleUpdateProps(selectedBlock, np);
                          }}
                          className="rounded"
                        />
                      </div>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => handleDeleteBlock(selectedBlock)}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Block
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-text-muted">Select a block to edit its properties, or configure page-level settings below.</p>
              <div>
                <label className="text-xs font-medium text-text-muted block mb-1">Page Title</label>
                <input type="text" value={(pages as Array<{ id: string; title: string }>).find((p) => p.id === selectedPageId)?.title ?? ""} readOnly
                  className="w-full h-9 px-3 text-sm rounded-lg border border-border-light bg-bg-light text-text-secondary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted block mb-1">Slug</label>
                <input type="text" value={(pages as Array<{ id: string; slug: string }>).find((p) => p.id === selectedPageId)?.slug ?? ""} readOnly
                  className="w-full h-9 px-3 text-sm rounded-lg border border-border-light bg-bg-light text-text-secondary"
                />
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}


