import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { requireOrgApi, toErrorResponse, HttpError } from "@/lib/session";

export async function POST(_request: NextRequest) {
  try {
    const { org, role } = await requireOrgApi({ write: true });
    if (role === "member") throw new HttpError(403, "Only owners and admins can manage billing.");
    if (!org.stripeCustomerId) throw new HttpError(400, "no_subscription");
    const stripe = getStripe();
    const portal = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing`,
    });
    return NextResponse.json({ data: { url: portal.url } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
