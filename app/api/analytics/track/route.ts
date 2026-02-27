// app/api/analytics/track/route.ts
import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

/**
 * POST /api/analytics/track
 * Track a page view event (public endpoint - no auth required)
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { website_id, page_path, referrer, timestamp } = body;

    // Validate website_id
    if (!website_id) {
      return new Response(null, { status: 400 });
    }

    // Verify website exists
    const { data: website } = await supabaseServer
      .from('websites')
      .select('id, analytics_enabled')
      .eq('id', website_id)
      .single();

    if (!website || !website.analytics_enabled) {
      return new Response(null, { status: 404 });
    }

    // Get date for aggregation
    const eventDate = timestamp 
      ? new Date(timestamp).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    // Upsert usage metrics for the day
    const { data: existing } = await supabaseServer
      .from('usage_metrics')
      .select('id, page_views')
      .eq('website_id', website_id)
      .eq('date', eventDate)
      .single();

    if (existing) {
      // Update existing record
      await supabaseServer
        .from('usage_metrics')
        .update({
          page_views: existing.page_views + 1,
        })
        .eq('id', existing.id);
    } else {
      // Create new record
      await supabaseServer.from('usage_metrics').insert({
        website_id,
        date: eventDate,
        page_views: 1,
        unique_visitors: 1,
        sessions: 1,
        bandwidth_mb: 0,
        referrer_breakdown: referrer ? { [referrer]: 1 } : {},
        top_pages: page_path ? [{ slug: page_path, views: 1 }] : [],
        country_breakdown: {},
        device_breakdown: {},
      });
    }

    // Return 204 No Content quickly
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('Analytics track error:', err);
    // Still return 204 to not break tracking
    return new Response(null, { status: 204 });
  }
}

// Allow CORS for tracking pixel
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
