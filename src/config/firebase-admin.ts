// src/lib/firebase-admin.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Your service account credentials
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

// Initialize Firebase Admin
function initAdmin() {
  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  return {
    db: getFirestore(),
    auth: getAuth(),
  };
}

const adminApp = initAdmin();
export const adminDb = adminApp.db;
export const adminAuth = adminApp.auth;

// Export the initAdmin function for use in API routes
export { initAdmin };
