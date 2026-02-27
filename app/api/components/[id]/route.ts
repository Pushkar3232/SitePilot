// app/api/components/[id]/route.ts
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
 * GET /api/components/:id
 * Get a single component
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyRequestAndGetUser(req);
    const { id } = await params;

    // Check permission
    if (!hasPermission(user.role, 'view')) {
      return errorResponse('FORBIDDEN', 'View permission required', 403);
    }

    // Fetch component with tenant verification via page → website join
    const { data: component, error } = await supabaseServer
      .from('components')
      .select(`
        *,
        pages!inner (
          id,
          websites!inner (tenant_id)
        )
      `)
      .eq('id', id)
      .eq('pages.websites.tenant_id', user.tenant_id)
      .single();

    if (error || !component) {
      return errorResponse('NOT_FOUND', 'Component not found', 404);
    }

    // Remove the joins from response
    const { pages: _, ...componentData } = component;

    return jsonResponse({ component: { ...componentData, type: componentData.component_type, props: componentData.content, is_visible: !componentData.is_locked } });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('GET /api/components/[id] error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch component', 500);
  }
}

/**
 * PUT /api/components/:id
 * Update a component's props or order
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
    const { props, order_key, is_visible } = body;

    // Verify component belongs to tenant
    const { data: existing, error: fetchError } = await supabaseServer
      .from('components')
      .select(`
        *,
        pages!inner (
          id,
          websites!inner (tenant_id)
        )
      `)
      .eq('id', id)
      .eq('pages.websites.tenant_id', user.tenant_id)
      .single();

    if (fetchError || !existing) {
      return errorResponse('NOT_FOUND', 'Component not found', 404);
    }

    // Check if component is locked (only owner/admin can edit)
    if (existing.is_locked && !hasPermission(user.role, 'admin')) {
      return errorResponse('FORBIDDEN', 'This component is locked and requires admin permission to edit', 403);
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (props !== undefined) updateData.content = props;
    if (order_key !== undefined) updateData.order_key = order_key;
    // is_visible is mapped to is_locked (inverted) since DB has no is_visible column
    if (is_visible !== undefined) updateData.is_locked = !is_visible;

    // Update component
    const { data: component, error: updateError } = await supabaseServer
      .from('components')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Component update error:', updateError);
      return errorResponse('INTERNAL_ERROR', 'Failed to update component', 500);
    }

    return jsonResponse({ component: { ...component, type: component.component_type, props: component.content, is_visible: !component.is_locked } });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('PUT /api/components/[id] error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to update component', 500);
  }
}

/**
 * DELETE /api/components/:id
 * Remove a component from a page
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyRequestAndGetUser(req);
    const { id } = await params;

    // Check permission
    if (!hasPermission(user.role, 'edit_content')) {
      return errorResponse('FORBIDDEN', 'Edit permission required', 403);
    }

    // Verify component belongs to tenant
    const { data: existing, error: fetchError } = await supabaseServer
      .from('components')
      .select(`
        *,
        pages!inner (
          id,
          websites!inner (tenant_id)
        )
      `)
      .eq('id', id)
      .eq('pages.websites.tenant_id', user.tenant_id)
      .single();

    if (fetchError || !existing) {
      return errorResponse('NOT_FOUND', 'Component not found', 404);
    }

    // Check if component is locked
    if (existing.is_locked && !hasPermission(user.role, 'admin')) {
      return errorResponse('FORBIDDEN', 'This component is locked and requires admin permission to delete', 403);
    }

    // Delete component
    const { error: deleteError } = await supabaseServer
      .from('components')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Component deletion error:', deleteError);
      return errorResponse('INTERNAL_ERROR', 'Failed to delete component', 500);
    }

    return jsonResponse({ message: 'Component deleted' });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('DELETE /api/components/[id] error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to delete component', 500);
  }
}
