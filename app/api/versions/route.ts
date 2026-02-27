// app/api/versions/route.ts
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
 * GET /api/versions
 * List version history for a page
 */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyRequestAndGetUser(req);
    
    // Check permission
    if (!hasPermission(user.role, 'edit_content')) {
      return errorResponse('FORBIDDEN', 'Edit permission required', 403);
    }

    // Get query params
    const { searchParams } = new URL(req.url);
    const pageId = searchParams.get('pageId');

    if (!pageId) {
      return errorResponse('VALIDATION_ERROR', 'pageId is required', 400);
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

    // Fetch versions (without content_snapshot for performance)
    const { data: versions, error } = await supabaseServer
      .from('page_versions')
      .select(`
        id,
        page_id,
        saved_by,
        label,
        trigger,
        saved_at,
        users:saved_by (full_name, email)
      `)
      .eq('page_id', pageId)
      .order('saved_at', { ascending: false })
      .limit(user.tenants.plans.version_history_limit);

    if (error) {
      console.error('Versions fetch error:', error);
      return errorResponse('INTERNAL_ERROR', 'Failed to fetch versions', 500);
    }

    return jsonResponse({ versions });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('GET /api/versions error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch versions', 500);
  }
}

/**
 * POST /api/versions
 * Create a manual version snapshot
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
    const { pageId, label } = body;

    if (!pageId) {
      return errorResponse('VALIDATION_ERROR', 'pageId is required', 400);
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

    // Get current components for snapshot
    const { data: components, error: componentsError } = await supabaseServer
      .from('components')
      .select('*')
      .eq('page_id', pageId)
      .order('order_key', { ascending: true });

    if (componentsError) {
      console.error('Components fetch error:', componentsError);
      return errorResponse('INTERNAL_ERROR', 'Failed to fetch components', 500);
    }

    // Create snapshot
    const contentSnapshot = components.map(c => ({
      id: c.id,
      type: c.type,
      props: c.props,
      order_key: c.order_key,
      is_visible: c.is_visible,
    }));

    // Insert version
    const { data: version, error: insertError } = await supabaseServer
      .from('page_versions')
      .insert({
        page_id: pageId,
        saved_by: user.id,
        content_snapshot: contentSnapshot,
        label: label || `Manual save — ${new Date().toLocaleString()}`,
        trigger: 'manual',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Version creation error:', insertError);
      return errorResponse('INTERNAL_ERROR', 'Failed to create version', 500);
    }

    // Prune old versions if over limit
    const limit = user.tenants.plans.version_history_limit;
    const { data: allVersions } = await supabaseServer
      .from('page_versions')
      .select('id')
      .eq('page_id', pageId)
      .order('saved_at', { ascending: false });

    if (allVersions && allVersions.length > limit) {
      const versionsToDelete = allVersions.slice(limit).map(v => v.id);
      await supabaseServer
        .from('page_versions')
        .delete()
        .in('id', versionsToDelete);
    }

    return jsonResponse({ version }, 201);
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('POST /api/versions error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to create version', 500);
  }
}
