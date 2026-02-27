// app/api/team/invite/route.ts
import { NextRequest } from 'next/server';
import { 
  verifyRequestAndGetUser, 
  jsonResponse, 
  errorResponse, 
  ApiError 
} from '@/lib/auth-middleware';
import { supabaseServer } from '@/lib/supabase';
import { hasPermission, isValidRole, canManageRole } from '@/lib/rbac';
import { randomBytes } from 'crypto';

/**
 * POST /api/team/invite
 * Invite a new user to the tenant
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyRequestAndGetUser(req);
    
    // Check permission
    if (!hasPermission(user.role, 'invite_users')) {
      return errorResponse('FORBIDDEN', 'Invite permission required', 403);
    }

    // Parse request body
    const body = await req.json();
    const { email, role } = body;

    // Validate input
    if (!email || typeof email !== 'string') {
      return errorResponse('VALIDATION_ERROR', 'Email is required', 400);
    }
    if (!role || !isValidRole(role)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid role', 400);
    }

    // Cannot invite as owner
    if (role === 'owner') {
      return errorResponse('VALIDATION_ERROR', 'Cannot invite users as owner', 400);
    }

    // Check if inviter can manage this role
    if (!canManageRole(user.role, role)) {
      return errorResponse('FORBIDDEN', `You cannot invite users with ${role} role`, 403);
    }

    // Check collaborator limit
    const { count: memberCount, error: countError } = await supabaseServer
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', user.tenant_id)
      .eq('is_active', true);

    if (countError) {
      console.error('Member count error:', countError);
      return errorResponse('INTERNAL_ERROR', 'Failed to check team limit', 500);
    }

    const maxCollaborators = user.tenants.plans.max_collaborators;
    if ((memberCount ?? 0) >= maxCollaborators) {
      return errorResponse(
        'PLAN_LIMIT_TEAM',
        `You have reached the maximum of ${maxCollaborators} team members for your plan`,
        429,
        { 
          limit: maxCollaborators, 
          current: memberCount,
          upgradeUrl: '/dashboard/billing' 
        }
      );
    }

    // Check if user already exists in team
    const { data: existingUser } = await supabaseServer
      .from('users')
      .select('id')
      .eq('tenant_id', user.tenant_id)
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return errorResponse('CONFLICT', 'User is already a team member', 409);
    }

    // Check for pending invitation
    const { data: existingInvite } = await supabaseServer
      .from('team_invitations')
      .select('id')
      .eq('tenant_id', user.tenant_id)
      .eq('email', email.toLowerCase())
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingInvite) {
      return errorResponse('CONFLICT', 'An invitation is already pending for this email', 409);
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex');

    // Set expiry to 48 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    // Create invitation
    const { data: invitation, error: insertError } = await supabaseServer
      .from('team_invitations')
      .insert({
        tenant_id: user.tenant_id,
        email: email.toLowerCase(),
        role,
        invited_by: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Invitation creation error:', insertError);
      return errorResponse('INTERNAL_ERROR', 'Failed to create invitation', 500);
    }

    // TODO: Send invitation email
    // await sendInvitationEmail(email, token, user.tenants.name);

    return jsonResponse({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expires_at,
      },
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${token}`,
    }, 201);
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('POST /api/team/invite error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to send invitation', 500);
  }
}
