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
} from "firebase/auth";
import { AuthContext, AuthProviderProps } from "@/hooks/use-auth";
import { auth, googleProvider } from "@/config/firebase";
import { UserData } from "@/types";

// Simple mock user data for development - use this if not using Firebase
const mockUserData: UserData = {
  id: "mock-user-id",
  email: "user@example.com",
  firstName: "Demo",
  lastName: "User",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  authProvider: "firebase",
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth on mount
  useEffect(() => {
    console.log("AuthProvider: Initializing auth");
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("AuthProvider: Auth state changed", firebaseUser?.email);
      setUser(firebaseUser);

      // If we have a user, create mock userData
      // In a real app, you'd fetch this from Firestore
      if (firebaseUser) {
        setUserData({
          ...mockUserData,
          id: firebaseUser.uid,
          email: firebaseUser.email || mockUserData.email,
          firstName:
            firebaseUser.displayName?.split(" ")[0] || mockUserData.firstName,
          lastName:
            firebaseUser.displayName?.split(" ")[1] || mockUserData.lastName,
        });
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
      await signInWithPopup(auth, googleProvider);
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
      await signInWithEmailAndPassword(auth, email, password);
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
      await createUserWithEmailAndPassword(auth, email, password);
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
