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
 * Fetch comprehensive analytics metrics for the dashboard
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
    const endDateStr = new Date().toISOString().split('T')[0];

    // Get all websites for this tenant (for the dropdown)
    const { data: allWebsites } = await supabaseServer
      .from('websites')
      .select('id, name, subdomain, status')
      .eq('tenant_id', user.tenant_id)
      .neq('status', 'archived')
      .order('name');

    // Build website filter for metrics
    let websiteIds: string[] = [];
    if (websiteId && websiteId !== 'all') {
      websiteIds = [websiteId];
    } else {
      websiteIds = allWebsites?.map(w => w.id) || [];
    }

    // Get detailed metrics from usage_metrics table
    let totalPageViews = 0;
    let totalUniqueVisitors = 0;
    let totalSessions = 0;
    let totalBounceRateSum = 0;
    let totalSessionDurationSum = 0;
    let bounceRateCount = 0;
    let sessionDurationCount = 0;
    const pageViewsByDay: Record<string, number> = {};
    const visitorsByDay: Record<string, number> = {};
    const aggregatedReferrers: Record<string, number> = {};
    const aggregatedTopPages: Record<string, number> = {};
    const aggregatedDevices: Record<string, number> = {};
    const aggregatedCountries: Record<string, number> = {};

    if (websiteIds.length > 0) {
      const { data: metrics } = await supabaseServer
        .from('usage_metrics')
        .select('*')
        .in('website_id', websiteIds)
        .gte('date', startDateStr)
        .lte('date', endDateStr)
        .order('date');

      if (metrics && metrics.length > 0) {
        for (const m of metrics) {
          // Aggregate totals
          totalPageViews += m.page_views || 0;
          totalUniqueVisitors += m.unique_visitors || 0;
          totalSessions += m.sessions || 0;
          
          if (m.bounce_rate !== null && m.bounce_rate !== undefined) {
            totalBounceRateSum += parseFloat(m.bounce_rate) || 0;
            bounceRateCount++;
          }
          if (m.avg_session_duration_s !== null && m.avg_session_duration_s !== undefined) {
            totalSessionDurationSum += m.avg_session_duration_s || 0;
            sessionDurationCount++;
          }

          // Daily breakdown
          const dateKey = m.date;
          pageViewsByDay[dateKey] = (pageViewsByDay[dateKey] || 0) + (m.page_views || 0);
          visitorsByDay[dateKey] = (visitorsByDay[dateKey] || 0) + (m.unique_visitors || 0);

          // Aggregate referrers
          if (m.referrer_breakdown && typeof m.referrer_breakdown === 'object') {
            for (const [source, count] of Object.entries(m.referrer_breakdown as Record<string, number>)) {
              aggregatedReferrers[source] = (aggregatedReferrers[source] || 0) + (count || 0);
            }
          }

          // Aggregate top pages
          if (m.top_pages && Array.isArray(m.top_pages)) {
            for (const page of m.top_pages as Array<{ slug: string; views: number }>) {
              if (page.slug) {
                aggregatedTopPages[page.slug] = (aggregatedTopPages[page.slug] || 0) + (page.views || 0);
              }
            }
          }

          // Aggregate devices
          if (m.device_breakdown && typeof m.device_breakdown === 'object') {
            for (const [device, count] of Object.entries(m.device_breakdown as Record<string, number>)) {
              aggregatedDevices[device] = (aggregatedDevices[device] || 0) + (count || 0);
            }
          }

          // Aggregate countries
          if (m.country_breakdown && typeof m.country_breakdown === 'object') {
            for (const [country, count] of Object.entries(m.country_breakdown as Record<string, number>)) {
              aggregatedCountries[country] = (aggregatedCountries[country] || 0) + (count || 0);
            }
          }
        }
      }
    }

    // Calculate averages
    const avgBounceRate = bounceRateCount > 0 ? totalBounceRateSum / bounceRateCount : null;
    const avgSessionDuration = sessionDurationCount > 0 ? Math.round(totalSessionDurationSum / sessionDurationCount) : null;

    // Build chart data for the date range
    const chartData: Array<{ date: string; pageViews: number; visitors: number }> = [];
    const currentDate = new Date(startDate);
    while (currentDate <= new Date()) {
      const dateStr = currentDate.toISOString().split('T')[0];
      chartData.push({
        date: dateStr,
        pageViews: pageViewsByDay[dateStr] || 0,
        visitors: visitorsByDay[dateStr] || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Sort and limit top pages
    const topPages = Object.entries(aggregatedTopPages)
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Sort and format referrers
    const referrers = Object.entries(aggregatedReferrers)
      .map(([source, visits]) => ({ source, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);

    // Format device breakdown
    const devices = Object.entries(aggregatedDevices)
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count);

    // Format country breakdown
    const countries = Object.entries(aggregatedCountries)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate total referrer visits for percentage
    const totalReferrerVisits = referrers.reduce((sum, r) => sum + r.visits, 0);
    const referrersWithPercent = referrers.map(r => ({
      ...r,
      percent: totalReferrerVisits > 0 ? Math.round((r.visits / totalReferrerVisits) * 100) : 0,
    }));

    // Calculate total device count for percentage
    const totalDeviceCount = devices.reduce((sum, d) => sum + d.count, 0);
    const devicesWithPercent = devices.map(d => ({
      ...d,
      percent: totalDeviceCount > 0 ? Math.round((d.count / totalDeviceCount) * 100) : 0,
    }));

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
    const websiteCount = allWebsites?.length || 0;

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
      // Website list for dropdown
      websitesList: allWebsites?.map(w => ({ id: w.id, name: w.name, subdomain: w.subdomain })) || [],
      selectedWebsiteId: websiteId || 'all',
      
      // Overview metrics
      overview: {
        totalPageViews,
        totalUniqueVisitors,
        totalSessions,
        avgBounceRate: avgBounceRate !== null ? Math.round(avgBounceRate * 10) / 10 : null,
        avgSessionDuration,
        period: days,
      },

      // Chart data
      chartData,

      // Top pages
      topPages,

      // Traffic sources
      referrers: referrersWithPercent,

      // Device breakdown
      devices: devicesWithPercent,

      // Country breakdown
      countries,

      // Plan usage
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

      // Legacy fields for backward compatibility
      pageViews: {
        total: totalPageViews,
        chartData: chartData.map(d => ({ date: d.date, views: d.pageViews })),
      },
    });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('GET /api/analytics/dashboard error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch analytics', 500);
  }
}
