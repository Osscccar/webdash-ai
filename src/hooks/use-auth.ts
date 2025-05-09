"use client";

import { createContext, useContext, ReactNode } from "react";
import { User } from "firebase/auth";
import { UserData } from "@/types";

// Define the shape of our auth context
interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserData>) => Promise<void>;
  clearError: () => void;
}

// Create the auth context with a default value of null
const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Export the provider for use in src/providers/auth-provider.tsx
export { AuthContext };

// Export the provider interface
export interface AuthProviderProps {
  children: ReactNode;
}
