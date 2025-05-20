// Path: src/app/api/user/update-email/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerStripe } from "@/config/stripe";
import { AdminAuthService } from "@/lib/admin-auth-service";
import { adminDb } from "@/config/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { userId, oldEmail, newEmail } = await request.json();

    if (!userId || !oldEmail || !newEmail) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // 1. Update email in Firebase Authentication
    try {
      await AdminAuthService.updateUserEmail(userId, newEmail);
    } catch (error: any) {
      console.error("Error updating Firebase Auth email:", error);
      return NextResponse.json(
        { error: `Failed to update email in Firebase: ${error.message}` },
        { status: 500 }
      );
    }

    // 2. Update email in Firestore
    try {
      const userRef = adminDb.collection("users").doc(userId);
      await userRef.update({
        email: newEmail,
        updatedAt: new Date(),
      });
    } catch (error: any) {
      console.error("Error updating Firestore email:", error);
      // Don't return error here as we want to continue with Stripe update
    }

    // 3. Update email in Stripe if customer exists
    const stripe = getServerStripe();
    if (stripe) {
      // Find customer by old email
      const customers = await stripe.customers.list({
        email: oldEmail,
        limit: 1,
      });

      if (customers.data.length > 0) {
        const customerId = customers.data[0].id;

        // Update customer email in Stripe
        await stripe.customers.update(customerId, {
          email: newEmail,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Email updated successfully in both Firebase and Stripe",
    });
  } catch (error: any) {
    console.error("Error updating email:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update email" },
      { status: 500 }
    );
  }
}
