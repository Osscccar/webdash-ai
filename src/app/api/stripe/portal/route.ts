import { NextRequest, NextResponse } from "next/server";
import { getServerStripe } from "@/config/stripe";

/**
 * Create a Stripe Customer Portal session
 * This allows customers to manage their subscription
 */
export async function POST(request: NextRequest) {
  const stripe = getServerStripe();

  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { customerId, returnUrl } = body;

    // Validate required fields
    if (!customerId || !returnUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create a portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Portal Error:", error);

    return NextResponse.json(
      { error: error.message || "Failed to create portal session" },
      { status: 500 }
    );
  }
}
