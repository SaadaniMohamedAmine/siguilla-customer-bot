import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, StripeNotConfiguredError } from "@/lib/stripe/client";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

function planFromPriceId(priceId: string | undefined): "pro" | "team" | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_ID_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_ID_TEAM) return "team";
  return null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch (err) {
    if (err instanceof StripeNotConfiguredError) return NextResponse.json({ error: "billing_unavailable" }, { status: 503 });
    throw err;
  }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[webhooks/stripe] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await prisma.stripeEvent.create({ data: { id: event.id, type: event.type } });
  } catch {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const organizationId = checkoutSession.metadata?.organizationId;
        const subscriptionId =
          typeof checkoutSession.subscription === "string"
            ? checkoutSession.subscription
            : checkoutSession.subscription?.id;
        if (organizationId && subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const plan = planFromPriceId(subscription.items.data[0]?.price.id);
          if (plan) {
            await prisma.organization.update({
              where: { id: organizationId },
              data: {
                plan,
                stripeSubscriptionId: subscriptionId,
                stripeSubscriptionStatus: subscription.status,
              },
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: subscription.customer as string },
        });
        if (org) {
          const downgraded = ["canceled", "unpaid", "incomplete_expired"].includes(subscription.status);
          const plan = downgraded ? "free" : planFromPriceId(subscription.items.data[0]?.price.id);
          await prisma.organization.update({
            where: { id: org.id },
            data: { ...(plan ? { plan } : {}), stripeSubscriptionStatus: subscription.status },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: subscription.customer as string },
        });
        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: { plan: "free", stripeSubscriptionId: null, stripeSubscriptionStatus: "canceled" },
          });
        }
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error(`[webhooks/stripe] handler failed for ${event.type}:`, error);
  }

  return NextResponse.json({ received: true });
}
