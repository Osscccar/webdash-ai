import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";
import { getServerStripe } from "@/config/stripe";

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
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.error(`User document ${userId} not found`);
      return;
    }

    // Update user document with Stripe customer ID
    await updateDoc(userRef, {
      stripeCustomerId: session.customer,
      updatedAt: serverTimestamp(),
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
  // This is already handled by the subscription events, but you could
  // add additional logic here if needed
}

/**
 * Handle invoice.payment_failed event
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Update subscription status in Firestore to reflect failed payment
  const customerId = invoice.customer as string;

  try {
    // Find user by Stripe customer ID
    const usersRef = db.collection("users");
    const snapshot = await usersRef
      .where("stripeCustomerId", "==", customerId)
      .get();

    if (snapshot.empty) {
      console.error(`No user found with Stripe customer ID ${customerId}`);
      return;
    }

    // Update user subscription status
    const userId = snapshot.docs[0].id;
    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
      "webdashSubscription.active": false,
      "webdashSubscription.status": "payment_failed",
      updatedAt: serverTimestamp(),
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
    const usersRef = db.collection("users");
    const snapshot = await usersRef
      .where("stripeCustomerId", "==", customerId)
      .get();

    if (snapshot.empty) {
      console.error(`No user found with Stripe customer ID ${customerId}`);
      return;
    }

    // Update user subscription status
    const userId = snapshot.docs[0].id;
    const userRef = doc(db, "users", userId);

    const item = subscription.items.data[0];
    const priceId = item.price.id;

    await updateDoc(userRef, {
      webdashSubscription: {
        active: subscription.status === "active",
        planId: priceId,
        trialEnd: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        currentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        subscriptionId: subscription.id,
        status: subscription.status,
      },
      updatedAt: serverTimestamp(),
    });

    console.log(`Updated subscription for user ${userId}`);
  } catch (error) {
    console.error(`Error updating subscription: ${error}`);
    throw error;
  }
}
