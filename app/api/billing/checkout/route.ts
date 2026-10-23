import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe, portalConfiguration } from "@/lib/stripe/client";
import { requireOrgApi, toErrorResponse, HttpError } from "@/lib/session";

const PRICE_IDS: Record<"pro" | "team", string | undefined> = {
  pro: process.env.STRIPE_PRICE_ID_PRO,
  team: process.env.STRIPE_PRICE_ID_TEAM,
};

export async function POST(request: NextRequest) {
  try {
    const { org, user, role } = await requireOrgApi({ write: true });
    if (role === "member") throw new HttpError(403, "Only owners and admins can manage billing.");
    const body = await request.json().catch(() => null);
    const plan = body?.plan as "pro" | "team" | undefined;
    if (!plan || !PRICE_IDS[plan]) return NextResponse.json({ error: "invalid_plan" }, { status: 400 });

    const stripe = getStripe();
    if (org.stripeSubscriptionId && org.stripeSubscriptionStatus === "active") {
      const portal = await stripe.billingPortal.sessions.create({
        customer: org.stripeCustomerId!,
        ...portalConfiguration(),
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing`,
      });
      return NextResponse.json({ data: { url: portal.url } });
    }

    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: org.name,
        metadata: { organizationId: org.id },
      });
      customerId = customer.id;
      await prisma.organization.update({ where: { id: org.id }, data: { stripeCustomerId: customerId } });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: PRICE_IDS[plan]!, quantity: 1 }],
      allow_promotion_codes: false,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing&billing=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing&billing=canceled`,
      metadata: { organizationId: org.id, plan },
      subscription_data: { metadata: { organizationId: org.id } },
    });
    return NextResponse.json({ data: { url: session.url } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
