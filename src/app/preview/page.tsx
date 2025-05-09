"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthRequired } from "@/components/auth/auth-required";
import { PreviewHeader } from "@/components/preview/preview-header";
import { WebsitePreview } from "@/components/preview/website-preview";
import { TrialModal } from "@/components/preview/trial-modal";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/use-toast";

export default function PreviewPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const { toast } = useToast();

  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [hasTrialStarted, setHasTrialStarted] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [isLoading, setIsLoading] = useState(true);

  // Check if the user has an active subscription
  const hasActiveSubscription = userData?.webdashSubscription?.active || false;

  useEffect(() => {
    // Check if there's a website in progress
    const siteInfo = localStorage.getItem("webdash_site_info");
    if (!siteInfo) {
      toast({
        title: "No website in progress",
        description: "Please generate a website first",
      });
      router.push("/");
      return;
    }

    // If user is not logged in, redirect to login
    if (!user) {
      console.log("User not authenticated, redirecting to login...");
      const currentPath = window.location.pathname;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    setIsLoading(false);
  }, [user, router, toast]);

  const handleEditClick = () => {
    if (hasActiveSubscription || hasTrialStarted) {
      router.push("/dashboard");
    } else {
      setIsTrialModalOpen(true);
    }
  };

  const handleElementClick = () => {
    if (!hasActiveSubscription && !hasTrialStarted) {
      setIsTrialModalOpen(true);
    }
  };

  const handleStartTrial = async (plan: "monthly" | "annual") => {
    // This would normally connect to your backend to start the trial
    // For demo purposes, we'll just set the local state
    setSelectedPlan(plan);
    setHasTrialStarted(true);
    setIsTrialModalOpen(false);

    toast({
      title: "Free trial started!",
      description: `You now have 7 days to explore all the features of WebDash ${
        plan === "annual" ? "Annual" : "Monthly"
      } plan.`,
    });

    // In a real implementation, this would also update the user's subscription status in Firebase
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
  };

  // Use a loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f58327]"></div>
          <p className="text-lg text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <PreviewHeader
        deviceView={deviceView}
        setDeviceView={setDeviceView}
        onEditClick={handleEditClick}
        hasActiveSubscription={hasActiveSubscription || hasTrialStarted}
      />

      <main className="flex-grow container mx-auto px-4 py-6">
        <WebsitePreview
          deviceView={deviceView}
          onElementClick={handleElementClick}
        />
      </main>

      <TrialModal
        isOpen={isTrialModalOpen}
        onClose={() => setIsTrialModalOpen(false)}
        onStartTrial={handleStartTrial}
        selectedPlan={selectedPlan}
        setSelectedPlan={setSelectedPlan}
      />
    </div>
  );
}
