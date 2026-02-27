// app/api/billing/plans/route.ts
import { NextRequest } from 'next/server';
import { 
  verifyRequestAndGetUser, 
  jsonResponse, 
  errorResponse, 
  ApiError 
} from '@/lib/auth-middleware';
import { supabaseServer } from '@/lib/supabase';

/**
 * GET /api/billing/plans
 * Get all available plans
 */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyRequestAndGetUser(req);

    // Fetch all active plans
    const { data: plans, error } = await supabaseServer
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Plans fetch error:', error);
      return errorResponse('INTERNAL_ERROR', 'Failed to fetch plans', 500);
    }

    // Get current plan
    const currentPlan = user.tenants.plans;

    return jsonResponse({
      plans,
      currentPlan: currentPlan.slug,
      currentPlanId: currentPlan.id,
    });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('GET /api/billing/plans error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch plans', 500);
  }
}
