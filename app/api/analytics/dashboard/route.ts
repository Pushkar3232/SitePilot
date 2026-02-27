// app/api/analytics/dashboard/route.ts
import { NextRequest } from 'next/server';
import { 
  verifyRequestAndGetUser, 
  jsonResponse, 
  errorResponse, 
  ApiError 
} from '@/lib/auth-middleware';
import { supabaseServer } from '@/lib/supabase';
import { hasPermission } from '@/lib/rbac';

/**
 * GET /api/analytics/dashboard
 * Fetch analytics metrics for the dashboard
 */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyRequestAndGetUser(req);
    
    // Check permission
    if (!hasPermission(user.role, 'view_analytics')) {
      return errorResponse('FORBIDDEN', 'Analytics permission required', 403);
    }

    // Check if analytics is enabled for plan
    if (!user.tenants.plans.analytics_enabled) {
      return errorResponse(
        'FEATURE_NOT_ALLOWED',
        'Analytics requires a Growth or Pro plan',
        403,
        { upgradeUrl: '/dashboard/billing' }
      );
    }

    // Get query params
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const websiteId = searchParams.get('websiteId');

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Get websites for this tenant
    let websiteFilter = supabaseServer
      .from('websites')
      .select('id')
      .eq('tenant_id', user.tenant_id)
      .neq('status', 'archived');

    if (websiteId) {
      websiteFilter = websiteFilter.eq('id', websiteId);
    }

    const { data: websites } = await websiteFilter;
    const websiteIds = websites?.map(w => w.id) || [];

    // Get page views
    let totalPageViews = 0;
    let pageViewsByDay: Record<string, number> = {};

    if (websiteIds.length > 0) {
      const { data: metrics } = await supabaseServer
        .from('usage_metrics')
        .select('date, page_views')
        .in('website_id', websiteIds)
        .gte('date', startDateStr);

      if (metrics) {
        for (const m of metrics) {
          totalPageViews += m.page_views || 0;
          const dateKey = m.date;
          pageViewsByDay[dateKey] = (pageViewsByDay[dateKey] || 0) + (m.page_views || 0);
        }
      }
    }

    // Get storage usage
    const { data: assets } = await supabaseServer
      .from('assets')
      .select('size_bytes')
      .eq('tenant_id', user.tenant_id);

    const storageUsedBytes = assets?.reduce((sum, a) => sum + (a.size_bytes || 0), 0) || 0;
    const storageUsedMb = storageUsedBytes / (1024 * 1024);

    // Get AI usage this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: aiCreditsUsed } = await supabaseServer
      .from('ai_usage_log')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', user.tenant_id)
      .eq('status', 'success')
      .gte('created_at', startOfMonth.toISOString());

    // Get website count
    const { count: websiteCount } = await supabaseServer
      .from('websites')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', user.tenant_id)
      .neq('status', 'archived');

    // Build alerts for usage approaching limits
    const plan = user.tenants.plans;
    const alerts: Array<{ metric: string; used: number; limit: number; percentage: number }> = [];

    if ((websiteCount || 0) >= plan.max_websites * 0.8) {
      alerts.push({
        metric: 'websites',
        used: websiteCount || 0,
        limit: plan.max_websites,
        percentage: ((websiteCount || 0) / plan.max_websites) * 100,
      });
    }

    if (storageUsedMb >= plan.storage_limit_mb * 0.8) {
      alerts.push({
        metric: 'storage',
        used: storageUsedMb,
        limit: plan.storage_limit_mb,
        percentage: (storageUsedMb / plan.storage_limit_mb) * 100,
      });
    }

    if ((aiCreditsUsed || 0) >= plan.ai_credits_per_month * 0.8) {
      alerts.push({
        metric: 'ai_credits',
        used: aiCreditsUsed || 0,
        limit: plan.ai_credits_per_month,
        percentage: ((aiCreditsUsed || 0) / plan.ai_credits_per_month) * 100,
      });
    }

    return jsonResponse({
      pageViews: {
        total: totalPageViews,
        byDay: pageViewsByDay,
        period: `${days} days`,
      },
      storage: {
        usedMb: Math.round(storageUsedMb * 100) / 100,
        limitMb: plan.storage_limit_mb,
        percentUsed: Math.round((storageUsedMb / plan.storage_limit_mb) * 100),
      },
      aiCredits: {
        used: aiCreditsUsed || 0,
        limit: plan.ai_credits_per_month,
        percentUsed: Math.round(((aiCreditsUsed || 0) / plan.ai_credits_per_month) * 100),
        resetsAt: new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 1).toISOString(),
      },
      websites: {
        count: websiteCount || 0,
        limit: plan.max_websites,
      },
      alerts,
    });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('GET /api/analytics/dashboard error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch analytics', 500);
  }
}
