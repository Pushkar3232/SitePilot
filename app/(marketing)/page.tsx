"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Globe, Palette, BarChart3, Zap, Shield } from "lucide-react";

const artworks = [
  { id: 1, rotate: -8, x: -40, bg: "bg-rose-300" },
  { id: 2, rotate: -4, x: -20, bg: "bg-amber-300" },
  { id: 3, rotate: 0, x: 0, bg: "bg-emerald-300" },
  { id: 4, rotate: 4, x: 20, bg: "bg-sky-300" },
  { id: 5, rotate: 8, x: 40, bg: "bg-violet-300" },
];

const features = [
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: "AI-Powered Builder",
    description: "Describe your business and let our AI generate a stunning website in minutes.",
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Custom Domains",
    description: "Connect your own domain or use a free subdomain at sitepilot.pushkarshinde.in.",
  },
  {
    icon: <Palette className="h-6 w-6" />,
    title: "Branding Studio",
    description: "Set your colors, fonts, and logos once — applied everywhere automatically.",
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Built-in Analytics",
    description: "Track page views, visitors, and engagement without third-party tools.",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Drag & Drop Blocks",
    description: "Build pages with pre-designed blocks — hero, features, pricing, and more.",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Team Collaboration",
    description: "Invite team members with role-based access — owner, admin, editor, viewer.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    features: ["1 website", "5 pages", "100 MB storage", "10 AI credits", "Free subdomain"],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$19",
    period: "/mo",
    features: [
      "5 websites",
      "20 pages per site",
      "1 GB storage",
      "100 AI credits",
      "Custom domain",
      "Team (3 members)",
    ],
    cta: "Start Growing",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/mo",
    features: [
      "20 websites",
      "50 pages per site",
      "5 GB storage",
      "500 AI credits",
      "Custom domain",
      "Unlimited team",
      "Version history",
    ],
    cta: "Go Pro",
    highlighted: false,
  },
];

export default function MarketingPage() {
  return (
    <>
      {/* ===== Hero Section 1 — Light ===== */}
      <section className="relative bg-bg-light overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Text */}
            <div>
              <p className="text-xs font-medium text-text-muted tracking-[0.2em] uppercase mb-4">
                Website Builder
              </p>
              <h1 className="text-[clamp(40px,6vw,72px)] font-black leading-[1.05] text-text-primary">
                Build, Launch, &{" "}
                <span className="text-accent-red">Grow</span> your website.
              </h1>
              <p className="text-base text-text-secondary mt-5 max-w-md leading-relaxed">
                SitePilot is the AI-powered website builder that helps you create stunning sites in minutes. No code needed.
              </p>
              <div className="flex items-center gap-3 mt-8">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 h-12 px-7 bg-btn-primary text-btn-primary-text text-[15px] font-semibold rounded-full hover:bg-[#222] transition-colors"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/#features"
                  className="inline-flex items-center h-12 px-7 text-[15px] font-medium text-btn-primary border border-btn-secondary-border rounded-full hover:bg-bg-dark transition-colors"
                >
                  Learn More
                </Link>
              </div>
            </div>

            {/* Artwork Cards */}
            <div className="relative flex items-center justify-center h-[400px] lg:h-[500px]">
              {artworks.map((art, i) => (
                <motion.div
                  key={art.id}
                  initial={{ opacity: 0, y: 40, rotate: 0 }}
                  animate={{ opacity: 1, y: 0, rotate: art.rotate }}
                  transition={{ delay: 0.1 * i, duration: 0.6, ease: "easeOut" }}
                  className={`absolute w-[180px] h-[220px] md:w-[200px] md:h-[250px] rounded-2xl shadow-card ${art.bg}`}
                  style={{
                    transform: `translateX(${art.x}px) rotate(${art.rotate}deg)`,
                    zIndex: 5 - Math.abs(art.rotate),
                  }}
                />
              ))}

              {/* User Tags */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="absolute top-8 left-4 px-3.5 py-1.5 bg-tag-coral text-white text-[13px] font-semibold rounded-full shadow-tag z-20"
              >
                @sarah
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.4 }}
                className="absolute bottom-12 right-4 px-3.5 py-1.5 bg-tag-teal text-white text-[13px] font-semibold rounded-full shadow-tag z-20"
              >
                @andrea
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Hero Section 2 — Dark ===== */}
      <section className="bg-bg-dark">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-20 md:py-28 text-center">
          <h2 className="text-[clamp(36px,5vw,64px)] font-extrabold text-text-primary leading-[1.1]">
            A place to build your
            <br />
            digital masterpiece.
          </h2>

          {/* Fan spread cards */}
          <div className="relative flex items-center justify-center h-[250px] md:h-[320px] mt-12 mb-10">
            {[...Array(7)].map((_, i) => {
              const angle = (i - 3) * 8;
              const colors = [
                "bg-rose-200",
                "bg-orange-200",
                "bg-amber-200",
                "bg-emerald-200",
                "bg-sky-200",
                "bg-indigo-200",
                "bg-pink-200",
              ];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 60 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.5 }}
                  viewport={{ once: true }}
                  className={`absolute w-[140px] h-[180px] md:w-[160px] md:h-[200px] rounded-2xl shadow-card ${colors[i]}`}
                  style={{
                    transform: `rotate(${angle}deg) translateY(${Math.abs(angle) * 0.8}px)`,
                    transformOrigin: "bottom center",
                    zIndex: 7 - Math.abs(i - 3),
                  }}
                />
              );
            })}
          </div>

          <p className="text-base text-text-secondary max-w-lg mx-auto leading-relaxed">
            Build stunning landing pages, portfolios, and business sites with our drag-and-drop builder powered by AI.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 h-12 px-7 bg-btn-primary text-btn-primary-text text-[15px] font-semibold rounded-full hover:bg-[#222] transition-colors"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/#features"
              className="inline-flex items-center h-12 px-7 text-[15px] font-medium text-btn-primary border border-btn-secondary-border rounded-full hover:bg-bg-light transition-colors"
            >
              Explore Features
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Features Section ===== */}
      <section id="features" className="bg-bg-light">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-20 md:py-28">
          <div className="text-center mb-16">
            <p className="text-xs font-medium text-text-muted tracking-[0.2em] uppercase mb-3">
              Features
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary">
              Everything you need to build
            </h2>
            <p className="text-base text-text-secondary mt-4 max-w-lg mx-auto">
              From AI generation to analytics, SitePilot gives you all the tools to launch and grow your online presence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.4 }}
                viewport={{ once: true }}
                className="bg-bg-white border border-border-light rounded-2xl p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="h-12 w-12 rounded-xl bg-bg-light flex items-center justify-center text-text-primary mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-base font-bold text-text-primary">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Pricing Section ===== */}
      <section id="pricing" className="bg-bg-dark">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-20 md:py-28">
          <div className="text-center mb-16">
            <p className="text-xs font-medium text-text-muted tracking-[0.2em] uppercase mb-3">
              Pricing
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary">
              Simple, transparent pricing
            </h2>
            <p className="text-base text-text-secondary mt-4 max-w-md mx-auto">
              Start free, upgrade when you need more. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-bg-white rounded-2xl p-6 border flex flex-col ${
                  plan.highlighted
                    ? "border-btn-primary shadow-lg scale-[1.02]"
                    : "border-border-light"
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-btn-primary text-white text-xs font-semibold rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-text-primary">{plan.name}</h3>
                <div className="mt-3 mb-5">
                  <span className="text-4xl font-black text-text-primary">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-text-muted">{plan.period}</span>
                  )}
                </div>
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-text-secondary flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-tag-teal shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-6 inline-flex items-center justify-center h-11 px-6 text-sm font-semibold rounded-full transition-colors ${
                    plan.highlighted
                      ? "bg-btn-primary text-white hover:bg-[#222]"
                      : "border border-btn-secondary-border text-btn-primary hover:bg-bg-dark"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA Section ===== */}
      <section className="bg-bg-light">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-20 md:py-28 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary">
            Ready to build your site?
          </h2>
          <p className="text-base text-text-secondary mt-4 max-w-md mx-auto">
            Join thousands of creators and businesses who trust SitePilot.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 h-12 px-8 mt-8 bg-btn-primary text-btn-primary-text text-[15px] font-semibold rounded-full hover:bg-[#222] transition-colors"
          >
            Get Started — it&apos;s free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
