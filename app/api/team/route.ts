// app/api/team/route.ts
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
 * GET /api/team
 * List all team members for the tenant
 */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyRequestAndGetUser(req);
    
    // Check permission
    if (!hasPermission(user.role, 'admin')) {
      return errorResponse('FORBIDDEN', 'Admin permission required', 403);
    }

    // Fetch all users in the tenant
    const { data: members, error } = await supabaseServer
      .from('users')
      .select(`
        id,
        email,
        full_name,
        avatar_url,
        role,
        is_active,
        last_login_at,
        invitation_accepted_at,
        created_at,
        invited_by_user:invited_by (
          id,
          full_name,
          email
        )
      `)
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Team fetch error:', error);
      return errorResponse('INTERNAL_ERROR', 'Failed to fetch team members', 500);
    }

    // Also fetch pending invitations
    const { data: invitations } = await supabaseServer
      .from('team_invitations')
      .select(`
        id,
        email,
        role,
        expires_at,
        created_at,
        invited_by_user:invited_by (
          id,
          full_name,
          email
        )
      `)
      .eq('tenant_id', user.tenant_id)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString());

    return jsonResponse({ 
      members, 
      pendingInvitations: invitations || [],
    });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('GET /api/team error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch team', 500);
  }
}
