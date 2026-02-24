"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { User, Eye, EyeOff } from "lucide-react";
import Input from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // TODO: Validate token on load via GET /api/team/invite/validate?token=xxx
  const inviteEmail = "invited@example.com"; // Will come from API

  if (!token) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-bold text-text-primary">Invalid Invitation</h2>
        <p className="text-sm text-text-muted mt-2">
          This invitation link is invalid or has expired.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // TODO: Create Firebase account + POST /api/team/invite/accept
      await new Promise((r) => setTimeout(r, 1500));
      // router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-text-primary text-center">
        Accept Invitation
      </h2>
      <p className="text-sm text-text-muted text-center mt-1.5">
        You&apos;ve been invited to join a team on SitePilot.
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
          value={inviteEmail}
          disabled
        />

        <Input
          label="Full Name"
          type="text"
          placeholder="Your full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          leftIcon={<User className="h-4 w-4" />}
          required
        />

        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Create a password"
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

        <Button type="submit" fullWidth isLoading={isLoading} size="lg">
          Accept & Join
        </Button>
      </form>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
