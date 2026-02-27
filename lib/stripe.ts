// lib/stripe.ts
import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
}

export const stripe = {
  customers: {
    create: async (...args: any[]) => getStripe().customers.create(...args),
  },
  checkout: {
    sessions: {
      create: async (...args: any[]) => getStripe().checkout.sessions.create(...args),
    },
  },
  billingPortal: {
    sessions: {
      create: async (...args: any[]) => getStripe().billingPortal.sessions.create(...args),
    },
  },
  webhooks: {
    constructEvent: (body: any, sig: any, secret: any) => getStripe().webhooks.constructEvent(body, sig, secret),
  },
} as unknown as Stripe;

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Create a Stripe customer for a new tenant
 */
export async function createStripeCustomer(email: string, name: string): Promise<string> {
  const customer = await getStripe().customers.create({
    email,
    name,
    metadata: {
      source: 'sitepilot',
    },
  });
  return customer.id;
}

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  });

  return session.url!;
}

/**
 * Create a Stripe Customer Portal session
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): Stripe.Event {
  return getStripe().webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
}
