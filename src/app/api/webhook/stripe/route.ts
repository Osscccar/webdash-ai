// src/app/api/webhook/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/config/firebase-admin";
import { getServerStripe } from "@/config/stripe";
import { UserService } from "@/lib/user-service";
import { getPlanTypeFromId, ADDITIONAL_WEBSITE_PRICING } from "@/config/stripe";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Stripe webhook handler
 * This is called by Stripe when events occur (subscriptions created, updated, etc.)
 */
export async function POST(request: NextRequest) {
  const stripe = getServerStripe();

  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature") as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  let event: Stripe.Event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`Error handling webhook: ${error.message}`);
    return NextResponse.json(
      { error: `Error handling webhook: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  // Get user ID from session metadata
  const userId = session.metadata?.userId;

  if (!userId) {
    console.error("No user ID found in session metadata");
    return;
  }

  try {
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists()) {
      console.error(`User document ${userId} not found`);
      return;
    }

    // Update user document with Stripe customer ID
    await userRef.update({
      stripeCustomerId: session.customer,
      updatedAt: new Date(),
    });

    console.log(
      `Updated user ${userId} with Stripe customer ID ${session.customer}`
    );
  } catch (error) {
    console.error(`Error updating user document: ${error}`);
    throw error;
  }
}

/**
 * Handle customer.subscription.created event
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  await updateSubscriptionInFirestore(subscription);
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await updateSubscriptionInFirestore(subscription);
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await updateSubscriptionInFirestore(subscription);
}

/**
 * Handle invoice.payment_succeeded event
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Handle payment success for additional websites
  if (
    invoice.subscription &&
    invoice.metadata?.purchaseType === "additional_website"
  ) {
    const userId = invoice.metadata.userId;
    if (userId) {
      // Increment website limit since payment succeeded
      await UserService.incrementWebsiteLimit(userId, 1);
      console.log(
        `Payment succeeded: Incremented website limit for user ${userId}`
      );
    }
  }
}

/**
 * Handle invoice.payment_failed event
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Update subscription status in Firestore to reflect failed payment
  const customerId = invoice.customer as string;

  try {
    // Find user by Stripe customer ID
    const usersRef = adminDb.collection("users");
    const q = usersRef.where("stripeCustomerId", "==", customerId);
    const snapshot = await q.get();

    if (snapshot.empty) {
      console.error(`No user found with Stripe customer ID ${customerId}`);
      return;
    }

    // Update user subscription status
    const userId = snapshot.docs[0].id;
    const userRef = adminDb.collection("users").doc(userId);

    await userRef.update({
      "webdashSubscription.active": false,
      "webdashSubscription.status": "payment_failed",
      updatedAt: new Date(),
    });

    console.log(
      `Updated subscription status for user ${userId} to payment_failed`
    );
  } catch (error) {
    console.error(`Error updating subscription status: ${error}`);
    throw error;
  }
}

/**
 * Update subscription information in Firestore
 */
async function updateSubscriptionInFirestore(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;

  try {
    // Find user by Stripe customer ID
    const usersRef = adminDb.collection("users");
    const q = usersRef.where("stripeCustomerId", "==", customerId);
    const snapshot = await q.get();

    if (snapshot.empty) {
      console.error(`No user found with Stripe customer ID ${customerId}`);
      return;
    }

    // Update user subscription status
    const userId = snapshot.docs[0].id;
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists()) {
      console.error(`User document ${userId} not found`);
      return;
    }

    const item = subscription.items.data[0];
    const priceId = item.price.id;

    // Check if this is an additional website subscription
    const isAdditionalWebsite = Object.values(ADDITIONAL_WEBSITE_PRICING).some(
      (pricing) => pricing.priceId === priceId
    );

    if (isAdditionalWebsite) {
      // Handle additional website subscription
      await handleAdditionalWebsiteSubscription(subscription, userId, priceId);
    } else {
      // Handle main plan subscription
      await handleMainPlanSubscription(subscription, userId, priceId);
    }

    console.log(`Updated subscription for user ${userId}`);
  } catch (error) {
    console.error(`Error updating subscription: ${error}`);
    throw error;
  }
}

/**
 * Handle additional website subscription updates
 */
/**
 * Handle additional website subscription updates
 */
async function handleAdditionalWebsiteSubscription(
  subscription: Stripe.Subscription,
  userId: string,
  priceId: string
) {
  const userRef = adminDb.collection("users").doc(userId);
  const userDoc = await userRef.get();
  const userData = userDoc.data();

  const additionalSubscriptions =
    userData?.additionalWebsiteSubscriptions || [];

  // Find the specific additional subscription
  const subscriptionIndex = additionalSubscriptions.findIndex(
    (sub: any) => sub.subscriptionId === subscription.id
  );

  if (subscriptionIndex >= 0) {
    // Update existing additional subscription
    additionalSubscriptions[subscriptionIndex] = {
      ...additionalSubscriptions[subscriptionIndex],
      status: subscription.status,
      currentPeriodEnd: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date().toISOString(),
    };
  } else if (subscription.status === "active") {
    // Add new additional subscription
    const planType = Object.keys(ADDITIONAL_WEBSITE_PRICING).find(
      (key) =>
        ADDITIONAL_WEBSITE_PRICING[
          key as keyof typeof ADDITIONAL_WEBSITE_PRICING
        ].priceId === priceId
    );

    additionalSubscriptions.push({
      subscriptionId: subscription.id,
      priceId: priceId,
      planType: planType,
      amount:
        ADDITIONAL_WEBSITE_PRICING[
          planType as keyof typeof ADDITIONAL_WEBSITE_PRICING
        ]?.amount || 0,
      status: subscription.status,
      currentPeriodEnd: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      createdAt: new Date().toISOString(),
    });

    // IMPORTANT: Only increment website limit if this is truly a new subscription
    // Check if we've already processed this subscription ID
    const alreadyProcessed = userData?.processedSubscriptions?.includes(
      subscription.id
    );

    if (!alreadyProcessed) {
      await UserService.incrementWebsiteLimit(userId, 1);

      // Track that we've processed this subscription
      await userRef.update({
        processedSubscriptions: FieldValue.arrayUnion(subscription.id),
      });
    }
  }

  // If subscription is cancelled or deleted, decrement website limit
  if (
    subscription.status === "canceled" ||
    subscription.status === "incomplete_expired"
  ) {
    // Only decrement if this was an active additional website subscription
    const wasActive =
      subscriptionIndex >= 0 &&
      additionalSubscriptions[subscriptionIndex].status === "active";

    if (wasActive) {
      // Decrement website limit but don't go below plan minimum
      const planType = await UserService.getUserPlanType(userId);
      const planLimits = { business: 1, agency: 3, enterprise: 5 };
      const minLimit = planLimits[planType as keyof typeof planLimits] || 1;

      const currentLimit = userData?.websiteLimit || minLimit;
      const newLimit = Math.max(minLimit, currentLimit - 1);

      await userRef.update({
        websiteLimit: newLimit,
      });
    }

    // Remove the subscription from the array if it's cancelled
    if (subscriptionIndex >= 0) {
      additionalSubscriptions.splice(subscriptionIndex, 1);
    }
  }

  await userRef.update({
    additionalWebsiteSubscriptions: additionalSubscriptions,
    updatedAt: new Date(),
  });
}

/**
 * Handle main plan subscription updates
 */
async function handleMainPlanSubscription(
  subscription: Stripe.Subscription,
  userId: string,
  priceId: string
) {
  const userRef = adminDb.collection("users").doc(userId);
  const userDoc = await userRef.get();
  const userData = userDoc.data();

  // Get the product ID from the subscription
  const productId = subscription.items.data[0].price.product as string;

  // Determine the new plan type from product ID using the config
  let newPlanType = getPlanTypeFromId(productId);

  console.log(
    `Detected plan type: ${newPlanType} from product ID: ${productId}`
  );

  // Get the old plan type - check multiple places
  const oldPlanType =
    userData?.webdashSubscription?.planType || userData?.planType || "business"; // default to business if no plan found

  // Plan base limits
  const planLimits = {
    business: 1,
    agency: 3,
    enterprise: 5,
  };

  // Only update website limit if subscription is active
  if (subscription.status === "active") {
    const oldPlanLimit =
      planLimits[oldPlanType as keyof typeof planLimits] || 1;
    const newPlanLimit =
      planLimits[newPlanType as keyof typeof planLimits] || 1;
    const currentWebsiteLimit = userData?.websiteLimit || oldPlanLimit;

    // Calculate additional websites the user has purchased
    const additionalWebsites = Math.max(0, currentWebsiteLimit - oldPlanLimit);

    // New limit should be: new plan base limit + any additional websites purchased
    const newWebsiteLimit = newPlanLimit + additionalWebsites;

    console.log(`Plan change detected:
      Old plan: ${oldPlanType} (base limit: ${oldPlanLimit})
      New plan: ${newPlanType} (base limit: ${newPlanLimit})
      Current limit: ${currentWebsiteLimit}
      Additional websites purchased: ${additionalWebsites}
      New limit will be: ${newWebsiteLimit}
    `);

    // Update user document with new subscription info AND website limit
    await userRef.update({
      websiteLimit: newWebsiteLimit,
      planType: newPlanType, // Store at root level too for easier access
      webdashSubscription: {
        active: subscription.status === "active",
        planId: priceId,
        priceId: priceId, // Store both for compatibility
        productId: productId,
        planType: newPlanType, // IMPORTANT: Store the plan type
        interval:
          subscription.items.data[0].price.recurring?.interval || "monthly",
        currency: subscription.currency,
        trialEnd: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        currentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        subscriptionId: subscription.id,
        status: subscription.status,
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date(),
    });

    console.log(
      `Successfully updated user ${userId} to ${newPlanType} plan with website limit: ${newWebsiteLimit}`
    );
  } else {
    // Just update subscription status without changing limits
    await userRef.update({
      webdashSubscription: {
        active: subscription.status === "active",
        planId: priceId,
        priceId: priceId,
        productId: productId,
        planType: newPlanType,
        interval:
          subscription.items.data[0].price.recurring?.interval || "monthly",
        currency: subscription.currency,
        trialEnd: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        currentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        subscriptionId: subscription.id,
        status: subscription.status,
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date(),
    });
  }
}
