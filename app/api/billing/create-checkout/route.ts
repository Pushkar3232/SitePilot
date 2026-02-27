// app/api/billing/create-checkout/route.ts
import { NextRequest } from 'next/server';
import { 
  verifyRequestAndGetUser, 
  jsonResponse, 
  errorResponse, 
  ApiError 
} from '@/lib/auth-middleware';
import { supabaseServer } from '@/lib/supabase';
import { hasPermission } from '@/lib/rbac';
import { createCheckoutSession } from '@/lib/stripe';

/**
 * POST /api/billing/create-checkout
 * Create a Stripe Checkout session
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyRequestAndGetUser(req);
    
    // Check permission
    if (!hasPermission(user.role, 'manage_billing')) {
      return errorResponse('FORBIDDEN', 'Billing management permission required', 403);
    }

    // Parse request body
    const body = await req.json();
    const { planId, billingInterval } = body;

    if (!planId) {
      return errorResponse('VALIDATION_ERROR', 'planId is required', 400);
    }
    if (!billingInterval || !['monthly', 'yearly'].includes(billingInterval)) {
      return errorResponse('VALIDATION_ERROR', 'billingInterval must be monthly or yearly', 400);
    }

    // Get the plan
    const { data: plan, error: planError } = await supabaseServer
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return errorResponse('NOT_FOUND', 'Plan not found', 404);
    }

    // Get the appropriate price ID
    const priceId = billingInterval === 'yearly' 
      ? plan.stripe_yearly_price_id 
      : plan.stripe_monthly_price_id;

    if (!priceId) {
      return errorResponse('VALIDATION_ERROR', 'This plan is not available for purchase', 400);
    }

    // Get or create Stripe customer ID
    let stripeCustomerId = user.tenants.stripe_customer_id;

    if (!stripeCustomerId) {
      // This shouldn't happen normally, but handle it
      return errorResponse(
        'INTERNAL_ERROR', 
        'Stripe customer not configured. Please contact support.', 
        500
      );
    }

    // Create checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const checkoutUrl = await createCheckoutSession(
      stripeCustomerId,
      priceId,
      `${appUrl}/dashboard/billing?success=true`,
      `${appUrl}/dashboard/billing?canceled=true`
    );

    return jsonResponse({ checkoutUrl });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('POST /api/billing/create-checkout error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to create checkout session', 500);
  }
}
