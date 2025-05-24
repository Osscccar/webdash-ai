import { doc, setDoc } from "firebase/firestore";
import { db } from "@/config/firebase";

export interface NotificationData {
  userId: string;
  type: string;
  message: string;
  metadata?: Record<string, any>;
}

export const addNotification = async (data: NotificationData) => {
  try {
    const notificationRef = doc(db, "notifications", `${data.userId}_${Date.now()}`);
    await setDoc(notificationRef, {
      ...data,
      timestamp: new Date(),
      read: false,
    });
  } catch (error) {
    console.error("Error adding notification:", error);
  }
};

export const NotificationTypes = {
  PROFILE_UPDATE: "profile_update",
  SUBSCRIPTION_CANCELLED: "subscription_cancelled",
  SUBSCRIPTION_UPDATED: "subscription_updated",
  WEBSITE_CREATED: "website_created",
  WEBSITE_UPDATED: "website_updated",
  WEBSITE_DELETED: "website_deleted",
  WORKSPACE_CREATED: "workspace_created",
  WORKSPACE_UPDATED: "workspace_updated",
  COLLABORATOR_ADDED: "collaborator_added",
  COLLABORATOR_REMOVED: "collaborator_removed",
} as const;