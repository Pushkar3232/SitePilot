// app/api/assets/route.ts
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
 * GET /api/assets
 * List all assets uploaded by the tenant
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
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query
    let query = supabaseServer
      .from('assets')
      .select('*', { count: 'exact' })
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by type if provided
    if (type && ['image', 'video', 'raw', 'audio'].includes(type)) {
      query = query.eq('asset_type', type);
    }

    const { data: assets, error, count } = await query;

    if (error) {
      console.error('Assets fetch error:', error);
      return errorResponse('INTERNAL_ERROR', 'Failed to fetch assets', 500);
    }

    return jsonResponse({ 
      assets, 
      total: count,
      limit,
      offset,
    });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('GET /api/assets error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch assets', 500);
  }
}
