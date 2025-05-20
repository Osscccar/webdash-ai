import { NextRequest, NextResponse } from "next/server";
import { getServerStripe } from "@/config/stripe";

export async function POST(request: NextRequest) {
  try {
    const stripe = getServerStripe();

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe configuration error" },
        { status: 500 }
      );
    }

    const {
      priceId,
      userId,
      email,
      name,
      returnUrl,
      promoCode, // Get promo code if provided
      metadata = {},
    } = await request.json();

    if (!priceId || !userId || !email || !returnUrl) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Prepare the checkout session parameters
    const params: any = {
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?canceled=true`,
      customer_email: email,
      client_reference_id: userId,
      metadata: {
        userId,
        ...metadata,
      },
    };

    // If a promo code is provided, validate and apply it
    if (promoCode) {
      // First, verify the promo code
      const promotionCodes = await stripe.promotionCodes.list({
        code: promoCode,
        active: true,
      });

      if (promotionCodes.data.length > 0) {
        // Add the promotion code to the checkout session
        params.discounts = [
          {
            promotion_code: promotionCodes.data[0].id,
          },
        ];
      }
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(params);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);

    return NextResponse.json(
      { error: error.message || "Error creating checkout session" },
      { status: 500 }
    );
  }
}
