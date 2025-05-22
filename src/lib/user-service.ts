// src/lib/user-service.ts

import { adminDb } from "@/config/firebase-admin";
import { UserData } from "@/types";

// Plan configurations with website limits
const PLAN_LIMITS = {
  business: 1,
  agency: 3,
  enterprise: 5,
};

export class UserService {
  /**
   * Initialize user's website limit based on their subscription plan
   */
  static async initializeWebsiteLimit(
    userId: string,
    planType: string
  ): Promise<boolean> {
    try {
      const websiteLimit =
        PLAN_LIMITS[planType as keyof typeof PLAN_LIMITS] || 1;

      const userRef = adminDb.collection("users").doc(userId);
      await userRef.update({
        websiteLimit: websiteLimit,
        updatedAt: new Date(),
      });

      console.log(
        `Initialized website limit for user ${userId} to ${websiteLimit} for ${planType} plan`
      );
      return true;
    } catch (error) {
      console.error("Error initializing website limit:", error);
      return false;
    }
  }

  /**
   * Update user's website limit when they purchase additional websites
   */
  static async incrementWebsiteLimit(
    userId: string,
    increment = 1
  ): Promise<number | null> {
    try {
      const userRef = adminDb.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new Error("User document not found");
      }

      const userData = userDoc.data();
      const currentLimit = userData?.websiteLimit || 1;
      const newLimit = currentLimit + increment;

      await userRef.update({
        websiteLimit: newLimit,
        updatedAt: new Date(),
      });

      console.log(
        `Incremented website limit for user ${userId} from ${currentLimit} to ${newLimit}`
      );
      return newLimit;
    } catch (error) {
      console.error("Error incrementing website limit:", error);
      return null;
    }
  }

  /**
   * Get user's current website limit and usage
   */
  static async getWebsiteLimitInfo(userId: string): Promise<{
    limit: number;
    used: number;
    remaining: number;
  } | null> {
    try {
      const userRef = adminDb.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return null;
      }

      const userData = userDoc.data();
      const limit = userData?.websiteLimit || 1;
      const websites = userData?.websites || [];
      const used = websites.length;
      const remaining = Math.max(0, limit - used);

      return {
        limit,
        used,
        remaining,
      };
    } catch (error) {
      console.error("Error getting website limit info:", error);
      return null;
    }
  }

  /**
   * Check if user can create a new website
   */
  static async canCreateWebsite(userId: string): Promise<boolean> {
    try {
      const limitInfo = await this.getWebsiteLimitInfo(userId);
      return limitInfo ? limitInfo.remaining > 0 : false;
    } catch (error) {
      console.error("Error checking if user can create website:", error);
      return false;
    }
  }

  /**
   * Get user's plan type based on their subscription
   */
  static async getUserPlanType(userId: string): Promise<string> {
    try {
      const userRef = adminDb.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return "business"; // Default plan
      }

      const userData = userDoc.data();
      const subscription = userData?.webdashSubscription;

      if (!subscription?.active) {
        return "business"; // Default plan for inactive subscriptions
      }

      // Determine plan based on productId or priceId
      const productId = subscription.productId || subscription.planId || "";

      if (productId.includes("business")) {
        return "business";
      } else if (productId.includes("agency")) {
        return "agency";
      } else if (productId.includes("enterprise")) {
        return "enterprise";
      }

      return "business"; // Default fallback
    } catch (error) {
      console.error("Error getting user plan type:", error);
      return "business";
    }
  }

  /**
   * Update user's plan and adjust website limit accordingly
   */
  static async updateUserPlan(
    userId: string,
    newPlanType: string
  ): Promise<boolean> {
    try {
      const newLimit =
        PLAN_LIMITS[newPlanType as keyof typeof PLAN_LIMITS] || 1;

      const userRef = adminDb.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new Error("User document not found");
      }

      const userData = userDoc.data();
      const currentLimit = userData?.websiteLimit || 1;

      // Only increase the limit, never decrease it
      // If they had additional websites purchased, we preserve that
      const finalLimit = Math.max(newLimit, currentLimit);

      await userRef.update({
        websiteLimit: finalLimit,
        planType: newPlanType,
        updatedAt: new Date(),
      });

      console.log(
        `Updated user ${userId} plan to ${newPlanType} with website limit ${finalLimit}`
      );
      return true;
    } catch (error) {
      console.error("Error updating user plan:", error);
      return false;
    }
  }
}
