// src/app/api/stripe/purchase-additional-website/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerStripe } from "@/config/stripe";
import { adminDb } from "@/config/firebase-admin";
import { FieldValue } from "firebase-admin/firestore"; // Import FieldValue separately
import { AdminAuthService } from "@/lib/admin-auth-service";
import { UserService } from "@/lib/user-service";
import { ADDITIONAL_WEBSITE_PRICING } from "@/config/stripe";

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
      paymentMethodId,
      planType,
      customerEmail,
      customerName,
      userId,
      promoCode, // Added promo code support
    } = await request.json();

    console.log("Purchase additional website request:", {
      paymentMethodId: !!paymentMethodId,
      planType,
      customerEmail,
      customerName,
      userId,
      promoCode: !!promoCode,
    });

    if (!paymentMethodId || !planType || !customerEmail || !userId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Validate the user exists
    const userRecord = await AdminAuthService.getUserById(userId);
    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get additional website pricing for the plan
    const additionalWebsitePricing =
      ADDITIONAL_WEBSITE_PRICING[
        planType as keyof typeof ADDITIONAL_WEBSITE_PRICING
      ];
    if (!additionalWebsitePricing) {
      console.error(`Invalid plan type: ${planType}`);
      console.error(
        "Available plan types:",
        Object.keys(ADDITIONAL_WEBSITE_PRICING)
      );
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }

    console.log("Using additional website pricing:", additionalWebsitePricing);

    // Check if user can purchase additional websites (validate their current plan)
    const userPlanType = await UserService.getUserPlanType(userId);
    if (userPlanType !== planType) {
      console.error(
        `Plan type mismatch. User plan: ${userPlanType}, Requested: ${planType}`
      );
      return NextResponse.json(
        { error: "Plan type mismatch" },
        { status: 400 }
      );
    }

    // Get or create customer
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];

      // Attach payment method to existing customer
      try {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customer.id,
        });
      } catch (error) {
        console.error("Error attaching payment method:", error);
        // Continue anyway as it might already be attached
      }
    } else {
      // Create a new customer with the payment method
      customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
        metadata: {
          userId: userId,
          planType: planType,
          purchaseType: "additional_website",
        },
      });
    }

    console.log("Customer created/found:", customer.id);

    // Prepare subscription params
    const subscriptionParams: any = {
      customer: customer.id,
      items: [
        {
          price: additionalWebsitePricing.priceId,
          quantity: 1,
        },
      ],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        userId: userId,
        planType: planType,
        purchaseType: "additional_website",
      },
    };

    // Apply promo code if provided
    if (promoCode) {
      try {
        // Find the promotion code in Stripe
        const promotionCodes = await stripe.promotionCodes.list({
          code: promoCode,
          active: true,
          limit: 1,
        });

        if (promotionCodes.data.length > 0) {
          // Add the promotion code to the subscription parameters
          subscriptionParams.promotion_code = promotionCodes.data[0].id;
          console.log(
            "Applied promotion code to additional website:",
            promotionCodes.data[0].id
          );
        } else {
          console.log(
            "Promo code not found for additional website:",
            promoCode
          );
          // Don't fail the purchase if promo code is invalid, just log it
        }
      } catch (err) {
        console.error("Error applying promo code to additional website:", err);
        // Continue without the promo code if there's an error
      }
    }

    // Create the subscription for the additional website
    console.log("Creating subscription with params:", subscriptionParams);
    const subscription = await stripe.subscriptions.create(subscriptionParams);
    console.log(
      "Subscription created:",
      subscription.id,
      "Status:",
      subscription.status
    );

    // If payment is successful, update the user's website limit
    if (
      subscription.status === "active" ||
      subscription.latest_invoice?.payment_intent?.status === "succeeded"
    ) {
      const newLimit = await UserService.incrementWebsiteLimit(userId, 1);

      if (newLimit) {
        console.log(
          `Successfully incremented website limit for user ${userId} to ${newLimit}`
        );
      }
    }

    // Update user document with additional website subscription info
    const userRef = adminDb.collection("users").doc(userId);
    const subscriptionData: any = {
      subscriptionId: subscription.id,
      priceId: additionalWebsitePricing.priceId,
      amount: additionalWebsitePricing.amount,
      status: subscription.status,
      createdAt: new Date().toISOString(),
    };

    // Add promo code info if applied
    if (promoCode && subscriptionParams.promotion_code) {
      subscriptionData.promoCode = promoCode;
      subscriptionData.promotionCodeId = subscriptionParams.promotion_code;
    }

    console.log(
      "Updating user document with subscription data:",
      subscriptionData
    );

    // Use the correctly imported FieldValue
    await userRef.update({
      additionalWebsiteSubscriptions: FieldValue.arrayUnion(subscriptionData),
      updatedAt: new Date(),
    });

    console.log("User document updated successfully");

    // Return the client secret to complete the payment process
    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any).payment_intent
        ?.client_secret,
      status: subscription.status,
      amount: additionalWebsitePricing.amount,
      promoCodeApplied: !!promoCode && !!subscriptionParams.promotion_code,
    });
  } catch (error: any) {
    console.error("Error purchasing additional website:", error);

    return NextResponse.json(
      { error: error.message || "Error purchasing additional website" },
      { status: 500 }
    );
  }
}
