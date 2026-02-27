// lib/auth-middleware.ts
import { adminAuth } from '@/lib/firebase-admin';
import { supabaseServer, type User, type Tenant, type Plan } from '@/lib/supabase';
import { type Permission, hasPermission, type UserRole } from '@/lib/rbac';
import { createClient } from '@supabase/supabase-js';

export interface AuthenticatedUser extends User {
  tenants: Tenant & {
    plans: Plan;
  };
}

export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status: number = 500,
    public data?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }

  toResponse(): Response {
    return new Response(
      JSON.stringify({
        error: this.code,
        message: this.message,
        ...this.data,
      }),
      {
        status: this.status,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Create Supabase client for token verification
 */
function createSupabaseClientForAuth() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Verify the Supabase JWT token and return the authenticated user with tenant info
 */
export async function verifyRequestAndGetUser(req: Request): Promise<AuthenticatedUser> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError('UNAUTHORIZED', 'Missing or invalid authorization header', 401);
  }

  const token = authHeader.slice(7);

  try {
    let authUserId: string;

    // Try Supabase authentication first
    try {
      const supabaseAuth = createSupabaseClientForAuth();
      const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
      
      if (user && !error) {
        authUserId = user.id;
      } else {
        console.warn('Supabase token verification failed:', error?.message || 'No user returned');
        throw new Error('Invalid Supabase token');
      }
    } catch (supabaseError) {
      console.warn('Supabase auth error:', supabaseError instanceof Error ? supabaseError.message : supabaseError);
      // Fallback to Firebase authentication for backward compatibility
      if (adminAuth) {
        console.warn('🔧 Fallback: Using Firebase authentication');
        try {
          const decoded = await adminAuth.verifyIdToken(token);
          authUserId = decoded.uid;
        } catch (firebaseError) {
          console.error('Firebase auth also failed:', firebaseError instanceof Error ? firebaseError.message : firebaseError);
          throw new ApiError('UNAUTHORIZED', 'Invalid authentication token', 401);
        }
      } else {
        // Development mode: use token as auth_user_id directly
        console.warn('🔧 Development mode: Using token as auth_user_id');
        authUserId = token;
      }
    }

    // Fetch user row from Supabase (includes role + tenant + plan)
    // Try supabase_auth_id first, then fall back to firebase_id for backward compatibility
    let user: any = null;
    let fetchError: any = null;

    const { data: userBySupabase, error: errSupabase } = await supabaseServer
      .from('users')
      .select(`
        *,
        tenants (
          *,
          plans (*)
        )
      `)
      .eq('supabase_auth_id', authUserId)
      .single();

    if (userBySupabase && !errSupabase) {
      user = userBySupabase;
    } else {
      // Fallback: try firebase_id for legacy users
      const { data: userByFirebase, error: errFirebase } = await supabaseServer
        .from('users')
        .select(`
          *,
          tenants (
            *,
            plans (*)
          )
        `)
        .eq('firebase_id', authUserId)
        .single();

      user = userByFirebase;
      fetchError = errFirebase;
    }

    if (!user) {
      throw new ApiError('USER_NOT_FOUND', 'User not found in database', 401);
    }

    if (!user.is_active) {
      throw new ApiError('USER_DEACTIVATED', 'User account has been deactivated', 403);
    }

    if (user.tenants.status === 'suspended') {
      throw new ApiError('TENANT_SUSPENDED', 'Your organization has been suspended', 403);
    }

    if (user.tenants.status === 'offboarded') {
      throw new ApiError('TENANT_OFFBOARDED', 'Your organization has been offboarded', 403);
    }

    // Update last_active_at for the tenant (async, don't wait)
    supabaseServer
      .from('tenants')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', user.tenant_id)
      .then(() => {});

    return user as AuthenticatedUser;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    
    // Firebase token verification errors
    const error = err as Error;
    if (error.message?.includes('auth/id-token-expired')) {
      throw new ApiError('TOKEN_EXPIRED', 'Authentication token has expired', 401);
    }
    if (error.message?.includes('auth/argument-error')) {
      throw new ApiError('INVALID_TOKEN', 'Invalid authentication token', 401);
    }
    
    throw new ApiError('UNAUTHORIZED', 'Failed to verify authentication', 401);
  }
}

/**
 * Wrapper for API route handlers with authentication
 */
export function withAuth<T>(
  handler: (req: Request, user: AuthenticatedUser) => Promise<T>,
  options?: { permission?: Permission }
) {
  return async (req: Request): Promise<Response> => {
    try {
      const user = await verifyRequestAndGetUser(req);

      // Check permission if specified
      if (options?.permission && !hasPermission(user.role as UserRole, options.permission)) {
        throw new ApiError(
          'FORBIDDEN',
          `This action requires '${options.permission}' permission`,
          403
        );
      }

      const result = await handler(req, user);
      
      // If handler returns a Response, return it directly
      if (result instanceof Response) {
        return result;
      }

      // Otherwise, JSON serialize the result
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      if (err instanceof ApiError) {
        return err.toResponse();
      }
      if (err instanceof Response) {
        return err;
      }

      console.error('API Error:', err);
      return new ApiError('INTERNAL_ERROR', 'An unexpected error occurred', 500).toResponse();
    }
  };
}

/**
 * Create a standardized JSON response
 */
export function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Create an error response
 */
export function errorResponse(
  code: string,
  message: string,
  status: number = 500,
  extra?: Record<string, unknown>
): Response {
  return new Response(
    JSON.stringify({ error: code, message, ...extra }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
