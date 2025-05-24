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

      // Check if the user has an active subscription or workspace collaborator access
      const hasSubscription = userData?.webdashSubscription?.active || false;
      const hasWorkspaceAccess = userData?.workspaces && Object.keys(userData.workspaces).length > 0;

      if (!hasSubscription && !hasWorkspaceAccess) {
        // Check if user has generated a website
        const savedWebsite = localStorage.getItem("webdash_website");

        if (savedWebsite) {
          // User has generated a website but hasn't paid - redirect to preview
          router.push("/preview");
          return;
        } else {
          // User hasn't generated a website and hasn't paid - redirect to root
          router.push("/");
          return;
        }
      }

      // User is authenticated and has subscription or workspace access - allow access
      setIsLoading(false);
    };

    checkAccess();
  }, [router, user, userData, authLoading]);

  // Show loading spinner while checking
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" message="Loading Dashboard..." />
      </div>
    );
  }

  // Render dashboard content
  return <>{children}</>;
}
