// src/app/api/fix-website-limit/route.ts

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/config/firebase-admin";
import { getServerStripe } from "@/config/stripe";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user data
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const subscription = userData?.webdashSubscription;

    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    // Plan base limits
    const planLimits = {
      business: 1,
      agency: 3,
      enterprise: 5,
    };

    // Determine actual plan from product ID
    const productId = subscription.productId;
    let actualPlanType = "business";

    if (productId === "prod_SLW6KBiglhhYlh") {
      actualPlanType = "business";
    } else if (productId === "prod_SLW74DJP2aPaN7") {
      actualPlanType = "agency";
    } else if (productId === "prod_SLW70YpoGn9giO") {
      actualPlanType = "enterprise";
    }

    // Get current website limit and calculate additional purchases
    const currentLimit = userData?.websiteLimit || 1;
    const assumedOldPlanType = subscription.planType || "business";
    const assumedOldBaseLimit =
      planLimits[assumedOldPlanType as keyof typeof planLimits] || 1;

    // Calculate additional websites (current limit - what we think the base was)
    // But we need to be smart about this - if they're on agency with limit 2, they probably had 1 additional
    let additionalWebsites = 0;

    if (actualPlanType === "agency" && currentLimit === 2) {
      // This is likely the case - they were on business (1) + bought 1 additional = 2
      // Now on agency, should be 3 + 1 = 4
      additionalWebsites = 1;
    } else if (actualPlanType === "enterprise" && currentLimit <= 5) {
      // Similar logic for enterprise
      additionalWebsites = Math.max(0, currentLimit - assumedOldBaseLimit);
    } else {
      // General case
      additionalWebsites = Math.max(0, currentLimit - assumedOldBaseLimit);
    }

    // Calculate correct limit
    const correctBaseLimit =
      planLimits[actualPlanType as keyof typeof planLimits];
    const correctTotalLimit = correctBaseLimit + additionalWebsites;

    console.log(`Fixing website limit for user ${userId}:
      Current limit: ${currentLimit}
      Detected plan: ${actualPlanType} (from product ID: ${productId})
      Plan base limit: ${correctBaseLimit}
      Additional websites: ${additionalWebsites}
      New correct limit: ${correctTotalLimit}
    `);

    // Update the user document
    await userRef.update({
      websiteLimit: correctTotalLimit,
      planType: actualPlanType,
      "webdashSubscription.planType": actualPlanType,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      userId,
      oldLimit: currentLimit,
      newLimit: correctTotalLimit,
      planType: actualPlanType,
      baseLimit: correctBaseLimit,
      additionalWebsites: additionalWebsites,
      message: `Website limit updated from ${currentLimit} to ${correctTotalLimit}`,
    });
  } catch (error: any) {
    console.error("Error fixing website limit:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fix website limit" },
      { status: 500 }
    );
  }
}
