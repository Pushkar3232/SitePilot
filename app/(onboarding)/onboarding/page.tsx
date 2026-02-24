"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { cn } from "@/utils/cn";
import {
  ArrowRight,
  ArrowLeft,
  Store,
  Briefcase,
  Utensils,
  Heart,
  GraduationCap,
  Dumbbell,
  Camera,
  Code,
  Sparkles,
  Check,
} from "lucide-react";

const CATEGORIES = [
  { icon: <Store className="h-6 w-6" />, label: "E-Commerce", value: "ecommerce" },
  { icon: <Briefcase className="h-6 w-6" />, label: "Business", value: "business" },
  { icon: <Utensils className="h-6 w-6" />, label: "Restaurant", value: "restaurant" },
  { icon: <Heart className="h-6 w-6" />, label: "Health", value: "health" },
  { icon: <GraduationCap className="h-6 w-6" />, label: "Education", value: "education" },
  { icon: <Dumbbell className="h-6 w-6" />, label: "Fitness", value: "fitness" },
  { icon: <Camera className="h-6 w-6" />, label: "Portfolio", value: "portfolio" },
  { icon: <Code className="h-6 w-6" />, label: "Tech", value: "tech" },
];

const STEPS = ["Welcome", "Category", "Details", "Generating", "Done"];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");

  const nextStep = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const prevStep = () => setStep((s) => Math.max(0, s - 1));

  const handleGenerate = async () => {
    setStep(3); // Show generating state
    // TODO: Call Claude API to generate website
    await new Promise((r) => setTimeout(r, 3000));
    setStep(4); // Done
  };

  return (
    <div>
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div
              className={cn(
                "h-2 flex-1 rounded-full transition-colors duration-300",
                i <= step ? "bg-btn-primary" : "bg-border-light"
              )}
            />
          </div>
        ))}
      </div>

      {/* Step 0: Welcome */}
      {step === 0 && (
        <div className="text-center">
          <div className="h-16 w-16 mx-auto mb-6 rounded-2xl bg-bg-dark flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-accent-red" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">
            Let&apos;s build your first website
          </h2>
          <p className="text-text-secondary mt-2 max-w-md mx-auto">
            Answer a few questions and our AI will generate a complete website
            tailored to your needs.
          </p>
          <Button size="lg" className="mt-8" onClick={nextStep} rightIcon={<ArrowRight className="h-4 w-4" />}>
            Get Started
          </Button>
        </div>
      )}

      {/* Step 1: Category */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold text-text-primary text-center">
            What type of website?
          </h2>
          <p className="text-text-muted text-center mt-1 text-sm">
            Choose the category that best describes your project.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-150",
                  category === cat.value
                    ? "border-btn-primary bg-bg-light"
                    : "border-border-light hover:border-text-muted/40"
                )}
              >
                <span className="text-text-primary">{cat.icon}</span>
                <span className="text-sm font-medium text-text-primary">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between mt-8">
            <Button variant="ghost" onClick={prevStep} leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
            <Button onClick={nextStep} disabled={!category} rightIcon={<ArrowRight className="h-4 w-4" />}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-bold text-text-primary text-center">
            Tell us about your business
          </h2>
          <p className="text-text-muted text-center mt-1 text-sm">
            This helps our AI generate relevant content for your site.
          </p>
          <div className="mt-8 space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">
                Business Name
              </label>
              <input
                type="text"
                placeholder="e.g., Acme Inc."
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border-light bg-bg-white text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-red/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">
                Describe your business
              </label>
              <textarea
                placeholder="What does your business do? Who are your customers?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-border-light bg-bg-white text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-red/30 resize-y"
              />
            </div>
          </div>
          <div className="flex items-center justify-between mt-8">
            <Button variant="ghost" onClick={prevStep} leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!businessName || !description}
              rightIcon={<Sparkles className="h-4 w-4" />}
            >
              Generate Website
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Generating */}
      {step === 3 && (
        <div className="text-center py-12">
          <Spinner size="lg" />
          <h2 className="text-xl font-bold text-text-primary mt-6">
            Generating your website...
          </h2>
          <p className="text-text-muted mt-2 text-sm">
            This usually takes about 15–30 seconds.
          </p>
          <div className="mt-8 space-y-3 max-w-xs mx-auto text-left">
            {["Layout", "Content", "Colors & Branding", "Final touches"].map(
              (item, i) => (
                <div
                  key={item}
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    i < 2 ? "text-tag-teal" : "text-text-muted"
                  )}
                >
                  {i < 2 ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Spinner size="xs" color="gray" />
                  )}
                  {item}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 4 && (
        <div className="text-center">
          <div className="h-16 w-16 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">
            Your website is ready!
          </h2>
          <p className="text-text-secondary mt-2">
            Open the builder to customize it, or view a live preview.
          </p>
          {/* Preview thumbnail placeholder */}
          <div className="mt-8 mx-auto w-full max-w-md h-48 bg-bg-dark rounded-2xl border border-border-light flex items-center justify-center text-text-muted text-sm">
            Website Preview
          </div>
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Open Builder
            </Button>
            <Button variant="secondary" size="lg">
              View Live Preview
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
