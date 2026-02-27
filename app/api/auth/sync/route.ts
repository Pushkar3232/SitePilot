// app/api/auth/sync/route.ts
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase';
import { jsonResponse, errorResponse } from '@/lib/auth-middleware';

/**
 * Create Supabase client for token verification
 */
function createSupabaseAuth() {
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
 * POST /api/auth/sync
 * Sync Supabase user with database
 * Called after Supabase login to ensure user record exists
 */
export async function POST(req: NextRequest) {
  try {
    // Get the authorization token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse('UNAUTHORIZED', 'Missing authorization token', 401);
    }

    const token = authHeader.slice(7);

    // Verify Supabase token
    const supabaseAuth = createSupabaseAuth();
    const { data: { user: authUser }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !authUser) {
      return errorResponse('UNAUTHORIZED', 'Invalid authentication token', 401);
    }
    
    // Parse request body
    const body = await req.json();
    const { email, full_name, supabase_auth_id } = body;

    if (!email) {
      return errorResponse('VALIDATION_ERROR', 'Email is required', 400);
    }

    // Use supabase_auth_id from body or fall back to auth user ID
    const userId = supabase_auth_id || authUser.id;

    // First, try to find existing user
    const { data: existingUser, error: findError } = await supabaseServer
      .from('users')
      .select(`
        *,
        tenants (
          *,
          plans (*)
        )
      `)
      .eq('supabase_auth_id', userId)
      .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error finding user:', findError);
      return errorResponse('INTERNAL_ERROR', 'Failed to find user', 500);
    }

    if (!existingUser) {
      // User doesn't exist in our database but exists in Supabase Auth
      // Auto-onboard them with default settings
      console.log('Auto-onboarding existing auth user:', userId);
      
      try {
        // Create default tenant and user for this auth user
        const defaultOrgName = full_name || 
                              authUser.user_metadata?.full_name || 
                              email.split('@')[0] || 
                              'My Organization';
        
        // Check if default plans exist
        const { data: starterPlan } = await supabaseServer
          .from('plans')
          .select('id') 
          .eq('id', 'plan_starter')
          .single();

        if (!starterPlan) {
          // Plans don't exist, create them first
          const { error: plansError } = await supabaseServer
            .from('plans')
            .upsert([
              {
                id: 'plan_starter',
                name: 'Starter', 
                slug: 'starter',
                description: 'Perfect for individuals getting started',
                is_active: true,
                max_websites: 2,
                max_pages_per_site: 10,
                storage_limit_mb: 100,
                ai_credits_per_month: 10,
                custom_domain_allowed: false,
                version_history_limit: 3,
                collaboration_enabled: false,
                max_collaborators: 1,
                analytics_enabled: true,
                priority_support: false,
                price_monthly_cents: 0,
                price_yearly_cents: 0,
                display_order: 1,
                badge_text: 'Free'
              }
            ]);
          
          if (plansError) {
            console.error('Failed to create default plan:', plansError);
            return errorResponse('INTERNAL_ERROR', 'Failed to set up default plan', 500);
          }
        }

        // Generate unique slug for tenant
        const baseSlug = defaultOrgName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const tenantSlug = `${baseSlug}-${randomSuffix}`;

        // Create tenant
        const { data: newTenant, error: tenantError } = await supabaseServer
          .from('tenants')
          .insert({
            name: defaultOrgName,
            slug: tenantSlug,
            plan_id: 'plan_starter',
            onboarding_completed: false,
          })
          .select()
          .single();

        if (tenantError) {
          console.error('Failed to create tenant:', tenantError);
          return errorResponse('INTERNAL_ERROR', 'Failed to create organization', 500);
        }

        // Create user record
        const { data: newUser, error: userError } = await supabaseServer
          .from('users')
          .insert({
            supabase_auth_id: userId,
            email: email,
            full_name: full_name || authUser.user_metadata?.full_name || null,
            avatar_url: authUser.user_metadata?.avatar_url || null,
            tenant_id: newTenant.id,
            role: 'owner',
            last_login_at: new Date().toISOString(),
          })
          .select(`
            *,
            tenants (
              *,
              plans (*)
            )
          `)
          .single();

        if (userError) {
          // Cleanup: delete the tenant if user creation fails
          await supabaseServer.from('tenants').delete().eq('id', newTenant.id);
          console.error('Failed to create user:', userError);
          return errorResponse('INTERNAL_ERROR', 'Failed to create user record', 500);
        }

        console.log('Successfully auto-onboarded user:', newUser.id);
        return jsonResponse({ user: newUser });

      } catch (onboardError) {
        console.error('Auto-onboarding failed:', onboardError);
        return errorResponse('INTERNAL_ERROR', 'Failed to complete user setup', 500);
      }
    }

    // User exists, update their login time and profile
    const { data: user, error } = await supabaseServer
      .from('users')
      .update({
        email: email || existingUser.email,
        full_name: full_name || authUser.user_metadata?.full_name || existingUser.full_name,
        avatar_url: authUser.user_metadata?.avatar_url || existingUser.avatar_url,
        last_login_at: new Date().toISOString(),
      })
      .eq('supabase_auth_id', userId)
      .select(`
        *,
        tenants (
          *,
          plans (*)
        )
      `)
      .single();

    if (error) {
      console.error('User update error:', error);
      return errorResponse('INTERNAL_ERROR', 'Failed to update user', 500);
    }

    return jsonResponse({ user });
  } catch (err) {
    console.error('Auth sync error:', err);
    const error = err as Error;
    
    if (error.message?.includes('auth/')) {
      return errorResponse('INVALID_TOKEN', 'Invalid authentication token', 401);
    }
    
    return errorResponse('INTERNAL_ERROR', 'Authentication sync failed', 500);
  }
}
