import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const realtime = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

// Collection names - match these with your existing Firebase collections
export const USERS_COLLECTION = "users";
export const WEBSITES_COLLECTION = "websites";
export const SUBSCRIPTIONS_COLLECTION = "subscriptions";

// Create a user document in Firestore
export const createUserDocument = async (userId: string, userData: any) => {
  try {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    await userRef.set(userData, { merge: true });
    return userData;
  } catch (error) {
    console.error("Error creating user document:", error);
    throw error;
  }
};

// Get a user document from Firestore
export const getUserDocument = async (userId: string) => {
  try {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    const userSnapshot = await userRef.get();

    if (userSnapshot.exists) {
      return { id: userSnapshot.id, ...userSnapshot.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting user document:", error);
    throw error;
  }
};

// Update a user document in Firestore
export const updateUserDocument = async (userId: string, userData: any) => {
  try {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    await userRef.update(userData);
    return userData;
  } catch (error) {
    console.error("Error updating user document:", error);
    throw error;
  }
};

export { app, auth, db, storage, realtime, googleProvider };
