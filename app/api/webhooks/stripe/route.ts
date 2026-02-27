// app/api/webhooks/stripe/route.ts
import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { verifyWebhookSignature } from '@/lib/stripe';
import Stripe from 'stripe';

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return new Response('Missing signature', { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(body, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response('Invalid signature', { status: 400 });
    }

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Always return 200 to acknowledge receipt
    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    // Still return 200 to prevent Stripe from retrying
    return new Response('Error processed', { status: 200 });
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;
  const status = subscription.status;

  // Find tenant by Stripe customer ID
  const { data: tenant, error: tenantError } = await supabaseServer
    .from('tenants')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (tenantError || !tenant) {
    console.error('Tenant not found for customer:', customerId);
    return;
  }

  // Find plan by Stripe price ID
  const { data: plan } = await supabaseServer
    .from('plans')
    .select('id')
    .or(`stripe_monthly_price_id.eq.${priceId},stripe_yearly_price_id.eq.${priceId}`)
    .single();

  if (plan) {
    // Update tenant's plan
    await supabaseServer
      .from('tenants')
      .update({ 
        plan_id: plan.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenant.id);
  }

  // Update subscription record
  const periodStart = (subscription as unknown as { current_period_start: number }).current_period_start;
  const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
  
  await supabaseServer
    .from('subscriptions')
    .upsert({
      tenant_id: tenant.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      stripe_price_id: priceId,
      status: mapStripeStatus(status),
      billing_cycle: subscription.items.data[0]?.price.recurring?.interval === 'year' ? 'yearly' : 'monthly',
      current_period_start: new Date(periodStart * 1000).toISOString(),
      current_period_end: new Date(periodEnd * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'tenant_id',
    });

  // Log the event
  await supabaseServer.from('audit_logs').insert({
    tenant_id: tenant.id,
    action: 'billing.subscription_updated',
    resource_type: 'subscription',
    resource_id: subscription.id,
    details: { status, priceId },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find tenant
  const { data: tenant } = await supabaseServer
    .from('tenants')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!tenant) return;

  // Find starter (free) plan
  const { data: starterPlan } = await supabaseServer
    .from('plans')
    .select('id')
    .eq('slug', 'starter')
    .single();

  if (starterPlan) {
    // Downgrade to starter plan
    await supabaseServer
      .from('tenants')
      .update({ 
        plan_id: starterPlan.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenant.id);
  }

  // Update subscription status
  await supabaseServer
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', tenant.id);

  // Log the event
  await supabaseServer.from('audit_logs').insert({
    tenant_id: tenant.id,
    action: 'billing.subscription_cancelled',
    resource_type: 'subscription',
    resource_id: subscription.id,
    details: {},
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Find tenant
  const { data: tenant } = await supabaseServer
    .from('tenants')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!tenant) return;

  // Update subscription status to past_due
  await supabaseServer
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', tenant.id);

  // Log the event
  await supabaseServer.from('audit_logs').insert({
    tenant_id: tenant.id,
    action: 'billing.payment_failed',
    resource_type: 'invoice',
    resource_id: invoice.id,
    details: { amountDue: invoice.amount_due },
  });

  // TODO: Send payment failed email
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Find tenant
  const { data: tenant } = await supabaseServer
    .from('tenants')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!tenant) return;

  // Update subscription status to active
  await supabaseServer
    .from('subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', tenant.id);

  // Log the event
  await supabaseServer.from('audit_logs').insert({
    tenant_id: tenant.id,
    action: 'billing.payment_succeeded',
    resource_type: 'invoice',
    resource_id: invoice.id,
    details: { amountPaid: invoice.amount_paid },
  });
}

function mapStripeStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'cancelled',
    unpaid: 'unpaid',
    incomplete: 'incomplete',
    incomplete_expired: 'incomplete',
    paused: 'paused',
  };
  return statusMap[status] || 'active';
}
