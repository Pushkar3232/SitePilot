import type { ComponentType } from "@/types/component.types";

export interface ComponentTypeInfo {
  type: ComponentType;
  label: string;
  icon: string;
  category: "layout" | "content" | "social_proof" | "conversion" | "media";
  proOnly?: boolean;
}

export const COMPONENT_TYPES: ComponentTypeInfo[] = [
  // Layout
  { type: "navbar", label: "Navbar", icon: "Menu", category: "layout" },
  { type: "hero", label: "Hero", icon: "Sparkles", category: "layout" },
  { type: "footer", label: "Footer", icon: "PanelBottom", category: "layout" },

  // Content
  { type: "features", label: "Features", icon: "Grid3x3", category: "content" },
  { type: "gallery", label: "Gallery", icon: "Image", category: "content" },
  { type: "rich_text", label: "Rich Text", icon: "Type", category: "content" },
  { type: "image_text", label: "Image + Text", icon: "LayoutList", category: "content" },

  // Social Proof
  { type: "testimonials", label: "Testimonials", icon: "MessageSquare", category: "social_proof" },
  { type: "team", label: "Team", icon: "Users", category: "social_proof" },
  { type: "stats", label: "Stats", icon: "BarChart3", category: "social_proof" },

  // Conversion
  { type: "cta", label: "Call to Action", icon: "MousePointer", category: "conversion" },
  { type: "pricing", label: "Pricing", icon: "DollarSign", category: "conversion" },
  { type: "contact_form", label: "Contact Form", icon: "Mail", category: "conversion" },
  { type: "faq", label: "FAQ", icon: "HelpCircle", category: "conversion" },

  // Media
  { type: "video_embed", label: "Video", icon: "Play", category: "media" },
];
