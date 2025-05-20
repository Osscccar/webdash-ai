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

    const { promoCode, priceId } = await request.json();

    if (!promoCode) {
      return NextResponse.json(
        { valid: false, message: "No promo code provided" },
        { status: 200 } // Return 200 even for invalid promos, not 400
      );
    }

    // Even if priceId is missing, we can still validate the promo code exists
    try {
      // Fetch the promotion code from Stripe
      const promotionCodes = await stripe.promotionCodes.list({
        code: promoCode,
        active: true,
        limit: 1,
      });

      // Check if promotion code exists and is active
      if (promotionCodes.data.length === 0) {
        return NextResponse.json(
          { valid: false, message: "Invalid or expired promo code" },
          { status: 200 }
        );
      }

      const promotionCode = promotionCodes.data[0];

      // Check if the coupon is still valid
      if (!promotionCode.active || !promotionCode.coupon.valid) {
        return NextResponse.json(
          { valid: false, message: "This promo code has expired" },
          { status: 200 }
        );
      }

      // Extract discount information
      let discount = 0;
      const { coupon } = promotionCode;

      if (coupon.percent_off) {
        discount = coupon.percent_off;
      } else if (coupon.amount_off && coupon.currency) {
        // For fixed amount discounts, we just report it's a discount
        discount = 10; // Default to 10% if we can't calculate exact percentage
      }

      return NextResponse.json({
        valid: true,
        discount: discount,
        id: promotionCode.id,
        name: coupon.name || promoCode.toUpperCase(),
      });
    } catch (error: any) {
      console.error("Stripe API error:", error);
      return NextResponse.json(
        { valid: false, message: "Error validating promo code" },
        { status: 200 } // Still return 200 for Stripe API errors
      );
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
