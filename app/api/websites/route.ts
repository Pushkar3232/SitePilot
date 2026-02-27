// app/api/websites/route.ts
import { NextRequest } from 'next/server';
import { 
  verifyRequestAndGetUser, 
  jsonResponse, 
  errorResponse, 
  ApiError 
} from '@/lib/auth-middleware';
import { supabaseServer } from '@/lib/supabase';
import { hasPermission } from '@/lib/rbac';
import { generateUniqueSlug } from '@/lib/utils/slug';

/**
 * GET /api/websites
 * List all websites for the authenticated tenant
 */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyRequestAndGetUser(req);
    
    // Check permission
    if (!hasPermission(user.role, 'view')) {
      return errorResponse('FORBIDDEN', 'View permission required', 403);
    }

    // Get query params
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    // Build query
    let query = supabaseServer
      .from('websites')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status && ['draft', 'published', 'archived'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data: websites, error } = await query;

    if (error) {
      console.error('Websites fetch error:', error);
      return errorResponse('INTERNAL_ERROR', 'Failed to fetch websites', 500);
    }

    return jsonResponse({ websites });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('GET /api/websites error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch websites', 500);
  }
}

/**
 * POST /api/websites
 * Create a new website for the tenant
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyRequestAndGetUser(req);
    
    // Check permission
    if (!hasPermission(user.role, 'admin')) {
      return errorResponse('FORBIDDEN', 'Admin permission required to create websites', 403);
    }

    // Parse request body
    const body = await req.json();
    const { name, templateId } = body;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return errorResponse('VALIDATION_ERROR', 'Website name is required', 400);
    }

    // Check plan limits
    const { count: websiteCount, error: countError } = await supabaseServer
      .from('websites')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', user.tenant_id)
      .neq('status', 'archived');

    if (countError) {
      console.error('Website count error:', countError);
      return errorResponse('INTERNAL_ERROR', 'Failed to check website limit', 500);
    }

    const maxWebsites = user.tenants.plans.max_websites;
    if ((websiteCount ?? 0) >= maxWebsites) {
      return errorResponse(
        'PLAN_LIMIT_WEBSITES',
        `You have reached the maximum of ${maxWebsites} websites for your plan`,
        429,
        { 
          limit: maxWebsites, 
          current: websiteCount,
          upgradeUrl: '/dashboard/billing' 
        }
      );
    }

    // Generate unique subdomain
    const subdomain = generateUniqueSlug(name);

    // Create website
    const { data: website, error: websiteError } = await supabaseServer
      .from('websites')
      .insert({
        tenant_id: user.tenant_id,
        name: name.trim(),
        subdomain,
        status: 'draft',
        template_id: templateId || null,
        branding_config: {},
        seo_defaults: {},
      })
      .select()
      .single();

    if (websiteError) {
      console.error('Website creation error:', websiteError);
      return errorResponse('INTERNAL_ERROR', 'Failed to create website', 500);
    }

    // Create default homepage
    const { data: homepage, error: pageError } = await supabaseServer
      .from('pages')
      .insert({
        website_id: website.id,
        title: 'Home',
        slug: '/',
        status: 'draft',
        is_home: true,
      })
      .select()
      .single();

    if (pageError) {
      console.error('Homepage creation error:', pageError);
      // Don't fail - website is created, page can be added manually
    }

    // TODO: If templateId provided, copy template components

    // Create audit log
    await supabaseServer.from('audit_logs').insert({
      tenant_id: user.tenant_id,
      performed_by: user.id,
      action: 'website.created',
      resource_type: 'website',
      resource_id: website.id,
      details: { name, templateId },
    });

    return jsonResponse({ website, homepage }, 201);
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('POST /api/websites error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to create website', 500);
  }
}
