"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, User, Building2 } from "lucide-react";
import Input from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/utils/cn";
import { PLANS } from "@/constants/plans";
import { AuthService } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("plan_starter");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (!fullName.trim() || !orgName.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await AuthService.signUp({
        email,
        password,
        fullName: fullName.trim(),
        orgName: orgName.trim(),
        selectedPlan
      });
      
      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess("Account created successfully! Please check your email to verify your account.");
      
      // Wait a moment then redirect to login
      setTimeout(() => {
        router.push("/login?message=Please check your email to verify your account");
      }, 2000);
      
    } catch (error) {
      setError("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-text-primary text-center">
        Create your account
      </h2>
      <p className="text-sm text-text-muted text-center mt-1.5">
        Get started with SitePilot in minutes.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
            {success}
          </div>
        )}

        <Input
          label="Full Name"
          type="text"
          placeholder="John Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          leftIcon={<User className="h-4 w-4" />}
          required
        />

        <Input
          label="Organization Name"
          type="text"
          placeholder="My Company"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          leftIcon={<Building2 className="h-4 w-4" />}
          required
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="h-4 w-4" />}
          required
        />

        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Create a strong password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-text-muted hover:text-text-primary"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
          hint="Min 8 characters, 1 uppercase, 1 number"
          required
        />

        <Input
          label="Confirm Password"
          type={showPassword ? "text" : "password"}
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {/* Plan selector */}
        <div>
          <label className="text-sm font-medium text-text-primary block mb-2">
            Choose your plan:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className={cn(
                  "flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-150",
                  selectedPlan === plan.id
                    ? "border-btn-primary bg-bg-light"
                    : "border-border-light hover:border-text-muted/40"
                )}
              >
                <span className="text-sm font-bold text-text-primary">
                  {plan.name}
                </span>
                <span className="text-xs text-text-muted mt-0.5">
                  {plan.price_monthly === 0
                    ? "Free"
                    : `$${plan.price_monthly}/mo`}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" fullWidth isLoading={isLoading} size="lg">
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-text-primary hover:text-accent-red transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
