"use client";

import { CreditCard, Check, Zap } from "lucide-react";
import { DashboardTopbar } from "@/components/organisms/DashboardTopbar";
import { Card } from "@/components/molecules/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { ProgressBar } from "@/components/atoms/ProgressBar";
import { Divider } from "@/components/atoms/Divider";
import { Skeleton } from "@/components/atoms/Skeleton";
import { PLANS } from "@/constants/plans";
import { usePlansApi, useCreateCheckoutApi, useCreatePortalApi } from "@/hooks/use-api";

export default function BillingPage() {
  const { data: plansData, loading, error, refetch } = usePlansApi();
  const { mutate: createCheckout, loading: checkoutLoading } = useCreateCheckoutApi({
    onSuccess: (data: any) => {
      if (data?.url) window.location.href = data.url;
    },
  });
  const { mutate: createPortal, loading: portalLoading } = useCreatePortalApi({
    onSuccess: (data: any) => {
      if (data?.url) window.location.href = data.url;
    },
  });

  const currentPlanId = plansData?.currentPlan?.id ?? plansData?.current_plan_id;
  const currentPlan = PLANS.find((p) => p.id === currentPlanId) ?? PLANS[0];

  // Usage values from API or fallback to 0
  const usage = plansData?.usage ?? { websites: 0, pages: 0, storage: 0, aiCredits: 0 };

  const handlePlanAction = (planId: string) => {
    createCheckout({ plan_id: planId });
  };

  return (
    <>
      <DashboardTopbar pageTitle="Billing" />

      <div className="p-6 space-y-6 max-w-4xl">
        {/* Current Plan */}
        {loading ? (
          <Card padding="md">
            <div className="space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
              <div className="grid grid-cols-2 gap-4 mt-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            </div>
          </Card>
        ) : error ? (
          <Card padding="md">
            <p className="text-sm text-text-muted text-center">{error}</p>
            <div className="flex justify-center mt-3">
              <Button variant="secondary" size="sm" onClick={refetch}>Retry</Button>
            </div>
          </Card>
        ) : (
          <Card padding="md">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-text-primary">{currentPlan.name}</h3>
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="text-sm text-text-muted mt-1">
                  ${currentPlan.price_monthly}/month
                </p>
              </div>
              <CreditCard className="h-6 w-6 text-text-muted" />
            </div>

            <Divider className="my-4" />

            {/* Usage meters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProgressBar value={usage.websites ?? 0} max={currentPlan.max_websites} label="Websites" showValue />
              <ProgressBar value={usage.pages ?? 0} max={currentPlan.max_pages_per_site} label="Pages / Website" showValue />
              <ProgressBar value={usage.storage ?? 0} max={currentPlan.max_storage_mb} label="Storage (MB)" showValue />
              <ProgressBar value={usage.aiCredits ?? 0} max={currentPlan.max_ai_credits} label="AI Credits" showValue />
            </div>
          </Card>
        )}

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
                  className={isCurrent ? "ring-2 ring-accent-red/40" : ""}
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
                    <Button
                      className="w-full"
                      leftIcon={<Zap className="h-4 w-4" />}
                      onClick={() => handlePlanAction(plan.id)}
                      isLoading={checkoutLoading}
                    >
                      Upgrade
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => handlePlanAction(plan.id)}
                      isLoading={checkoutLoading}
                    >
                      Downgrade
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Manage Payment */}
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-text-muted" />
              <p className="text-sm font-medium text-text-primary">Manage payment methods & invoices</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => createPortal({})}
              isLoading={portalLoading}
            >
              Open Portal
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
