// app/api/websites/[id]/route.ts
import { NextRequest } from 'next/server';
import { 
  verifyRequestAndGetUser, 
  jsonResponse, 
  errorResponse, 
  ApiError 
} from '@/lib/auth-middleware';
import { supabaseServer } from '@/lib/supabase';
import { hasPermission } from '@/lib/rbac';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/websites/:id
 * Get a single website with its pages
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyRequestAndGetUser(req);
    const { id } = await params;

    // Check permission
    if (!hasPermission(user.role, 'view')) {
      return errorResponse('FORBIDDEN', 'View permission required', 403);
    }

    // Fetch website with pages (tenant isolation)
    const { data: website, error } = await supabaseServer
      .from('websites')
      .select(`
        *,
        pages (
          id,
          title,
          slug,
          status,
          is_home,
          show_in_nav,
          nav_order,
          nav_label,
          seo_meta,
          created_at,
          updated_at
        )
      `)
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (error || !website) {
      return errorResponse('NOT_FOUND', 'Website not found', 404);
    }

    // Sort pages by nav_order
    if (website.pages) {
      website.pages.sort((a: { nav_order: number }, b: { nav_order: number }) => a.nav_order - b.nav_order);
    }

    return jsonResponse({ website });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('GET /api/websites/[id] error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch website', 500);
  }
}

/**
 * PUT /api/websites/:id
 * Update website metadata
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyRequestAndGetUser(req);
    const { id } = await params;

    // Check permission
    if (!hasPermission(user.role, 'edit_content')) {
      return errorResponse('FORBIDDEN', 'Edit permission required', 403);
    }

    // Parse request body
    const body = await req.json();
    const { 
      name, 
      description, 
      branding_config, 
      seo_defaults, 
      favicon_url,
      analytics_enabled 
    } = body;

    // Verify website belongs to tenant
    const { data: existing, error: fetchError } = await supabaseServer
      .from('websites')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (fetchError || !existing) {
      return errorResponse('NOT_FOUND', 'Website not found', 404);
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (branding_config !== undefined) updateData.branding_config = branding_config;
    if (seo_defaults !== undefined) updateData.seo_defaults = seo_defaults;
    if (favicon_url !== undefined) updateData.favicon_url = favicon_url;
    if (analytics_enabled !== undefined) updateData.analytics_enabled = analytics_enabled;

    // Update website
    const { data: website, error: updateError } = await supabaseServer
      .from('websites')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Website update error:', updateError);
      return errorResponse('INTERNAL_ERROR', 'Failed to update website', 500);
    }

    return jsonResponse({ website });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('PUT /api/websites/[id] error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to update website', 500);
  }
}

/**
 * DELETE /api/websites/:id
 * Archive a website (soft delete)
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyRequestAndGetUser(req);
    const { id } = await params;

    // Check permission
    if (!hasPermission(user.role, 'admin')) {
      return errorResponse('FORBIDDEN', 'Admin permission required', 403);
    }

    // Verify website belongs to tenant
    const { data: existing, error: fetchError } = await supabaseServer
      .from('websites')
      .select('id, name')
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (fetchError || !existing) {
      return errorResponse('NOT_FOUND', 'Website not found', 404);
    }

    // Soft delete - set status to archived
    const { error: updateError } = await supabaseServer
      .from('websites')
      .update({ 
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Website archive error:', updateError);
      return errorResponse('INTERNAL_ERROR', 'Failed to archive website', 500);
    }

    // Create audit log
    await supabaseServer.from('audit_logs').insert({
      tenant_id: user.tenant_id,
      performed_by: user.id,
      action: 'website.archived',
      resource_type: 'website',
      resource_id: id,
      details: { name: existing.name },
    });

    return jsonResponse({ message: 'Website archived successfully' });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('DELETE /api/websites/[id] error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to archive website', 500);
  }
}
