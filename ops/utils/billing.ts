/**
 * Billing Stub - Stripe integration with feature flag
 */

import { PrismaClient } from '@prisma/client';
import { isBillingEnabled } from './env';

const prisma = new PrismaClient();

export interface StripeWebhookEvent {
  type: string;
  data: {
    object: any;
  };
}

export async function handleStripeWebhook(
  event: StripeWebhookEvent,
  signature: string
): Promise<void> {
  if (!isBillingEnabled()) {
    console.log('Billing is disabled, ignoring webhook');
    return;
  }

  // Validate signature (would use Stripe SDK in production)
  // const isValid = stripe.webhooks.constructEvent(payload, signature, secret);
  
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionCancellation(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handlePaymentSuccess(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;
    default:
      console.log(`Unhandled webhook type: ${event.type}`);
  }
}

async function handleSubscriptionUpdate(subscription: any): Promise<void> {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan: subscription.metadata?.plan || 'pro',
      status: subscription.status,
      stripeId: subscription.id,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    },
    update: {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    }
  });
}

async function handleSubscriptionCancellation(subscription: any): Promise<void> {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  await prisma.subscription.update({
    where: { userId },
    data: {
      status: 'canceled'
    }
  });
}

async function handlePaymentSuccess(invoice: any): Promise<void> {
  // Log successful payment
  console.log(`Payment succeeded for invoice: ${invoice.id}`);
}

async function handlePaymentFailure(invoice: any): Promise<void> {
  const userId = invoice.metadata?.userId;
  if (!userId) return;

  await prisma.subscription.update({
    where: { userId },
    data: {
      status: 'past_due'
    }
  });
}

export async function createCheckoutSession(userId: string, plan: string): Promise<string> {
  if (!isBillingEnabled()) {
    throw new Error('Billing is disabled');
  }

  // In production, this would create a Stripe Checkout session
  // For now, return a mock session URL
  return `https://checkout.stripe.com/mock-session/${userId}/${plan}`;
}
