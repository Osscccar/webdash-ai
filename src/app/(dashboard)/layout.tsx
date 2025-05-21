// src/app/(dashboard)/layout.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for authentication and subscription status
    const checkAccess = async () => {
      // Wait for auth to load
      if (authLoading) return;

      // If not authenticated, redirect to login
      if (!user) {
        router.push(`/login?redirect=${encodeURIComponent("/dashboard")}`);
        return;
      }

      // Check if the user has an active subscription
      const hasSubscription = userData?.webdashSubscription?.active || false;

      if (!hasSubscription) {
        // No subscription - redirect to preview
        router.push("/preview");
        return;
      }

      // User is authenticated and has subscription - allow access
      setIsLoading(false);
    };

    checkAccess();
  }, [router, user, userData, authLoading]);

  // Show loading spinner while checking
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  // Render dashboard content
  return <>{children}</>;
}
