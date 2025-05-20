// src/app/api/stripe/create-subscription/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerStripe } from "@/config/stripe";
import { adminDb } from "@/config/firebase-admin";
import { AdminAuthService } from "@/lib/admin-auth-service";

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
      priceId,
      productId,
      interval,
      customerEmail,
      customerName,
      promoCode,
    } = await request.json();

    if (!paymentMethodId || !priceId || !customerEmail) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Validate the price exists and get currency
    let price;
    try {
      price = await stripe.prices.retrieve(priceId);
      if (!price) {
        return NextResponse.json(
          { error: "Invalid price ID" },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error("Error retrieving price:", error);
      return NextResponse.json(
        { error: "Failed to validate price" },
        { status: 400 }
      );
    }

    // Get or create customer - checking for currency conflicts
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    let customer;
    let currencyConflict = false;

    if (customers.data.length > 0) {
      customer = customers.data[0];

      // Check if customer already has subscriptions with different currency
      const existingSubscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: "active",
      });

      if (existingSubscriptions.data.length > 0) {
        const existingCurrency = existingSubscriptions.data[0].currency;
        if (existingCurrency && existingCurrency !== price.currency) {
          currencyConflict = true;
          console.error(
            `Currency conflict: Existing ${existingCurrency}, New ${price.currency}`
          );

          // Option 1: Return error to user
          return NextResponse.json(
            {
              error:
                "You already have a subscription in a different currency. Please contact support.",
            },
            { status: 400 }
          );

          // Option 2 (alternative): Create a new customer for this currency
          // customer = null; // Force creating a new customer below
        }
      }

      // If no conflict, attach payment method to existing customer
      if (!currencyConflict) {
        // Update the existing customer with the new payment method
        try {
          await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customer.id,
          });

          // Set as default payment method
          await stripe.customers.update(customer.id, {
            invoice_settings: {
              default_payment_method: paymentMethodId,
            },
          });
        } catch (error) {
          console.error("Error attaching payment method:", error);
          // Continue anyway as it might already be attached
        }
      }
    }

    if (!customer) {
      // Create a new customer with the payment method
      customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
        metadata: {
          productId: productId,
        },
      });
    }

    // Check if customer has an existing subscription for this price
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      price: priceId,
      status: "active",
    });

    if (subscriptions.data.length > 0) {
      return NextResponse.json(
        {
          error: "You already have an active subscription for this plan",
          subscription: subscriptions.data[0],
        },
        { status: 400 }
      );
    }

    // Prepare subscription params
    const subscriptionParams: any = {
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        productId: productId,
        interval: interval,
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
          console.log("Applied promotion code:", promotionCodes.data[0].id);
        } else {
          console.log("Promo code not found:", promoCode);
        }
      } catch (err) {
        console.error("Error applying promo code:", err);
        // Continue without the promo code if there's an error
      }
    }

    // Create the subscription
    const subscription = await stripe.subscriptions.create(subscriptionParams);

    // Get the user's UID from Firebase
    let userId = null;
    const userRecord = await AdminAuthService.getUserByEmail(customerEmail);
    if (userRecord) {
      userId = userRecord.uid;
    }

    // If we have a userId, update the user's subscription status in Firestore
    if (userId) {
      const userRef = adminDb.collection("users").doc(userId);
      await userRef.update({
        stripeCustomerId: customer.id,
        webdashSubscription: {
          active: true,
          productId: productId,
          priceId: priceId,
          interval: interval,
          currency: price.currency,
          subscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodEnd: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          updatedAt: new Date().toISOString(),
        },
      });
    }

    // Return the client secret to complete the payment process
    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any).payment_intent
        ?.client_secret,
    });
  } catch (error: any) {
    console.error("Error creating subscription:", error);

    return NextResponse.json(
      { error: error.message || "Error creating subscription" },
      { status: 500 }
    );
  }
}
