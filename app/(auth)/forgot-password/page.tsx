"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import Input from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // TODO: Firebase sendPasswordResetEmail
      await new Promise((r) => setTimeout(r, 1500));
      setSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="h-14 w-14 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
          <Mail className="h-7 w-7 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Check your email</h2>
        <p className="text-sm text-text-muted mt-2 max-w-xs mx-auto">
          We&apos;ve sent a password reset link to <strong>{email}</strong>.
        </p>
        <Link
          href="/login"
          className="inline-block mt-6 text-sm font-semibold text-text-primary hover:text-accent-red transition-colors"
        >
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-text-primary text-center">
        Reset your password
      </h2>
      <p className="text-sm text-text-muted text-center mt-1.5">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="h-4 w-4" />}
          required
        />

        <Button type="submit" fullWidth isLoading={isLoading} size="lg">
          Send Reset Link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        Remember your password?{" "}
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
