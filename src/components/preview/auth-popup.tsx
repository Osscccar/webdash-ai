// src/components/preview/auth-popup.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/use-toast";
import { PrimaryButton } from "@/components/ui/custom-button";
import { useDataSync } from "@/hooks/use-data-sync";

interface AuthPopupProps {
  onSuccess: () => void;
}

export function AuthPopup({ onSuccess }: AuthPopupProps) {
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle, signUpWithEmail, error } =
    useAuth();
  const { toast } = useToast();
  const { syncToFirestore } = useDataSync();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "login") {
        await signInWithEmail(email, password);

        // Transfer any localStorage data to Firestore here
        await syncToFirestore();

        onSuccess();
      } else {
        // Validate fields for signup
        if (password !== confirmPassword) {
          toast({
            title: "Passwords do not match",
            description: "Please make sure your passwords match",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        await signUpWithEmail(email, password, firstName, lastName);

        // Transfer any localStorage data to Firestore here
        await syncToFirestore();

        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Authentication error",
        description: error.message || "An error occurred during authentication",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();

      // Transfer any localStorage data to Firestore here
      await syncToFirestore();

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Google authentication error",
        description: error.message || "An error occurred during Google sign-in",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {mode === "login" ? "Sign in to continue" : "Create an account"}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === "login"
              ? "Sign in to view and edit your website"
              : "Create an account to save and edit your website"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder={
                  mode === "login" ? "Your password" : "Create a password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <PrimaryButton
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading
                ? mode === "login"
                  ? "Signing in..."
                  : "Creating account..."
                : mode === "login"
                ? "Sign in"
                : "Create account"}
            </PrimaryButton>
          </form>

          <div className="flex items-center">
            <Separator className="flex-1" />
            <span className="px-3 text-sm text-gray-500">OR</span>
            <Separator className="flex-1" />
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleAuth}
            disabled={isLoading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-5 w-5 mr-2"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {mode === "login" ? "Sign in with Google" : "Sign up with Google"}
          </Button>

          {error && (
            <div className="text-sm text-red-500 text-center">{error}</div>
          )}
        </CardContent>

        <CardFooter className="flex justify-center pb-6">
          <p className="text-sm text-gray-600">
            {mode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <Button
              variant="link"
              className="text-[#f58327] hover:underline p-0 h-auto font-normal"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
            >
              {mode === "login" ? "Sign up" : "Log in"}
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
