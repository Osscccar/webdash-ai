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

    const { promoCode, planId } = await request.json();

    if (!promoCode || !planId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Fetch the promotion code from Stripe
    const promotionCodes = await stripe.promotionCodes.list({
      code: promoCode,
      active: true,
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
    if (!promotionCode.active || promotionCode.coupon.valid !== true) {
      return NextResponse.json(
        { valid: false, message: "This promo code has expired" },
        { status: 200 }
      );
    }

    // Check if the coupon is applicable to the selected plan
    if (promotionCode.restrictions && promotionCode.restrictions.applies_to) {
      const { applies_to } = promotionCode.restrictions;

      if (applies_to.products && applies_to.products.length > 0) {
        // Fetch the price to get its product ID
        const price = await stripe.prices.retrieve(planId);

        if (!applies_to.products.includes(price.product as string)) {
          return NextResponse.json(
            { valid: false, message: "Promo code not valid for this plan" },
            { status: 200 }
          );
        }
      }
    }

    // Extract discount information
    let discount = 0;
    const { coupon } = promotionCode;

    if (coupon.percent_off) {
      discount = coupon.percent_off;
    } else if (coupon.amount_off && coupon.currency) {
      // For fixed amount discounts, we'd need the price to calculate the percentage
      // This is a simplified approach
      const price = await stripe.prices.retrieve(planId);
      const unitAmount = price.unit_amount || 0;

      if (unitAmount > 0) {
        discount = (coupon.amount_off / unitAmount) * 100;
      }
    }

    return NextResponse.json({
      valid: true,
      discount: discount,
      id: promotionCode.id,
      name: coupon.name || promoCode.toUpperCase(),
    });
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
