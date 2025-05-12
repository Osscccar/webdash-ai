// src/app/preview/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PreviewHeader } from "@/components/preview/preview-header";
import { WebsitePreview } from "@/components/preview/website-preview";
import { TrialModal } from "@/components/preview/trial-modal";
import { AuthPopup } from "@/components/preview/auth-popup";
import { GenerationPopup } from "@/components/preview/generation-popup";
import { WebsiteReadyPopup } from "@/components/preview/website-ready-popup";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/use-toast";
import { PrimaryButton } from "@/components/ui/custom-button";

export default function PreviewPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [hasTrialStarted, setHasTrialStarted] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [isLoading, setIsLoading] = useState(true);

  // New states for the updated flow
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [showGenerationPopup, setShowGenerationPopup] = useState(false);
  const [showWebsiteReadyPopup, setShowWebsiteReadyPopup] = useState(false);
  const [websiteGenerated, setWebsiteGenerated] = useState(false);
  const [siteInfo, setSiteInfo] = useState<any>(null);

  // Check if the user has an active subscription
  const hasActiveSubscription = userData?.webdashSubscription?.active || false;

  useEffect(() => {
    // Check if there's a website information in progress
    const savedSiteInfo = localStorage.getItem("webdash_site_info");
    if (savedSiteInfo) {
      try {
        setSiteInfo(JSON.parse(savedSiteInfo));
      } catch (e) {
        console.error("Error parsing site info:", e);
      }
    } else {
      toast({
        title: "No website in progress",
        description: "Please generate a website first",
      });
      router.push("/");
      return;
    }

    // Check if website is already generated
    const savedWebsite = localStorage.getItem("webdash_website");
    if (savedWebsite) {
      try {
        const websiteData = JSON.parse(savedWebsite);
        if (websiteData.siteUrl) {
          setWebsiteGenerated(true);
        }
      } catch (e) {
        console.error("Error parsing website data:", e);
      }
    }

    // Set auth popup state after checking for user
    if (!authLoading) {
      if (!user) {
        setShowAuthPopup(true);
      } else if (!websiteGenerated) {
        // If user is authenticated but website is not generated yet, show generation popup
        setShowGenerationPopup(true);
      }
    }

    setIsLoading(false);
  }, [user, authLoading, router, toast, websiteGenerated]);

  // Function to handle successful authentication
  const handleAuthSuccess = () => {
    setShowAuthPopup(false);
    setShowGenerationPopup(true);
  };

  // Function to handle successful website generation
  const handleGenerationSuccess = () => {
    setShowGenerationPopup(false);
    setWebsiteGenerated(true);
    setShowWebsiteReadyPopup(true);

    // Hide the "website ready" popup after 5 seconds
    setTimeout(() => {
      setShowWebsiteReadyPopup(false);
    }, 5000);
  };

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
  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f58327]"></div>
          <p className="text-lg text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  const pageBlurred =
    showAuthPopup || showGenerationPopup || showWebsiteReadyPopup;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <PreviewHeader
        deviceView={deviceView}
        setDeviceView={setDeviceView}
        onEditClick={handleEditClick}
        hasActiveSubscription={hasActiveSubscription || hasTrialStarted}
      />

      <main
        className={`flex-grow container mx-auto px-4 py-6 transition-all duration-300 ${
          pageBlurred ? "filter blur-sm" : ""
        }`}
      >
        <WebsitePreview
          deviceView={deviceView}
          onElementClick={handleElementClick}
          websiteGenerated={websiteGenerated}
        />
      </main>

      {showAuthPopup && <AuthPopup onSuccess={handleAuthSuccess} />}

      {showGenerationPopup && (
        <GenerationPopup
          siteInfo={siteInfo}
          onSuccess={handleGenerationSuccess}
        />
      )}

      {showWebsiteReadyPopup && <WebsiteReadyPopup />}

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
