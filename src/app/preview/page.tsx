"use client";

import { useState, useEffect, useRef } from "react";
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
  // Debug hook call order
  console.log("PreviewPage: Starting render");

  // 1. Router hook
  const router = useRouter();
  console.log("PreviewPage: useRouter called");

  // 2. Toast hook
  const { toast } = useToast();
  console.log("PreviewPage: useToast called");

  // 3. Auth hook
  const { user, userData, loading: authLoading } = useAuth();
  console.log("PreviewPage: useAuth called", { user: !!user, authLoading });

  // 4. All useState hooks in the same order every time
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(true);
  const [website, setWebsite] = useState<any>(null);
  const [siteInfo, setSiteInfo] = useState<any>(null);
  const [initComplete, setInitComplete] = useState(false);
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

  // 5. useRef hook
  const mountedRef = useRef(true);
  const initRef = useRef(false);

  console.log("PreviewPage: All hooks called");

  useEffect(() => {
    const handlePreviewReload = () => {
      const justPurchased = sessionStorage.getItem(
        "webdash_just_purchased_on_preview"
      );

      if (justPurchased) {
        console.log("🔄 Preview auto-reload: User just purchased subscription");
        sessionStorage.removeItem("webdash_just_purchased_on_preview");

        // Reload to refresh subscription status
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };

    handlePreviewReload();

    // Check when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handlePreviewReload();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // 6. useEffect hook - always called in the same position
  useEffect(() => {
    console.log("PreviewPage: useEffect triggered");

    // Prevent double initialization
    if (initRef.current) {
      console.log("PreviewPage: Already initialized, skipping");
      return;
    }
    initRef.current = true;

    async function initialize() {
      console.log("PreviewPage: Starting initialization");

      try {
        // Step 1: Check for site info
        const savedSiteInfo = localStorage.getItem("webdash_site_info");
        if (!savedSiteInfo) {
          console.log("PreviewPage: No site info found, redirecting to home");
          if (mountedRef.current) {
            toast({
              title: "No website in progress",
              description: "Please generate a website first",
            });
            router.push("/");
          }
          return;
        }

        // Step 2: Parse site info
        let parsedSiteInfo;
        try {
          parsedSiteInfo = JSON.parse(savedSiteInfo);
          console.log("PreviewPage: Site info parsed successfully");
          if (mountedRef.current) {
            setSiteInfo(parsedSiteInfo);
          }
        } catch (e) {
          console.error("PreviewPage: Error parsing site info", e);
          if (mountedRef.current) {
            router.push("/");
          }
          return;
        }

        // Step 3: Check for existing website
        const savedWebsite = localStorage.getItem("webdash_website");
        if (savedWebsite) {
          try {
            const websiteData = JSON.parse(savedWebsite);
            if (websiteData?.siteUrl) {
              console.log("PreviewPage: Existing website found");
              if (mountedRef.current) {
                setWebsite(websiteData);
                setGenerationState({
                  showAuthPopup: false,
                  showGenerationPopup: false,
                  showGenerationStatus: false,
                  showWebsiteReadyPopup: false,
                  jobId: null,
                });
                setIsLoading(false);
                setInitComplete(true);
              }
              return;
            }
          } catch (e) {
            console.error("PreviewPage: Error parsing website data:", e);
          }
        }

        // Step 4: Wait for auth to complete
        if (authLoading) {
          console.log("PreviewPage: Auth still loading, waiting...");
          // Don't proceed until auth is complete
          return;
        }

        console.log("PreviewPage: Auth complete, user:", !!user);

        // Step 5: Set appropriate state based on auth
        if (mountedRef.current) {
          if (!user) {
            console.log("PreviewPage: No user, showing auth popup");
            setGenerationState({
              showAuthPopup: true,
              showGenerationPopup: false,
              showGenerationStatus: false,
              showWebsiteReadyPopup: false,
              jobId: null,
            });
          } else {
            console.log(
              "PreviewPage: User authenticated, showing generation popup"
            );
            setGenerationState({
              showAuthPopup: false,
              showGenerationPopup: true,
              showGenerationStatus: false,
              showWebsiteReadyPopup: false,
              jobId: null,
            });
            // Clear any existing job ID
            localStorage.removeItem("webdash_job_id");
          }
          setIsLoading(false);
          setInitComplete(true);
        }
      } catch (error) {
        console.error("PreviewPage: Error in initialization:", error);
        if (mountedRef.current) {
          setIsLoading(false);
          setInitComplete(true);
        }
      }
    }

    initialize();

    return () => {
      console.log("PreviewPage: useEffect cleanup");
      mountedRef.current = false;
    };
  }, [user, authLoading, router, toast]); // Stable dependencies

  // Derived state (computed after all hooks)
  const hasActiveSubscription = userData?.webdashSubscription?.active || false;
  const {
    showAuthPopup,
    showGenerationPopup,
    showGenerationStatus,
    showWebsiteReadyPopup,
    jobId,
  } = generationState;
  const pageBlurred =
    showAuthPopup || showGenerationPopup || showWebsiteReadyPopup;
  const showWarningBanner =
    !hasActiveSubscription && website && !showGenerationStatus;
  const isGenerating = showGenerationStatus && jobId;

  // Handler functions (defined after all hooks)
  const handleAuthSuccess = () => {
    console.log("PreviewPage: Auth success");
    setGenerationState((prev) => ({
      ...prev,
      showAuthPopup: false,
      showGenerationPopup: true,
    }));
  };

  const handleJobStart = (jobId: string) => {
    console.log("PreviewPage: Job started with ID:", jobId);
    setGenerationState((prev) => ({
      ...prev,
      showGenerationPopup: false,
      showGenerationStatus: true,
      jobId,
    }));
  };

  // src/app/preview/page.tsx - Fixed handleGenerationComplete function

  const handleGenerationComplete = (websiteData: any) => {
    console.log("PreviewPage: Generation complete:", websiteData);

    // ✅ FIXED: Don't immediately clear localStorage or assume this replaces existing websites
    // Instead, store with a unique identifier and let dashboard handle the merge

    // Add a timestamp to ensure uniqueness
    const uniqueWebsiteData = {
      ...websiteData,
      id: websiteData.id || `website-${Date.now()}`,
      createdAt: websiteData.createdAt || new Date().toISOString(),
    };

    // Store in localStorage with unique key to prevent conflicts
    localStorage.setItem("webdash_website", JSON.stringify(uniqueWebsiteData));

    // Set local state
    setWebsite(uniqueWebsiteData);

    setGenerationState((prev) => ({
      ...prev,
      showGenerationStatus: false,
      showWebsiteReadyPopup: true,
      jobId: null,
    }));

    // ✅ FIXED: Don't remove job ID immediately - let dashboard handle cleanup
    // localStorage.removeItem("webdash_job_id");

    setTimeout(() => {
      setGenerationState((prev) => ({
        ...prev,
        showWebsiteReadyPopup: false,
      }));
    }, 5000);
  };

  const handleGenerationCancel = () => {
    console.log("PreviewPage: Generation cancelled");
    setGenerationState((prev) => ({
      ...prev,
      showGenerationStatus: false,
      jobId: null,
    }));
    localStorage.removeItem("webdash_job_id");
  };

  const handleGenerationRetry = (newJobId: string) => {
    console.log("PreviewPage: Retrying generation with new job ID:", newJobId);
    setGenerationState((prev) => ({
      ...prev,
      jobId: newJobId,
    }));
  };

  const handleEditClick = () => {
    if (hasActiveSubscription) {
      router.push("/dashboard");
    } else {
      setIsTrialModalOpen(true);
    }
  };

  const handleElementClick = () => {
    if (!hasActiveSubscription) {
      setIsTrialModalOpen(true);
    }
  };

  const handleStartSubscription = async (planId: string) => {
    setSelectedPlan(planId);
    setIsTrialModalOpen(false);

    // ✅ Set flag for preview page reload
    sessionStorage.setItem("webdash_just_purchased_on_preview", "true");

    toast({
      title: "Subscription activated!",
      description: "Your subscription has been activated successfully.",
    });

    // ✅ Reload preview page after subscription
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };
  console.log(
    "PreviewPage: About to render, isLoading:",
    isLoading,
    "authLoading:",
    authLoading
  );

  // Render loading state if still initializing
  if (isLoading || authLoading || !initComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f58327]"></div>
          <p className="text-lg text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  console.log("PreviewPage: Rendering main content");

  // Main render
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <PreviewHeader
        deviceView={deviceView}
        setDeviceView={setDeviceView}
        onEditClick={handleEditClick}
        hasActiveSubscription={hasActiveSubscription}
        isGenerating={isGenerating}
      />

      {showWarningBanner && (
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
        onStartTrial={handleStartSubscription}
        selectedPlan={selectedPlan}
      />
    </div>
  );
}
