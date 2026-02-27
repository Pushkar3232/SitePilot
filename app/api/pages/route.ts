// app/api/pages/route.ts
import { NextRequest } from 'next/server';
import { 
  verifyRequestAndGetUser, 
  jsonResponse, 
  errorResponse, 
  ApiError 
} from '@/lib/auth-middleware';
import { supabaseServer } from '@/lib/supabase';
import { hasPermission } from '@/lib/rbac';
import { isValidPageSlug } from '@/lib/utils/slug';

/**
 * GET /api/pages
 * List all pages for a given website
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
    const websiteId = searchParams.get('websiteId');

    if (!websiteId) {
      return errorResponse('VALIDATION_ERROR', 'websiteId is required', 400);
    }

    // Verify website belongs to tenant
    const { data: website, error: websiteError } = await supabaseServer
      .from('websites')
      .select('id')
      .eq('id', websiteId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (websiteError || !website) {
      return errorResponse('NOT_FOUND', 'Website not found', 404);
    }

    // Fetch pages
    const { data: pages, error } = await supabaseServer
      .from('pages')
      .select('*')
      .eq('website_id', websiteId)
      .order('nav_order', { ascending: true });

    if (error) {
      console.error('Pages fetch error:', error);
      return errorResponse('INTERNAL_ERROR', 'Failed to fetch pages', 500);
    }

    return jsonResponse({ pages });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('GET /api/pages error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch pages', 500);
  }
}

/**
 * POST /api/pages
 * Create a new page inside a website
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyRequestAndGetUser(req);
    
    // Check permission
    if (!hasPermission(user.role, 'edit_content')) {
      return errorResponse('FORBIDDEN', 'Edit permission required', 403);
    }

    // Parse request body
    const body = await req.json();
    const { websiteId, title, slug, is_home, is_homepage } = body;
    // Support both is_home and is_homepage for backwards compatibility
    const isHomePage = is_home === true || is_homepage === true;

    // Validate input
    if (!websiteId) {
      return errorResponse('VALIDATION_ERROR', 'websiteId is required', 400);
    }
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return errorResponse('VALIDATION_ERROR', 'Page title is required', 400);
    }
    if (!slug || typeof slug !== 'string') {
      return errorResponse('VALIDATION_ERROR', 'Page slug is required', 400);
    }
    if (!isValidPageSlug(slug)) {
      return errorResponse(
        'VALIDATION_ERROR', 
        'Slug must start with / and contain only lowercase letters, numbers, and hyphens', 
        400
      );
    }

    // Verify website belongs to tenant and get plan info
    const { data: website, error: websiteError } = await supabaseServer
      .from('websites')
      .select('id, tenant_id')
      .eq('id', websiteId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (websiteError || !website) {
      return errorResponse('NOT_FOUND', 'Website not found', 404);
    }

    // Check plan limits
    const { count: pageCount, error: countError } = await supabaseServer
      .from('pages')
      .select('*', { count: 'exact', head: true })
      .eq('website_id', websiteId);

    if (countError) {
      console.error('Page count error:', countError);
      return errorResponse('INTERNAL_ERROR', 'Failed to check page limit', 500);
    }

    const maxPages = user.tenants.plans.max_pages_per_site;
    if ((pageCount ?? 0) >= maxPages) {
      return errorResponse(
        'PLAN_LIMIT_PAGES',
        `You have reached the maximum of ${maxPages} pages per website for your plan`,
        429,
        { 
          limit: maxPages, 
          current: pageCount,
          upgradeUrl: '/dashboard/billing' 
        }
      );
    }

    // Check slug uniqueness within website
    const { data: existingPage } = await supabaseServer
      .from('pages')
      .select('id')
      .eq('website_id', websiteId)
      .eq('slug', slug)
      .single();

    if (existingPage) {
      return errorResponse('SLUG_TAKEN', 'A page with this slug already exists', 409);
    }

    // Create page
    const { data: page, error: createError } = await supabaseServer
      .from('pages')
      .insert({
        website_id: websiteId,
        title: title.trim(),
        slug,
        status: 'draft',
        is_home: isHomePage,
      })
      .select()
      .single();

    if (createError) {
      console.error('Page creation error:', createError);
      return errorResponse('INTERNAL_ERROR', 'Failed to create page', 500);
    }

    return jsonResponse({ page }, 201);
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('POST /api/pages error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to create page', 500);
  }
}
