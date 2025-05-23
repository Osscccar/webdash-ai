// src/app/api/users/search/route.ts

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/config/firebase-admin";
import { AdminAuthService } from "@/lib/admin-auth-service";

// GET /api/users/search - Search for users by email
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");
    const userId = searchParams.get("userId"); // User making the request

    if (!email || !userId) {
      return NextResponse.json(
        { error: "Email and user ID are required" },
        { status: 400 }
      );
    }

    // Verify the requesting user exists
    const requestingUser = await AdminAuthService.getUserById(userId);
    if (!requestingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Search for user by email
    const userRecord = await AdminAuthService.getUserByEmail(email);

    if (!userRecord) {
      return NextResponse.json(
        { error: "No user found with this email address" },
        { status: 404 }
      );
    }

    // Don't allow searching for themselves
    if (userRecord.uid === userId) {
      return NextResponse.json(
        { error: "Cannot add yourself as a collaborator" },
        { status: 400 }
      );
    }

    // Get additional user info from Firestore
    const userRef = adminDb.collection("users").doc(userRecord.uid);
    const userDoc = await userRef.get();

    let firstName = "";
    let lastName = "";

    if (userDoc.exists) {
      const userData = userDoc.data();
      firstName = userData?.firstName || "";
      lastName = userData?.lastName || "";
    }

    // Return limited user info for privacy
    return NextResponse.json({
      success: true,
      user: {
        id: userRecord.uid,
        email: userRecord.email,
        firstName,
        lastName,
        displayName:
          firstName && lastName
            ? `${firstName} ${lastName}`
            : userRecord.email?.split("@")[0] || "User",
      },
    });
  } catch (error: any) {
    console.error("Error searching for user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search for user" },
      { status: 500 }
    );
  }
}
