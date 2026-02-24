"use client";

import { useState } from "react";
import { CreditCard, Check, ArrowUpRight, Zap } from "lucide-react";
import { DashboardTopbar } from "@/components/organisms/DashboardTopbar";
import { Card } from "@/components/molecules/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { ProgressBar } from "@/components/atoms/ProgressBar";
import { Divider } from "@/components/atoms/Divider";
import { PLANS } from "@/constants/plans";

export default function BillingPage() {
  const [currentPlanId] = useState("plan_growth");
  const currentPlan = PLANS.find((p) => p.id === currentPlanId) ?? PLANS[0];

  return (
    <>
      <DashboardTopbar pageTitle="Billing" />

      <div className="p-6 space-y-6 max-w-4xl">
        {/* Current Plan */}
        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-text-primary">{currentPlan.name}</h3>
                <Badge variant="success">Active</Badge>
              </div>
              <p className="text-sm text-text-muted mt-1">
                ${currentPlan.price_monthly}/month · Renews on Mar 1, 2026
              </p>
            </div>
            <CreditCard className="h-6 w-6 text-text-muted" />
          </div>

          <Divider className="my-4" />

          {/* Usage meters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ProgressBar value={3} max={currentPlan.max_websites} label="Websites" showValue />
            <ProgressBar value={12} max={currentPlan.max_pages_per_site} label="Pages / Website" showValue />
            <ProgressBar value={256} max={currentPlan.max_storage_mb} label="Storage (MB)" showValue />
            <ProgressBar value={45} max={currentPlan.max_ai_credits} label="AI Credits" showValue />
          </div>
        </Card>

        {/* All Plans */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-4">Available Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              return (
                <Card
                  key={plan.id}
                  padding="md"
                  className={
                    isCurrent ? "ring-2 ring-accent-red/40" : ""
                  }
                >
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-text-primary">{plan.name}</h4>
                      {isCurrent && <Badge variant="info" size="sm">Current</Badge>}
                    </div>
                    <p className="text-2xl font-bold text-text-primary mt-2">
                      ${plan.price_monthly}
                      <span className="text-sm font-normal text-text-muted">/mo</span>
                    </p>
                  </div>

                  <ul className="space-y-2 mb-5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                        <Check className="h-4 w-4 text-tag-teal shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <Button variant="secondary" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : plan.price_monthly > currentPlan.price_monthly ? (
                    <Button className="w-full" leftIcon={<Zap className="h-4 w-4" />}>
                      Upgrade
                    </Button>
                  ) : (
                    <Button variant="ghost" className="w-full">
                      Downgrade
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Payment method */}
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-text-muted" />
              <div>
                <p className="text-sm font-medium text-text-primary">Visa •••• 4242</p>
                <p className="text-xs text-text-muted">Expires 12/2027</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">Update</Button>
          </div>
        </Card>
      </div>
    </>
  );
}
