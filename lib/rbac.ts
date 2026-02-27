// lib/rbac.ts
// Role-based access control helpers

export type UserRole = 'owner' | 'admin' | 'editor' | 'developer' | 'viewer';

export type Permission =
  | 'view'
  | 'edit_content'
  | 'publish_website'
  | 'admin'
  | 'manage_billing'
  | 'invite_users'
  | 'manage_domains'
  | 'use_ai'
  | 'upload_assets'
  | 'view_analytics';

// Role → Permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    'view',
    'edit_content',
    'publish_website',
    'admin',
    'manage_billing',
    'invite_users',
    'manage_domains',
    'use_ai',
    'upload_assets',
    'view_analytics',
  ],
  admin: [
    'view',
    'edit_content',
    'publish_website',
    'admin',
    'invite_users',
    'manage_domains',
    'use_ai',
    'upload_assets',
    'view_analytics',
  ],
  editor: [
    'view',
    'edit_content',
    'use_ai',
    'upload_assets',
  ],
  developer: [
    'view',
    'edit_content',
    'publish_website',
    'use_ai',
    'upload_assets',
    'manage_domains',
    'view_analytics',
  ],
  viewer: [
    'view',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] ?? [];
  return permissions.includes(permission);
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Check if a user can perform an action, throws an API error if not
 */
export function requirePermission(permission: Permission) {
  return (user: { role: UserRole }) => {
    if (!hasPermission(user.role, permission)) {
      const error = {
        error: 'FORBIDDEN',
        message: `This action requires '${permission}' permission`,
      };
      throw new Response(JSON.stringify(error), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}

/**
 * Validate that a role is valid
 */
export function isValidRole(role: string): role is UserRole {
  return ['owner', 'admin', 'editor', 'developer', 'viewer'].includes(role);
}

/**
 * Get the hierarchy level of a role (higher = more privileges)
 */
export function getRoleLevel(role: UserRole): number {
  const levels: Record<UserRole, number> = {
    owner: 5,
    admin: 4,
    developer: 3,
    editor: 2,
    viewer: 1,
  };
  return levels[role] ?? 0;
}

/**
 * Check if roleA can manage roleB (must be higher level)
 */
export function canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
  return getRoleLevel(managerRole) > getRoleLevel(targetRole);
}
