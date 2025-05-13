"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Create a search params wrapper component that uses the hook
function SearchParamsWrapper({ children }: { children: React.ReactNode }) {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(
    null
  );

  useEffect(() => {
    // Only run in the browser
    if (typeof window !== "undefined") {
      setSearchParams(new URLSearchParams(window.location.search));
    }
  }, []);

  if (!searchParams) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  return children;
}

// Main login component that doesn't directly use useSearchParams
function LoginPageContent() {
  const { user, signInWithEmail, signInWithGoogle, error, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirect, setRedirect] = useState("/dashboard");

  // Get the redirect URL from the URL on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const redirectParam = params.get("redirect");
      if (redirectParam) {
        setRedirect(redirectParam);
      }
    }
  }, []);

  // Redirect authenticated users
  useEffect(() => {
    if (user) {
      setIsRedirecting(true);

      // Before redirecting, check if we should go to preview
      const previewRedirect = localStorage.getItem("webdash_website");

      if (previewRedirect && redirect === "/dashboard") {
        // If we're coming from website generation, go to preview instead
        router.push("/preview");
        return;
      }

      // Otherwise, do the normal check
      const checkPageExists = async () => {
        try {
          const response = await fetch(redirect, { method: "HEAD" });
          if (response.status === 404) {
            console.error(
              `Page not found: ${redirect}, redirecting to dashboard instead`
            );
            router.push("/dashboard");
          } else {
            router.push(redirect);
          }
        } catch (error) {
          console.error("Error checking page:", error);
          // On error, redirect to dashboard as fallback
          router.push("/dashboard");
        }
      };

      checkPageExists();
    }
  }, [user, router, redirect]);

  // Show error message if auth failed
  useEffect(() => {
    if (error) {
      toast({
        title: "Authentication failed",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Validation error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    await signInWithEmail(email, password);
  };

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
  };

  // Render website preview in background if coming from editor
  const isFromEditor =
    redirect.includes("/preview") || redirect.includes("/editor");

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Signing you in..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Website preview if coming from editor */}
      {isFromEditor && (
        <div className="hidden md:flex md:w-1/2 bg-gray-100 items-center justify-center p-6">
          <div className="text-center">
            <div className="w-full max-w-md mx-auto rounded-lg overflow-hidden shadow-xl">
              <div className="bg-gray-700 h-40 flex items-center justify-center">
                <p className="text-white text-lg">Website Preview</p>
              </div>
              <div className="bg-white p-8">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
            <p className="mt-6 text-gray-600">
              Sign in to view and edit your generated website
            </p>
          </div>
        </div>
      )}

      {/* Login form */}
      <div
        className={`flex-1 flex items-center justify-center p-6 ${
          isFromEditor ? "md:w-1/2" : "w-full"
        }`}
      >
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <Link href="/" className="flex items-center space-x-2">
                <span className="font-medium text-xl tracking-tight">
                  <span className="text-[#f58327]">Web</span>
                  <span className="text-black">Dash</span>
                </span>
              </Link>
            </div>
            <CardTitle className="text-2xl text-center">Log in</CardTitle>
            <CardDescription className="text-center">
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleEmailLogin} className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-[#f58327] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#f58327] hover:bg-[#f58327]/90"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="flex items-center">
              <Separator className="flex-1" />
              <span className="px-3 text-sm text-gray-500">OR</span>
              <Separator className="flex-1" />
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={loading}
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
              Sign in with Google
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                href={`/auth/signup${
                  redirect && redirect !== "/dashboard"
                    ? `?redirect=${encodeURIComponent(redirect)}`
                    : ""
                }`}
                className="text-[#f58327] hover:underline"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// Export the page component that wraps the content with Suspense
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" message="Loading..." />
        </div>
      }
    >
      <SearchParamsWrapper>
        <LoginPageContent />
      </SearchParamsWrapper>
    </Suspense>
  );
}
