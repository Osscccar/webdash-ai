// src/app/api/stripe/handle-plan-change/route.ts

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/config/firebase-admin";
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

    const { userId, newPlanType, oldPlanType } = await request.json();

    if (!userId || !newPlanType) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Plan base limits
    const planLimits = {
      business: 1,
      agency: 3,
      enterprise: 5,
    };

    // Get user data
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const currentWebsiteLimit = userData?.websiteLimit || 1;
    const currentPlanType =
      oldPlanType || userData?.webdashSubscription?.planType || "business";

    // Calculate how many additional websites the user has purchased
    const currentPlanBaseLimit =
      planLimits[currentPlanType as keyof typeof planLimits] || 1;
    const additionalWebsitesPurchased = Math.max(
      0,
      currentWebsiteLimit - currentPlanBaseLimit
    );

    // Calculate new website limit
    const newPlanBaseLimit =
      planLimits[newPlanType as keyof typeof planLimits] || 1;
    const newWebsiteLimit = newPlanBaseLimit + additionalWebsitesPurchased;

    console.log(`Plan change calculation:
      Current plan: ${currentPlanType} (base: ${currentPlanBaseLimit})
      New plan: ${newPlanType} (base: ${newPlanBaseLimit})
      Current limit: ${currentWebsiteLimit}
      Additional websites: ${additionalWebsitesPurchased}
      New limit: ${newWebsiteLimit}
    `);

    // Update the user's website limit
    await userRef.update({
      websiteLimit: newWebsiteLimit,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      oldLimit: currentWebsiteLimit,
      newLimit: newWebsiteLimit,
      additionalWebsites: additionalWebsitesPurchased,
      message: `Website limit updated from ${currentWebsiteLimit} to ${newWebsiteLimit}`,
    });
  } catch (error: any) {
    console.error("Error handling plan change:", error);
    return NextResponse.json(
      { error: error.message || "Failed to handle plan change" },
      { status: 500 }
    );
  }
}
