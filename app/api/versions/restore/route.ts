// app/api/versions/restore/route.ts
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
 * POST /api/versions/restore
 * Restore a page to a previous version
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
    const { versionId, pageId } = body;

    if (!versionId) {
      return errorResponse('VALIDATION_ERROR', 'versionId is required', 400);
    }
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

    // Fetch the version to restore
    const { data: version, error: versionError } = await supabaseServer
      .from('page_versions')
      .select('*')
      .eq('id', versionId)
      .eq('page_id', pageId)
      .single();

    if (versionError || !version) {
      return errorResponse('NOT_FOUND', 'Version not found', 404);
    }

    // First, save current state as a "before restore" version
    const { data: currentComponents } = await supabaseServer
      .from('components')
      .select('*')
      .eq('page_id', pageId)
      .order('order_key', { ascending: true });

    if (currentComponents && currentComponents.length > 0) {
      const currentSnapshot = currentComponents.map(c => ({
        id: c.id,
        type: c.type,
        props: c.props,
        order_key: c.order_key,
        is_visible: c.is_visible,
      }));

      await supabaseServer.from('page_versions').insert({
        page_id: pageId,
        saved_by: user.id,
        content_snapshot: currentSnapshot,
        label: 'Before restore',
        trigger: 'pre_restore',
      });
    }

    // Delete current components
    await supabaseServer
      .from('components')
      .delete()
      .eq('page_id', pageId);

    // Restore components from version snapshot
    const contentSnapshot = version.content_snapshot as Array<{
      type: string;
      props: Record<string, unknown>;
      order_key: string;
      is_visible: boolean;
    }>;

    const componentsToInsert = contentSnapshot.map(comp => ({
      page_id: pageId,
      type: comp.type,
      props: comp.props,
      order_key: comp.order_key,
      is_visible: comp.is_visible,
    }));

    const { data: restoredComponents, error: insertError } = await supabaseServer
      .from('components')
      .insert(componentsToInsert)
      .select();

    if (insertError) {
      console.error('Component restoration error:', insertError);
      return errorResponse('INTERNAL_ERROR', 'Failed to restore components', 500);
    }

    return jsonResponse({
      message: 'Version restored',
      components: restoredComponents,
    });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('POST /api/versions/restore error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to restore version', 500);
  }
}
