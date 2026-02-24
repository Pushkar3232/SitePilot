"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Zap } from "lucide-react";
import Input from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button";
import { Divider } from "@/components/atoms/Divider";
import { useAuthStore } from "@/store/auth.store";
import type { User } from "@/types/user.types";
import type { Tenant } from "@/types/tenant.types";

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setTenant } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // TODO: Firebase signInWithEmailAndPassword
    try {
      await new Promise((r) => setTimeout(r, 1500));
      // router.push("/dashboard");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // TODO: Firebase signInWithPopup(auth, googleProvider)
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      // Set mock user and tenant data
      const mockUser: User = {
        id: "demo_user_123",
        email: "demo@example.com",
        full_name: "Demo User",
        role: "admin",
        created_at: new Date().toISOString(),
      };

      const mockTenant: Tenant = {
        id: "demo_tenant_456",
        name: "Demo Organization",
        slug: "demo-org",
        owner_id: "demo_user_123",
        plan_id: "plan_growth",
        onboarding_completed: true,
        created_at: new Date().toISOString(),
      };

      // Store in Zustand
      setUser(mockUser as any);
      setTenant(mockTenant as any);

      // Redirect to dashboard
      await new Promise((r) => setTimeout(r, 500));
      router.push("/dashboard");
    } catch {
      setError("Demo login failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-text-primary text-center">
        Sign in to your account
      </h2>
      <p className="text-sm text-text-muted text-center mt-1.5">
        Welcome back! Enter your credentials below.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="h-4 w-4" />}
          required
        />

        <div>
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
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
            required
          />
          <div className="flex justify-end mt-1.5">
            <Link
              href="/forgot-password"
              className="text-xs text-text-muted hover:text-accent-red transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" fullWidth isLoading={isLoading} size="lg">
          Sign In
        </Button>
      </form>

      <div className="my-6">
        <Divider label="or" />
      </div>

      <Button
        variant="outline"
        fullWidth
        size="lg"
        onClick={handleGoogleSignIn}
        leftIcon={
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        }
      >
        Continue with Google
      </Button>

      <div className="mt-3">
        <Button
          variant="secondary"
          fullWidth
          size="lg"
          onClick={handleDemoLogin}
          isLoading={isLoading}
          leftIcon={<Zap className="h-4 w-4" />}
        >
          Try Demo
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-text-muted">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-text-primary hover:text-accent-red transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
