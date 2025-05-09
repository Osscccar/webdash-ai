"use client";

import { useState, useEffect } from "react";
import {
  User,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, googleProvider } from "@/config/firebase";
import { AuthContext, AuthProviderProps } from "@/hooks/use-auth";
import { UserData } from "@/types";

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

          if (userDoc.exists()) {
            // User exists in Firestore
            const userData = userDoc.data() as UserData;
            setUserData({ id: firebaseUser.uid, ...userData });
          } else {
            // Create new user document
            const newUserData: UserData = {
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              firstName: firebaseUser.displayName?.split(" ")[0] || "",
              lastName:
                firebaseUser.displayName?.split(" ").slice(1).join(" ") || "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              authProvider: "firebase",
            };

            await setDoc(doc(db, "users", firebaseUser.uid), {
              ...newUserData,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });

            setUserData(newUserData);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setError("Failed to load user data");
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await signInWithPopup(auth, googleProvider);

      // Update user document
      if (result.user) {
        const userDocRef = doc(db, "users", result.user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          // Update existing user
          await updateDoc(userDocRef, {
            updatedAt: serverTimestamp(),
            authProvider: "google",
          });
        } else {
          // Create new user
          const displayName = result.user.displayName || "";
          const nameParts = displayName.split(" ");
          const firstName = nameParts[0] || "";
          const lastName = nameParts.slice(1).join(" ") || "";

          await setDoc(userDocRef, {
            id: result.user.uid,
            email: result.user.email || "",
            firstName,
            lastName,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            authProvider: "google",
          });
        }
      }
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

      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Set display name if provided
      if (result.user && (firstName || lastName)) {
        const displayName = `${firstName || ""} ${lastName || ""}`.trim();
        await updateProfile(result.user, { displayName });
      }

      // Create user document
      if (result.user) {
        await setDoc(doc(db, "users", result.user.uid), {
          id: result.user.uid,
          email: result.user.email || "",
          firstName: firstName || "",
          lastName: lastName || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          authProvider: "firebase",
        });
      }
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
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err.message || "Failed to send password reset email");
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (data: Partial<UserData>) => {
    if (!user || !userData) {
      setError("No user logged in");
      return;
    }

    try {
      setLoading(true);

      const userDocRef = doc(db, "users", user.uid);

      await updateDoc(userDocRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setUserData({
        ...userData,
        ...data,
      });
    } catch (err: any) {
      console.error("Profile update error:", err);
      setError(err.message || "Failed to update profile");
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
    updateUserProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
