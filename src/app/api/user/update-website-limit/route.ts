// src/app/api/user/update-website-limit/route.ts

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/config/firebase-admin";
import { AdminAuthService } from "@/lib/admin-auth-service";

export async function POST(request: NextRequest) {
  try {
    const { userId, increment = 1 } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify the user exists
    const userRecord = await AdminAuthService.getUserById(userId);
    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get current user data from Firestore
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User document not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const currentLimit = userData?.websiteLimit || 1;
    const newLimit = currentLimit + increment;

    // Update the website limit
    await userRef.update({
      websiteLimit: newLimit,
      updatedAt: new Date(),
    });

    console.log(
      `Updated website limit for user ${userId} from ${currentLimit} to ${newLimit}`
    );

    return NextResponse.json({
      success: true,
      oldLimit: currentLimit,
      newLimit: newLimit,
      message: `Website limit updated to ${newLimit}`,
    });
  } catch (error: any) {
    console.error("Error updating website limit:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update website limit" },
      { status: 500 }
    );
  }
}
