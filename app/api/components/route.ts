// app/api/components/route.ts
import { NextRequest } from 'next/server';
import { 
  verifyRequestAndGetUser, 
  jsonResponse, 
  errorResponse, 
  ApiError 
} from '@/lib/auth-middleware';
import { supabaseServer } from '@/lib/supabase';
import { hasPermission } from '@/lib/rbac';

// Valid component types
const COMPONENT_TYPES = [
  'navbar',
  'hero',
  'features',
  'gallery',
  'testimonials',
  'pricing',
  'cta',
  'contact_form',
  'team',
  'faq',
  'stats',
  'blog_grid',
  'video_embed',
  'map',
  'rich_text',
  'image_text',
  'footer',
  'custom_html',
];

/**
 * GET /api/components
 * Fetch all components for a specific page
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
    const pageId = searchParams.get('pageId');

    if (!pageId) {
      return errorResponse('VALIDATION_ERROR', 'pageId is required', 400);
    }

    // Verify page belongs to tenant (via website join)
    const { data: page, error: pageError } = await supabaseServer
      .from('pages')
      .select(`
        id,
        websites!inner (tenant_id)
      `)
      .eq('id', pageId)
      .eq('websites.tenant_id', user.tenant_id)
      .single();

    if (pageError || !page) {
      return errorResponse('NOT_FOUND', 'Page not found', 404);
    }

    // Fetch components
    const { data: components, error } = await supabaseServer
      .from('components')
      .select('*')
      .eq('page_id', pageId)
      .order('order_key', { ascending: true });

    if (error) {
      console.error('Components fetch error:', error);
      return errorResponse('INTERNAL_ERROR', 'Failed to fetch components', 500);
    }

    return jsonResponse({ components: components.map((c: Record<string, unknown>) => ({
      ...c,
      type: c.component_type,
      props: c.content,
      is_visible: !c.is_locked,
    })) });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('GET /api/components error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch components', 500);
  }
}

/**
 * POST /api/components
 * Add a new component to a page
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
    const { pageId, type, props, order_key } = body;

    // Validate input
    if (!pageId) {
      return errorResponse('VALIDATION_ERROR', 'pageId is required', 400);
    }
    if (!type || !COMPONENT_TYPES.includes(type)) {
      return errorResponse(
        'VALIDATION_ERROR', 
        `Invalid component type. Must be one of: ${COMPONENT_TYPES.join(', ')}`, 
        400
      );
    }
    if (!props || typeof props !== 'object') {
      return errorResponse('VALIDATION_ERROR', 'Component props are required', 400);
    }
    if (!order_key || typeof order_key !== 'string') {
      return errorResponse('VALIDATION_ERROR', 'order_key is required', 400);
    }

    // Verify page belongs to tenant
    const { data: page, error: pageError } = await supabaseServer
      .from('pages')
      .select(`
        id,
        websites!inner (tenant_id)
      `)
      .eq('id', pageId)
      .eq('websites.tenant_id', user.tenant_id)
      .single();

    if (pageError || !page) {
      return errorResponse('NOT_FOUND', 'Page not found', 404);
    }

    // Check plan restrictions for certain component types
    if (type === 'custom_html' && user.tenants.plans.slug !== 'pro') {
      return errorResponse(
        'FEATURE_NOT_ALLOWED',
        'Custom HTML blocks are only available on the Pro plan',
        403,
        { upgradeUrl: '/dashboard/billing' }
      );
    }

    // Create component
    const { data: component, error: createError } = await supabaseServer
      .from('components')
      .insert({
        page_id: pageId,
        component_type: type,
        content: props,
        order_key,
        is_locked: false,
      })
      .select()
      .single();

    if (createError) {
      console.error('Component creation error:', createError);
      return errorResponse('INTERNAL_ERROR', 'Failed to create component', 500);
    }

    return jsonResponse({ component: { ...component, type: component.component_type, props: component.content, is_visible: true } }, 201);
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('POST /api/components error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to create component', 500);
  }
}
