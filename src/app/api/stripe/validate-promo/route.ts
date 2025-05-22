// src/app/api/stripe/validate-promo/route.ts

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

    // Parse the request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { promoCode, priceId } = body;

    console.log("Validate promo request:", { promoCode, priceId });

    // Check if promo code is provided
    if (!promoCode) {
      return NextResponse.json(
        {
          valid: false,
          message: "No promo code provided",
          error: "Promo code is required",
        },
        { status: 400 }
      );
    }

    // Note: priceId is optional for validation, but helpful for more specific validation
    try {
      // Fetch the promotion code from Stripe
      const promotionCodes = await stripe.promotionCodes.list({
        code: promoCode,
        active: true,
        limit: 1,
      });

      console.log("Stripe promotion codes response:", promotionCodes);

      // Check if promotion code exists and is active
      if (promotionCodes.data.length === 0) {
        return NextResponse.json({
          valid: false,
          message: "Invalid or expired promo code",
        });
      }

      const promotionCode = promotionCodes.data[0];

      // Check if the coupon is still valid
      if (!promotionCode.active || !promotionCode.coupon.valid) {
        return NextResponse.json({
          valid: false,
          message: "This promo code has expired",
        });
      }

      // Check if there are any restrictions (e.g., first time customers only)
      const restrictions = promotionCode.restrictions;
      console.log("Promotion code restrictions:", restrictions);

      // Extract discount information
      let discount = 0;
      let discountType = "percentage";
      const { coupon } = promotionCode;

      if (coupon.percent_off) {
        discount = coupon.percent_off;
        discountType = "percentage";
      } else if (coupon.amount_off && coupon.currency) {
        discount = coupon.amount_off / 100; // Convert cents to dollars
        discountType = "fixed_amount";
      }

      console.log("Promotion code validation successful:", {
        id: promotionCode.id,
        discount,
        discountType,
        name: coupon.name,
      });

      return NextResponse.json({
        valid: true,
        discount: discountType === "percentage" ? discount : discount, // Return actual amount for fixed discounts
        discountType,
        id: promotionCode.id,
        name: coupon.name || promoCode.toUpperCase(),
        restrictions: {
          firstTimeTransaction: restrictions?.first_time_transaction,
          minimumAmount: restrictions?.minimum_amount,
          currency: restrictions?.currency_options?.[0]?.currency,
        },
      });
    } catch (stripeError: any) {
      console.error("Stripe API error:", stripeError);

      // Handle specific Stripe errors
      if (stripeError.type === "StripeInvalidRequestError") {
        return NextResponse.json({
          valid: false,
          message: "Invalid promo code format",
        });
      }

      return NextResponse.json({
        valid: false,
        message: "Error validating promo code with payment processor",
      });
    }
  } catch (error: any) {
    console.error("Error validating promo code:", error);
    return NextResponse.json(
      {
        error: error.message || "Error validating promo code",
        valid: false,
      },
      { status: 500 }
    );
  }
}
