// app/api/assets/[id]/route.ts
import { NextRequest } from 'next/server';
import { 
  verifyRequestAndGetUser, 
  jsonResponse, 
  errorResponse, 
  ApiError 
} from '@/lib/auth-middleware';
import { supabaseServer } from '@/lib/supabase';
import { hasPermission } from '@/lib/rbac';
import { deleteFile } from '@/lib/cloudinary';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/assets/:id
 * Get a single asset
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyRequestAndGetUser(req);
    const { id } = await params;

    // Check permission
    if (!hasPermission(user.role, 'view')) {
      return errorResponse('FORBIDDEN', 'View permission required', 403);
    }

    // Fetch asset (tenant isolation)
    const { data: asset, error } = await supabaseServer
      .from('assets')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (error || !asset) {
      return errorResponse('NOT_FOUND', 'Asset not found', 404);
    }

    return jsonResponse({ asset });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('GET /api/assets/[id] error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch asset', 500);
  }
}

/**
 * PUT /api/assets/:id
 * Update asset metadata (display name, tags)
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyRequestAndGetUser(req);
    const { id } = await params;

    // Check permission
    if (!hasPermission(user.role, 'upload_assets')) {
      return errorResponse('FORBIDDEN', 'Upload permission required', 403);
    }

    // Parse request body
    const body = await req.json();
    const { display_name, tags } = body;

    // Verify asset belongs to tenant
    const { data: existing, error: fetchError } = await supabaseServer
      .from('assets')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (fetchError || !existing) {
      return errorResponse('NOT_FOUND', 'Asset not found', 404);
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (display_name !== undefined) updateData.display_name = display_name;
    if (tags !== undefined) updateData.tags = tags;

    // Update asset
    const { data: asset, error: updateError } = await supabaseServer
      .from('assets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Asset update error:', updateError);
      return errorResponse('INTERNAL_ERROR', 'Failed to update asset', 500);
    }

    return jsonResponse({ asset });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('PUT /api/assets/[id] error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to update asset', 500);
  }
}

/**
 * DELETE /api/assets/:id
 * Delete an asset from Cloudinary and database
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyRequestAndGetUser(req);
    const { id } = await params;

    // Check permission
    if (!hasPermission(user.role, 'admin')) {
      return errorResponse('FORBIDDEN', 'Admin permission required', 403);
    }

    // Fetch asset (tenant isolation)
    const { data: asset, error: fetchError } = await supabaseServer
      .from('assets')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (fetchError || !asset) {
      return errorResponse('NOT_FOUND', 'Asset not found', 404);
    }

    // Delete from Cloudinary
    try {
      await deleteFile(
        asset.cloudinary_public_id, 
        asset.asset_type as 'image' | 'video' | 'raw'
      );
    } catch (cloudinaryError) {
      console.error('Cloudinary delete error:', cloudinaryError);
      // Continue with DB deletion even if Cloudinary fails
    }

    // Delete from database
    const { error: deleteError } = await supabaseServer
      .from('assets')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Asset deletion error:', deleteError);
      return errorResponse('INTERNAL_ERROR', 'Failed to delete asset', 500);
    }

    return jsonResponse({ message: 'Asset deleted' });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('DELETE /api/assets/[id] error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to delete asset', 500);
  }
}
