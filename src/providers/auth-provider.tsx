// src/providers/auth-provider.tsx (modified)
"use client";

import { useState, useEffect } from "react";
import {
  User,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { AuthContext, AuthProviderProps } from "@/hooks/use-auth";
import { auth, googleProvider, db } from "@/config/firebase";
import { UserData } from "@/types";

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch or create user data in Firestore
  const fetchOrCreateUserData = async (firebaseUser: User) => {
    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // User exists, update userData state
        const data = userDoc.data() as UserData;

        // Add websites array if it doesn't exist
        if (!data.websites) {
          data.websites = [];
        }

        setUserData(data);

        // Update last login time
        await updateDoc(userDocRef, {
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        // Create new user document
        const newUserData: UserData = {
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          firstName: firebaseUser.displayName?.split(" ")[0] || "",
          lastName: firebaseUser.displayName?.split(" ")[1] || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          authProvider: "firebase",
          websites: [],
        };

        await setDoc(userDocRef, {
          ...newUserData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        setUserData(newUserData);
      }
    } catch (err) {
      console.error("Error fetching/creating user data:", err);
    }
  };

  // Initialize auth on mount
  useEffect(() => {
    console.log("AuthProvider: Initializing auth");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("AuthProvider: Auth state changed", firebaseUser?.email);
      setUser(firebaseUser);

      if (firebaseUser) {
        await fetchOrCreateUserData(firebaseUser);
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Auth methods
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      await fetchOrCreateUserData(result.user);
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      setError(err.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      await fetchOrCreateUserData(result.user);
    } catch (err: any) {
      console.error("Email sign-in error:", err);
      setError(err.message || "Failed to sign in with email and password");
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update profile with name if provided
      if (firstName) {
        const displayName = lastName ? `${firstName} ${lastName}` : firstName;
        await updateProfile(result.user, { displayName });
      }

      // Create user document in Firestore
      const newUserData: UserData = {
        id: result.user.uid,
        email: email,
        firstName: firstName || "",
        lastName: lastName || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authProvider: "firebase",
        websites: [],
      };

      await setDoc(doc(db, "users", result.user.uid), {
        ...newUserData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setUserData(newUserData);
    } catch (err: any) {
      console.error("Email sign-up error:", err);
      setError(err.message || "Failed to sign up with email and password");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await firebaseSignOut(auth);
      // Clear user data
      setUserData(null);
    } catch (err: any) {
      console.error("Sign-out error:", err);
      setError(err.message || "Failed to sign out");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err.message || "Failed to send password reset email");
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    userData,
    loading,
    error,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPassword,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
