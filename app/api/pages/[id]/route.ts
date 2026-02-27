// app/api/pages/[id]/route.ts
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

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/pages/:id
 * Get a single page with its components
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyRequestAndGetUser(req);
    const { id } = await params;

    // Check permission
    if (!hasPermission(user.role, 'view')) {
      return errorResponse('FORBIDDEN', 'View permission required', 403);
    }

    // Fetch page with components (tenant isolation via website join)
    const { data: page, error } = await supabaseServer
      .from('pages')
      .select(`
        *,
        websites!inner (tenant_id),
        components (*)
      `)
      .eq('id', id)
      .eq('websites.tenant_id', user.tenant_id)
      .single();

    if (error || !page) {
      return errorResponse('NOT_FOUND', 'Page not found', 404);
    }

    // Sort components by order_key
    if (page.components) {
      page.components.sort((a: { order_key: string }, b: { order_key: string }) => 
        a.order_key.localeCompare(b.order_key)
      );
    }

    // Remove the websites join from response
    const { websites: _, ...pageData } = page;

    return jsonResponse({ page: pageData });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('GET /api/pages/[id] error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch page', 500);
  }
}

/**
 * PUT /api/pages/:id
 * Update page title, slug, SEO meta, or status
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
    const { title, slug, seo_meta, status, show_in_nav, nav_label, nav_order, page_config } = body;

    // Verify page belongs to tenant
    const { data: existing, error: fetchError } = await supabaseServer
      .from('pages')
      .select(`
        *,
        websites!inner (tenant_id)
      `)
      .eq('id', id)
      .eq('websites.tenant_id', user.tenant_id)
      .single();

    if (fetchError || !existing) {
      return errorResponse('NOT_FOUND', 'Page not found', 404);
    }

    // Validate slug if changing
    if (slug !== undefined && slug !== existing.slug) {
      // Cannot change slug of home page
      if (existing.is_home) {
        return errorResponse('VALIDATION_ERROR', 'Cannot change the slug of the home page', 400);
      }

      if (!isValidPageSlug(slug)) {
        return errorResponse(
          'VALIDATION_ERROR', 
          'Slug must start with / and contain only lowercase letters, numbers, and hyphens', 
          400
        );
      }

      // Check slug uniqueness within website
      const { data: existingSlug } = await supabaseServer
        .from('pages')
        .select('id')
        .eq('website_id', existing.website_id)
        .eq('slug', slug)
        .neq('id', id)
        .single();

      if (existingSlug) {
        return errorResponse('SLUG_TAKEN', 'A page with this slug already exists', 409);
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (seo_meta !== undefined) updateData.seo_meta = seo_meta;
    if (status !== undefined) updateData.status = status;
    if (show_in_nav !== undefined) updateData.show_in_nav = show_in_nav;
    if (nav_label !== undefined) updateData.nav_label = nav_label;
    if (nav_order !== undefined) updateData.nav_order = nav_order;
    if (page_config !== undefined) updateData.page_config = page_config;

    // Update page
    const { data: page, error: updateError } = await supabaseServer
      .from('pages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Page update error:', updateError);
      return errorResponse('INTERNAL_ERROR', 'Failed to update page', 500);
    }

    return jsonResponse({ page });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('PUT /api/pages/[id] error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to update page', 500);
  }
}

/**
 * DELETE /api/pages/:id
 * Delete a page and all its components
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyRequestAndGetUser(req);
    const { id } = await params;

    // Check permission
    if (!hasPermission(user.role, 'admin')) {
      return errorResponse('FORBIDDEN', 'Admin permission required', 403);
    }

    // Verify page belongs to tenant
    const { data: existing, error: fetchError } = await supabaseServer
      .from('pages')
      .select(`
        *,
        websites!inner (tenant_id)
      `)
      .eq('id', id)
      .eq('websites.tenant_id', user.tenant_id)
      .single();

    if (fetchError || !existing) {
      return errorResponse('NOT_FOUND', 'Page not found', 404);
    }

    // Cannot delete home page
    if (existing.is_home) {
      return errorResponse('VALIDATION_ERROR', 'Cannot delete the home page', 400);
    }

    // Delete page (components will be deleted via CASCADE)
    const { error: deleteError } = await supabaseServer
      .from('pages')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Page deletion error:', deleteError);
      return errorResponse('INTERNAL_ERROR', 'Failed to delete page', 500);
    }

    return jsonResponse({ message: 'Page deleted' });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('DELETE /api/pages/[id] error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to delete page', 500);
  }
}
