// app/api/team/[userId]/route.ts
import { NextRequest } from 'next/server';
import { 
  verifyRequestAndGetUser, 
  jsonResponse, 
  errorResponse, 
  ApiError 
} from '@/lib/auth-middleware';
import { supabaseServer } from '@/lib/supabase';
import { hasPermission, canManageRole, type UserRole } from '@/lib/rbac';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

/**
 * PUT /api/team/:userId
 * Update a team member's role
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyRequestAndGetUser(req);
    const { userId } = await params;

    // Check permission
    if (!hasPermission(user.role, 'invite_users')) {
      return errorResponse('FORBIDDEN', 'Team management permission required', 403);
    }

    // Cannot modify yourself
    if (userId === user.id) {
      return errorResponse('VALIDATION_ERROR', 'Cannot modify your own account', 400);
    }

    // Parse request body
    const body = await req.json();
    const { role, is_active } = body;

    // Fetch target user
    const { data: targetUser, error: fetchError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (fetchError || !targetUser) {
      return errorResponse('NOT_FOUND', 'User not found', 404);
    }

    // Cannot modify owner
    if (targetUser.role === 'owner') {
      return errorResponse('FORBIDDEN', 'Cannot modify the owner account', 403);
    }

    // Check if user can manage the target role
    if (role && !canManageRole(user.role, role)) {
      return errorResponse('FORBIDDEN', `You cannot assign the ${role} role`, 403);
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (role !== undefined && role !== 'owner') updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update user
    const { data: updatedUser, error: updateError } = await supabaseServer
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('User update error:', updateError);
      return errorResponse('INTERNAL_ERROR', 'Failed to update user', 500);
    }

    return jsonResponse({ user: updatedUser });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('PUT /api/team/[userId] error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to update user', 500);
  }
}

/**
 * DELETE /api/team/:userId
 * Remove a user from the tenant
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyRequestAndGetUser(req);
    const { userId } = await params;

    // Check permission
    if (!hasPermission(user.role, 'invite_users')) {
      return errorResponse('FORBIDDEN', 'Team management permission required', 403);
    }

    // Cannot remove yourself
    if (userId === user.id) {
      return errorResponse('VALIDATION_ERROR', 'Cannot remove yourself from the team', 400);
    }

    // Fetch target user
    const { data: targetUser, error: fetchError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (fetchError || !targetUser) {
      return errorResponse('NOT_FOUND', 'User not found', 404);
    }

    // Cannot remove owner
    if (targetUser.role === 'owner') {
      return errorResponse('FORBIDDEN', 'Cannot remove the owner from the team', 403);
    }

    // Check if current user can manage the target's role
    if (!canManageRole(user.role as UserRole, targetUser.role as UserRole)) {
      return errorResponse('FORBIDDEN', 'You cannot remove this user', 403);
    }

    // Delete user
    const { error: deleteError } = await supabaseServer
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('User deletion error:', deleteError);
      return errorResponse('INTERNAL_ERROR', 'Failed to remove user', 500);
    }

    // Create audit log
    await supabaseServer.from('audit_logs').insert({
      tenant_id: user.tenant_id,
      performed_by: user.id,
      action: 'team.member_removed',
      resource_type: 'user',
      resource_id: userId,
      details: { email: targetUser.email, role: targetUser.role },
    });

    return jsonResponse({ message: 'User removed from team' });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('DELETE /api/team/[userId] error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to remove user', 500);
  }
}
