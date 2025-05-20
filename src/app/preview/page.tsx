"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PreviewHeader } from "@/components/preview/preview-header";
import { WebsitePreview } from "@/components/preview/website-preview";
import { PaymentCard } from "@/components/preview/payment-card";
import { AuthPopup } from "@/components/preview/auth-popup";
import { GenerationPopup } from "@/components/preview/generation-popup";
import { WebsiteReadyPopup } from "@/components/preview/website-ready-popup";
import { GenerationStatus } from "@/components/preview/generation-status";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/use-toast";

export default function PreviewPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [hasTrialStarted, setHasTrialStarted] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(true);

  // Website and generation state
  const [website, setWebsite] = useState<any>(null);
  const [siteInfo, setSiteInfo] = useState<any>(null);
  const [generationState, setGenerationState] = useState<{
    showAuthPopup: boolean;
    showGenerationPopup: boolean;
    showGenerationStatus: boolean;
    showWebsiteReadyPopup: boolean;
    jobId: string | null;
  }>({
    showAuthPopup: false,
    showGenerationPopup: false,
    showGenerationStatus: false,
    showWebsiteReadyPopup: false,
    jobId: null,
  });

  // Check if the user has an active subscription
  const hasActiveSubscription = userData?.webdashSubscription?.active || false;

  // Initial data load
  useEffect(() => {
    async function initialize() {
      // Check if there's a website information in progress
      const savedSiteInfo = localStorage.getItem("webdash_site_info");
      if (!savedSiteInfo) {
        toast({
          title: "No website in progress",
          description: "Please generate a website first",
        });
        router.push("/");
        return;
      }

      try {
        setSiteInfo(JSON.parse(savedSiteInfo));
      } catch (e) {
        console.error("Error parsing site info:", e);
        router.push("/");
        return;
      }

      // Check for existing website first
      const savedWebsite = localStorage.getItem("webdash_website");
      if (savedWebsite) {
        try {
          const websiteData = JSON.parse(savedWebsite);
          if (websiteData?.siteUrl) {
            // We have a completed website, no need for generation
            setWebsite(websiteData);
            setGenerationState({
              showAuthPopup: false,
              showGenerationPopup: false,
              showGenerationStatus: false,
              showWebsiteReadyPopup: false,
              jobId: null,
            });
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.error("Error parsing website data:", e);
        }
      }

      // Set the appropriate state based on auth
      if (!authLoading) {
        if (!user) {
          // Need authentication first
          setGenerationState({
            showAuthPopup: true,
            showGenerationPopup: false,
            showGenerationStatus: false,
            showWebsiteReadyPopup: false,
            jobId: null,
          });
        } else {
          // User is authenticated, always start with generation popup
          // (We won't check for saved jobId because it may be stale)
          setGenerationState({
            showAuthPopup: false,
            showGenerationPopup: true,
            showGenerationStatus: false,
            showWebsiteReadyPopup: false,
            jobId: null,
          });

          // Clear any existing job ID to prevent stale references
          localStorage.removeItem("webdash_job_id");
        }
      }

      setIsLoading(false);
    }

    initialize();
  }, [user, authLoading, router, toast]);

  // Function to handle successful authentication
  const handleAuthSuccess = () => {
    setGenerationState((prev) => ({
      ...prev,
      showAuthPopup: false,
      showGenerationPopup: true,
    }));
  };

  // Function to handle job start
  const handleJobStart = (jobId: string) => {
    console.log("Job started with ID:", jobId);
    setGenerationState((prev) => ({
      ...prev,
      showGenerationPopup: false,
      showGenerationStatus: true,
      jobId,
    }));
  };

  // Function to handle generation completion
  const handleGenerationComplete = (websiteData: any) => {
    console.log("Generation complete:", websiteData);
    setWebsite(websiteData);

    setGenerationState((prev) => ({
      ...prev,
      showGenerationStatus: false,
      showWebsiteReadyPopup: true,
      jobId: null,
    }));

    // Clear job ID from localStorage
    localStorage.removeItem("webdash_job_id");

    // Hide the "website ready" popup after 5 seconds
    setTimeout(() => {
      setGenerationState((prev) => ({
        ...prev,
        showWebsiteReadyPopup: false,
      }));
    }, 5000);
  };

  // Function to handle cancellation
  const handleGenerationCancel = () => {
    // Just clean up the UI state
    setGenerationState((prev) => ({
      ...prev,
      showGenerationStatus: false,
      jobId: null,
    }));

    // Clear job ID from localStorage
    localStorage.removeItem("webdash_job_id");
  };

  // Function to handle retry with a new job ID
  const handleGenerationRetry = (newJobId: string) => {
    console.log("Retrying generation with new job ID:", newJobId);
    setGenerationState((prev) => ({
      ...prev,
      jobId: newJobId,
    }));

    // The status component will automatically start polling the new job
  };

  // Updated handleEditClick function to check for subscription
  const handleEditClick = () => {
    if (hasActiveSubscription || hasTrialStarted) {
      // If user has active subscription, redirect directly to dashboard
      router.push("/dashboard");
    } else {
      // Otherwise, show payment card
      setIsTrialModalOpen(true);
    }
  };

  const handleElementClick = () => {
    if (!hasActiveSubscription && !hasTrialStarted) {
      setIsTrialModalOpen(true);
    }
  };

  const handleStartTrial = async (planId: string) => {
    // This would normally connect to your backend to start the trial
    setSelectedPlan(planId);
    setHasTrialStarted(true);
    setIsTrialModalOpen(false);

    toast({
      title: "Subscription started!",
      description: "Your subscription has been activated successfully.",
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

  const {
    showAuthPopup,
    showGenerationPopup,
    showGenerationStatus,
    showWebsiteReadyPopup,
    jobId,
  } = generationState;

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

      {!hasActiveSubscription && !hasTrialStarted && (
        <div className="bg-amber-50 border border-amber-200 w-full py-2 px-4">
          <div className="container mx-auto flex items-center">
            <div className="p-1 rounded-full bg-amber-100 mr-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="text-sm text-amber-800">
              Your site will be deleted in 24 hours unless you upgrade.
            </p>
          </div>
        </div>
      )}

      <main
        className={`flex-grow container mx-auto px-4 py-6 transition-all duration-300 ${
          pageBlurred ? "filter blur-sm" : ""
        }`}
      >
        {showGenerationStatus && jobId ? (
          <div className="max-w-2xl mx-auto my-8">
            <GenerationStatus
              jobId={jobId}
              onComplete={handleGenerationComplete}
              onCancel={handleGenerationCancel}
              onRetry={handleGenerationRetry}
            />
          </div>
        ) : (
          <WebsitePreview
            deviceView={deviceView}
            onElementClick={handleElementClick}
            websiteGenerated={!!website}
          />
        )}
      </main>

      {showAuthPopup && <AuthPopup onSuccess={handleAuthSuccess} />}

      {showGenerationPopup && (
        <GenerationPopup siteInfo={siteInfo} onSuccess={handleJobStart} />
      )}

      {showWebsiteReadyPopup && <WebsiteReadyPopup />}

      <PaymentCard
        isOpen={isTrialModalOpen}
        onClose={() => setIsTrialModalOpen(false)}
        onStartTrial={handleStartTrial}
        selectedPlan={selectedPlan}
      />
    </div>
  );
}
