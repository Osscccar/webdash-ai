// src/lib/admin-auth-service.ts
import { adminAuth } from "@/config/firebase-admin";

export class AdminAuthService {
  /**
   * Get Firebase user by email
   */
  static async getUserByEmail(email: string) {
    try {
      // Get user by email using Firebase Admin SDK
      return await adminAuth.getUserByEmail(email);
    } catch (error) {
      console.error("Error getting user by email:", error);
      return null;
    }
  }

  /**
   * Get Firebase user by UID
   */
  static async getUserById(uid: string) {
    try {
      // Get user by ID using Firebase Admin SDK
      return await adminAuth.getUser(uid);
    } catch (error) {
      console.error("Error getting user by ID:", error);
      return null;
    }
  }

  /**
   * Update user email
   */
  static async updateUserEmail(uid: string, newEmail: string) {
    try {
      await adminAuth.updateUser(uid, {
        email: newEmail,
      });
      return true;
    } catch (error) {
      console.error("Error updating user email:", error);
      throw error;
    }
  }

  /**
   * Create a custom token for a user
   */
  static async createCustomToken(uid: string) {
    try {
      return await adminAuth.createCustomToken(uid);
    } catch (error) {
      console.error("Error creating custom token:", error);
      return null;
    }
  }
}
