"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner"; // You may need to create this component

interface AuthRequiredProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirect?: boolean;
  redirectTo?: string;
}

export function AuthRequired({
  children,
  fallback = <LoadingScreen />,
  redirect = true,
  redirectTo = "/login",
}: AuthRequiredProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !loading && !user && redirect) {
      const currentPath = window.location.pathname;
      // Check if path exists in the app's routes
      const encodedPath = encodeURIComponent(currentPath);
      console.log(
        `User not authenticated, redirecting to ${redirectTo}?redirect=${encodedPath}`
      );
      router.push(`${redirectTo}?redirect=${encodedPath}`);
    }
  }, [isClient, user, loading, redirect, redirectTo, router]);

  if (!isClient || loading) {
    return fallback;
  }

  if (!user) {
    return fallback;
  }

  return <>{children}</>;
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f58327]"></div>
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
