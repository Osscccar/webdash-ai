"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

interface AuthRequiredProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirect?: boolean;
  redirectTo?: string;
}

export function AuthRequired({
  children,
  fallback = <div>Loading...</div>,
  redirect = true,
  redirectTo = "/auth/login",
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
      router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`);
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
