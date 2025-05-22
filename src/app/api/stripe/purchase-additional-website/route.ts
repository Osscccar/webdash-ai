// src/app/api/stripe/purchase-additional-website/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerStripe } from "@/config/stripe";
import { adminDb } from "@/config/firebase-admin";
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

    const { paymentMethodId, planType, customerEmail, customerName, userId } =
      await request.json();

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
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }

    // Check if user can purchase additional websites (validate their current plan)
    const userPlanType = await UserService.getUserPlanType(userId);
    if (userPlanType !== planType) {
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

    // Create the subscription for the additional website
    const subscription = await stripe.subscriptions.create({
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
    });

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
    await userRef.update({
      additionalWebsiteSubscriptions: adminDb.FieldValue.arrayUnion({
        subscriptionId: subscription.id,
        priceId: additionalWebsitePricing.priceId,
        amount: additionalWebsitePricing.amount,
        status: subscription.status,
        createdAt: new Date().toISOString(),
      }),
      updatedAt: new Date(),
    });

    // Return the client secret to complete the payment process
    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any).payment_intent
        ?.client_secret,
      status: subscription.status,
      amount: additionalWebsitePricing.amount,
    });
  } catch (error: any) {
    console.error("Error purchasing additional website:", error);

    return NextResponse.json(
      { error: error.message || "Error purchasing additional website" },
      { status: 500 }
    );
  }
}
