// app/api/tenants/onboard/route.ts
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase';
import { createStripeCustomer } from '@/lib/stripe';
import { jsonResponse, errorResponse } from '@/lib/auth-middleware';
import { generateUniqueSlug } from '@/lib/utils/slug';
import { generateKeyBetween } from 'fractional-indexing';

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
 * POST /api/tenants/onboard
 * Complete tenant onboarding - creates tenant, user, website, pages, and components
 */
export async function POST(req: NextRequest) {
  try {
    // Verify Supabase token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse('UNAUTHORIZED', 'Missing authorization token', 401);
    }

    const token = authHeader.slice(7);
    const supabaseAuth = createSupabaseAuth();
    const { data: { user: authUser }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !authUser) {
      return errorResponse('UNAUTHORIZED', 'Invalid authentication token', 401);
    }

    // Parse request body
    const body = await req.json();
    const { tenant, auth_user_id, email, full_name } = body;
    
    // Use auth_user_id from body or fall back to token user ID
    const userId = auth_user_id || authUser.id;

    // Validate input
    if (!tenant?.name || typeof tenant.name !== 'string' || tenant.name.length < 2 || tenant.name.length > 60) {
      return errorResponse('VALIDATION_ERROR', 'Organization name must be 2-60 characters', 400);
    }

    if (!tenant?.plan_id) {
      return errorResponse('VALIDATION_ERROR', 'Plan ID is required', 400);
    }

    if (!email) {
      return errorResponse('VALIDATION_ERROR', 'Email is required', 400);
    }

    // Check if user already has a tenant
    const { data: existingUser } = await supabaseServer
      .from('users')
      .select('id')
      .eq('supabase_auth_id', userId)
      .single();

    if (existingUser) {
      return errorResponse('CONFLICT', 'User already has an account', 409);
    }

    // Verify plan exists
    const { data: plan, error: planError } = await supabaseServer
      .from('plans')
      .select('*')
      .eq('id', tenant.plan_id)
      .single();

    if (planError || !plan) {
      return errorResponse('NOT_FOUND', 'Plan not found', 404);
    }

    // Generate unique slug for tenant/subdomain
    const slug = tenant.subdomain || generateUniqueSlug(tenant.name);

    // Create Stripe customer
    let stripeCustomerId: string | null = null;
    try {
      stripeCustomerId = await createStripeCustomer(
        email,
        tenant.name
      );
    } catch (stripeError) {
      console.error('Stripe customer creation failed:', stripeError);
      // Continue without Stripe customer - can be created later
    }

    // Start transaction-like operations
    // 1. Create tenant
    const { data: newTenant, error: tenantError } = await supabaseServer
      .from('tenants')
      .insert({
        name: tenant.name,
        slug,
        plan_id: tenant.plan_id,
        status: 'active',
        stripe_customer_id: stripeCustomerId,
        onboarding_completed: false,
      })
      .select()
      .single();

    if (tenantError) {
      console.error('Tenant creation error:', tenantError);
      return errorResponse('INTERNAL_ERROR', 'Failed to create organization', 500);
    }

    // 2. Create owner user
    const { data: user, error: userError } = await supabaseServer
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
      .select()
      .single();

    if (userError) {
      // Rollback: delete tenant
      await supabaseServer.from('tenants').delete().eq('id', newTenant.id);
      console.error('User creation error:', userError);
      return errorResponse('INTERNAL_ERROR', 'Failed to create user', 500);
    }

    // 3. Create default website
    const { data: website, error: websiteError } = await supabaseServer
      .from('websites')
      .insert({
        tenant_id: newTenant.id,
        name: tenant.name,
        subdomain: slug,
        status: 'draft',
        branding_config: {
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
          fontFamily: 'Inter',
        },
        seo_defaults: {
          title_template: `%s | ${tenant.name}`,
        },
      })
      .select()
      .single();

    if (websiteError) {
      // Rollback
      await supabaseServer.from('users').delete().eq('id', user.id);
      await supabaseServer.from('tenants').delete().eq('id', newTenant.id);
      console.error('Website creation error:', websiteError);
      return errorResponse('INTERNAL_ERROR', 'Failed to create website', 500);
    }

    // 4. Create default homepage
    const { data: homepage, error: pageError } = await supabaseServer
      .from('pages')
      .insert({
        website_id: website.id,
        title: 'Home',
        slug: '/',
        status: 'draft',
        is_home: true,
        show_in_nav: true,
        nav_order: 0,
      })
      .select()
      .single();

    if (pageError) {
      // Rollback
      await supabaseServer.from('websites').delete().eq('id', website.id);
      await supabaseServer.from('users').delete().eq('id', user.id);
      await supabaseServer.from('tenants').delete().eq('id', newTenant.id);
      console.error('Page creation error:', pageError);
      return errorResponse('INTERNAL_ERROR', 'Failed to create page', 500);
    }

    // 5. Create default components
    const defaultComponents = [
      {
        page_id: homepage.id,
        type: 'navbar',
        order_key: generateKeyBetween(null, null),
        props: {
          logo: null,
          links: [
            { label: 'Home', href: '/' },
            { label: 'About', href: '/about' },
            { label: 'Contact', href: '/contact' },
          ],
          style: 'default',
        },
      },
      {
        page_id: homepage.id,
        type: 'hero',
        order_key: generateKeyBetween('a0', null),
        props: {
          headline: `Welcome to ${tenant.name}`,
          subheadline: 'We are excited to have you here',
          ctaText: 'Get Started',
          ctaLink: '/contact',
          backgroundImage: null,
          style: 'centered',
        },
      },
      {
        page_id: homepage.id,
        type: 'features',
        order_key: generateKeyBetween('a1', null),
        props: {
          title: 'Our Services',
          subtitle: 'What we offer',
          features: [
            { icon: 'star', title: 'Quality', description: 'We deliver the best quality' },
            { icon: 'clock', title: 'Fast', description: 'Quick turnaround time' },
            { icon: 'shield', title: 'Reliable', description: 'You can count on us' },
          ],
          columns: 3,
        },
      },
      {
        page_id: homepage.id,
        type: 'cta',
        order_key: generateKeyBetween('a2', null),
        props: {
          headline: 'Ready to get started?',
          subheadline: 'Contact us today',
          buttonText: 'Contact Us',
          buttonLink: '/contact',
          style: 'banner',
        },
      },
      {
        page_id: homepage.id,
        type: 'footer',
        order_key: generateKeyBetween('a3', null),
        props: {
          copyright: `© ${new Date().getFullYear()} ${tenant.name}. All rights reserved.`,
          links: [
            { label: 'Privacy Policy', href: '/privacy' },
            { label: 'Terms of Service', href: '/terms' },
          ],
          socialLinks: [],
        },
      },
    ];

    const { error: componentsError } = await supabaseServer
      .from('components')
      .insert(defaultComponents);

    if (componentsError) {
      console.error('Components creation error:', componentsError);
      // Don't rollback - components can be added manually
    }

    // 6. Create subscription record
    if (stripeCustomerId) {
      await supabaseServer.from('subscriptions').insert({
        tenant_id: newTenant.id,
        stripe_customer_id: stripeCustomerId,
        status: 'active',
        billing_cycle: plan.price_monthly_cents === 0 ? 'none' : 'monthly',
      });
    }

    // 7. Create audit log entry
    await supabaseServer.from('audit_logs').insert({
      tenant_id: newTenant.id,
      performed_by: user.id,
      action: 'tenant.created',
      resource_type: 'tenant',
      resource_id: newTenant.id,
      details: { tenant_name: tenant.name, plan_id: tenant.plan_id },
    });

    return jsonResponse(
      {
        tenant: {
          ...newTenant,
          plans: plan,
        },
        user,
        website,
        message: 'Organization created successfully',
      },
      201
    );
  } catch (err) {
    console.error('Onboarding error:', err);
    const error = err as Error;

    if (error.message?.includes('auth/')) {
      return errorResponse('INVALID_TOKEN', 'Invalid authentication token', 401);
    }

    return errorResponse('INTERNAL_ERROR', 'Onboarding failed', 500);
  }
}
