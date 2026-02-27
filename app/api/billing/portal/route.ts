// app/api/billing/portal/route.ts
import { NextRequest } from 'next/server';
import { 
  verifyRequestAndGetUser, 
  jsonResponse, 
  errorResponse, 
  ApiError 
} from '@/lib/auth-middleware';
import { hasPermission } from '@/lib/rbac';
import { createPortalSession } from '@/lib/stripe';

/**
 * POST /api/billing/portal
 * Create a Stripe Customer Portal session
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyRequestAndGetUser(req);
    
    // Check permission
    if (!hasPermission(user.role, 'manage_billing')) {
      return errorResponse('FORBIDDEN', 'Billing management permission required', 403);
    }

    // Get Stripe customer ID
    const stripeCustomerId = user.tenants.stripe_customer_id;

    if (!stripeCustomerId) {
      return errorResponse(
        'INTERNAL_ERROR', 
        'Stripe customer not configured. Please contact support.', 
        500
      );
    }

    // Create portal session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const portalUrl = await createPortalSession(
      stripeCustomerId,
      `${appUrl}/dashboard/billing`
    );

    return jsonResponse({ portalUrl });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('POST /api/billing/portal error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to create portal session', 500);
  }
}
