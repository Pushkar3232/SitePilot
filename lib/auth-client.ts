// lib/auth-client.ts
'use client';

import { supabase } from '@/lib/supabase-client';

interface AuthUser {
  id: string;
  email: string;
  supabase_auth_id: string;
}

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  orgName: string;
  selectedPlan?: string;
}

interface SignInData {
  email: string;
  password: string;
}

export class AuthService {
  static async signUp(data: SignUpData): Promise<{ user: AuthUser; error?: string; userData?: any }> {
    try {
      // First, create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          // Disable email confirmation in development
          emailRedirectTo: process.env.NODE_ENV === 'development' ? undefined : `${window.location.origin}/auth/callback`,
          data: {
            full_name: data.fullName,
            org_name: data.orgName,
            selected_plan: data.selectedPlan || 'plan_starter'
          }
        }
      });

      if (authError) {
        // Handle rate limit specifically
        if (authError.message?.includes('rate limit') || authError.message?.includes('429')) {
          return { user: null as any, error: 'Too many signup attempts. Please wait a few minutes and try again.' };
        }
        return { user: null as any, error: authError.message };
      }

      if (!authData.user) {
        return { user: null as any, error: 'Failed to create user' };
      }

      // Check if user needs email confirmation
      if (!authData.session && authData.user && !authData.user.email_confirmed_at) {
        return { 
          user: null as any, 
          error: 'Please check your email and click the confirmation link to complete registration.' 
        };
      }

      // Call our onboarding API to create tenant and user records
      const response = await fetch('/api/tenants/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.session?.access_token || authData.user.id}`,
        },
        body: JSON.stringify({
          auth_user_id: authData.user.id,
          email: data.email,
          full_name: data.fullName,
          tenant: {
            name: data.orgName,
            subdomain: data.orgName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            plan_id: data.selectedPlan || 'plan_starter'
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Onboarding API error:', errorData);
        
        // Don't fail the signup if onboarding fails - the sync API will handle it
        console.warn('Onboarding failed, but auth user created. Sync will handle onboarding on login.');
      }
      
      return {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          supabase_auth_id: authData.user.id
        }
      };

    } catch (error) {
      return {
        user: null as any,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  static async signIn(data: SignInData): Promise<{ user: AuthUser; error?: string; userData?: any }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        return { user: null as any, error: authError.message };
      }

      if (!authData.user) {
        return { user: null as any, error: 'Invalid credentials' };
      }

      // Sync user with our backend
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.session?.access_token || authData.user.id}`,
        },
        body: JSON.stringify({
          supabase_auth_id: authData.user.id,
          email: authData.user.email,
          full_name: authData.user.user_metadata?.full_name
        }),
      });

      if (!response.ok) {
        console.error('Failed to sync user with backend:', response.status, response.statusText);
        return { user: null as any, error: 'Failed to sync user data. Please try again.' };
      }

      // Get the user data from the sync response
      const syncData = await response.json();
      console.log('User sync successful:', syncData);

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          supabase_auth_id: authData.user.id
        },
        userData: syncData.user // Include the full user data for the UI
      };

    } catch (error) {
      return {
        user: null as any,
        error: error instanceof Error ? error.message : 'Sign in failed'
      };
    }
  }

  static async signOut(): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { error: error.message };
      }
      return {};
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Sign out failed' };
    }
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      return {
        id: user.id,
        email: user.email!,
        supabase_auth_id: user.id
      };
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  static async signInWithGoogle(): Promise<{ user?: AuthUser; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        return { error: error.message };
      }

      // The user will be redirected to Google and back
      return {};
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Google sign in failed' };
    }
  }
}

export default AuthService;