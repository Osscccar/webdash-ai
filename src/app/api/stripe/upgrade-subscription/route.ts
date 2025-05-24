// src/app/api/stripe/upgrade-subscription/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerStripe } from "@/config/stripe";
import { adminAuth, adminDb } from "@/config/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const stripe = getServerStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe configuration error" },
        { status: 500 }
      );
    }

    // Get user ID from authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let userId: string;
    
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (error) {
      console.error("Error verifying auth token:", error);
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }

    const {
      newPriceId,
      newProductId,
      newPlanType,
      interval,
    } = await request.json();

    if (!newPriceId || !newProductId || !newPlanType) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Get user data
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const stripeCustomerId = userData?.stripeCustomerId;

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer found" },
        { status: 400 }
      );
    }

    // Get current active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { error: "No active subscription found to upgrade" },
        { status: 400 }
      );
    }

    const currentSubscription = subscriptions.data[0];
    
    // Check if they're trying to "upgrade" to the same plan
    if (currentSubscription.items.data[0].price.id === newPriceId) {
      return NextResponse.json(
        { error: "You already have this plan" },
        { status: 400 }
      );
    }

    // Get current plan info for website limit calculation
    const currentPlanType = userData?.webdashSubscription?.planType || "business";
    
    // Plan base limits
    const planLimits = {
      business: 1,
      agency: 3,
      enterprise: 5,
    };

    // Calculate website limit changes
    const currentWebsiteLimit = userData?.websiteLimit || 1;
    const currentPlanBaseLimit = planLimits[currentPlanType as keyof typeof planLimits] || 1;
    const additionalWebsitesPurchased = Math.max(0, currentWebsiteLimit - currentPlanBaseLimit);
    const newPlanBaseLimit = planLimits[newPlanType as keyof typeof planLimits] || 1;
    const newWebsiteLimit = newPlanBaseLimit + additionalWebsitesPurchased;

    console.log(`Subscription upgrade:
      From: ${currentPlanType} (${currentPlanBaseLimit} base)
      To: ${newPlanType} (${newPlanBaseLimit} base)
      Additional websites: ${additionalWebsitesPurchased}
      New limit: ${newWebsiteLimit}
    `);

    // Upgrade the subscription by modifying the existing one
    const updatedSubscription = await stripe.subscriptions.update(
      currentSubscription.id,
      {
        items: [
          {
            id: currentSubscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: "create_prorations", // This handles prorated billing
        metadata: {
          productId: newProductId,
          interval: interval,
          planType: newPlanType,
          oldPlanType: currentPlanType,
        },
      }
    );

    // Update user data in Firestore
    await adminDb.collection("users").doc(userId).update({
      webdashSubscription: {
        active: true,
        productId: newProductId,
        priceId: newPriceId,
        interval: interval,
        planType: newPlanType,
        subscriptionId: updatedSubscription.id,
        status: updatedSubscription.status,
        currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
        updatedAt: new Date().toISOString(),
      },
      websiteLimit: newWebsiteLimit,
      plan: newPlanType,
      updatedAt: new Date(),
    });

    // Call the plan change handler to ensure website limits are properly calculated
    try {
      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/stripe/handle-plan-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          newPlanType,
          oldPlanType: currentPlanType,
        }),
      });
    } catch (error) {
      console.error("Error calling plan change handler:", error);
      // Don't fail the upgrade if this fails
    }

    return NextResponse.json({
      success: true,
      subscriptionId: updatedSubscription.id,
      message: `Successfully upgraded to ${newPlanType} plan`,
      oldPlanType: currentPlanType,
      newPlanType: newPlanType,
      oldWebsiteLimit: currentWebsiteLimit,
      newWebsiteLimit: newWebsiteLimit,
    });

  } catch (error: any) {
    console.error("Error upgrading subscription:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upgrade subscription" },
      { status: 500 }
    );
  }
}