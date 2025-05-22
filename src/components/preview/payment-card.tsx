"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStripe } from "@/hooks/use-stripe";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Maximize2, X, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { PrimaryButton } from "@/components/ui/custom-button";
import { PLANS } from "@/config/stripe";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { PaymentForm } from "@/components/payment/payment-form";
import { Switch } from "../ui/switch";
import Image from "next/image";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface PaymentCardProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTrial: (plan: string) => void;
  selectedPlan?: string;
}

export function PaymentCard({
  isOpen,
  onClose,
  onStartTrial,
  selectedPlan: initialSelectedPlan,
}: PaymentCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, userData } = useAuth();
  const { startTrial, isLoading } = useStripe();
  const [websiteUrl, setWebsiteUrl] = useState<string | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotKey, setScreenshotKey] = useState<number>(Date.now());

  const [isAnnual, setIsAnnual] = useState(true); // Changed from false to true
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<
    "monthly" | "annual"
  >("annual"); // Changed from "monthly" to "annual"
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isLoadingScreenshot, setIsLoadingScreenshot] = useState(true);
  const [siteInfo, setSiteInfo] = useState<any>(null);

  const handleContinue = (productId: string) => {
    setSelectedPlan(productId);
    setSelectedInterval(isAnnual ? "annual" : "monthly");
    setShowPaymentForm(true);
  };

  const handleBackToPlans = () => {
    setSelectedPlan(null);
    setShowPaymentForm(false);
  };

  // Modified handlePaymentSuccess function in PaymentCard
  const handlePaymentSuccess = async (productId: string) => {
    try {
      // ✅ Set flag that user just purchased subscription
      sessionStorage.setItem("webdash_just_purchased", "true");

      toast({
        title: "Subscription activated!",
        description: "Your subscription has been activated successfully.",
      });

      // ✅ UPDATED: Redirect to dashboard after successful payment
      // The dashboard will auto-reload when it detects the purchase flag
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Error",
        description: "There was a problem processing your payment.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Get the site info and website data from localStorage
    const savedInfo = localStorage.getItem("webdash_site_info");
    const savedWebsite = localStorage.getItem("webdash_website");
    const savedSubdomain = localStorage.getItem("webdash_subdomain");

    setIsLoadingScreenshot(true);

    if (savedInfo) {
      try {
        setSiteInfo(JSON.parse(savedInfo));
      } catch (e) {
        console.error("Error parsing site info:", e);
      }
    }

    // Try to get the website URL from various sources
    let siteUrl = null;
    if (savedWebsite) {
      try {
        const websiteData = JSON.parse(savedWebsite);
        siteUrl = websiteData.siteUrl;
        setWebsiteUrl(siteUrl);
      } catch (e) {
        console.error("Error parsing website data:", e);
      }
    } else if (savedSubdomain) {
      // Construct URL from subdomain if website object not available
      siteUrl = `https://${savedSubdomain}.webdash.site`;
      setWebsiteUrl(siteUrl);
    }

    // Generate screenshot URL if we have a website URL using our API route
    if (siteUrl) {
      const apiUrl = `/api/screenshot?url=${encodeURIComponent(
        siteUrl
      )}&key=${screenshotKey}`;
      setScreenshotUrl(apiUrl);

      // Set a timer to hide the loading spinner after a reasonable time
      // This helps ensure we don't show the spinner indefinitely if the image loads quickly
      const timer = setTimeout(() => {
        setIsLoadingScreenshot(false);
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      setScreenshotUrl(null);
      setIsLoadingScreenshot(false);
    }
  }, [screenshotKey]);

  const refreshScreenshot = () => {
    setIsLoadingScreenshot(true);
    // Update the key to force a refresh
    setScreenshotKey(Date.now());
  };

  const renderFeature = (text: string) => (
    <div className="flex items-start space-x-2">
      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl p-0 overflow-hidden bg-white h-auto max-h-[90vh]">
        <div className="overflow-y-auto max-h-[90vh]">
          {!showPaymentForm ? (
            <div className="flex flex-col">
              {/* Header with pricing title and preview */}
              <div className="p-4 mb-4 border-b sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  {/* Left side with title, now with centered content vertically */}
                  <div className="flex h-36 flex-col justify-center">
                    <h2 className="text-2xl font-semibold">Choose Your Plan</h2>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-black">
                        Save{" "}
                        <span className="text-[#f58327] font-semibold">
                          25%
                        </span>{" "}
                        with Annual
                      </span>
                    </div>
                    {/* Toggle section - moved down, just above the pricing plans */}
                    <div className="flex  pt-0 sticky top-[80px] bg-white z-5">
                      <div className="mt-3 border rounded-full px-4 py-2 inline-flex items-center gap-3">
                        <span
                          className={`text-sm font-medium ${
                            !isAnnual ? "text-[#f58327]" : "text-gray-600"
                          }`}
                        >
                          Monthly
                        </span>

                        <Switch
                          className="cursor-pointer"
                          onClick={() => setIsAnnual(!isAnnual)}
                          checked={isAnnual} // Added checked property to show annual is selected
                        />

                        <span
                          className={`text-sm font-medium ${
                            isAnnual ? "text-[#f58327]" : "text-gray-600"
                          }`}
                        >
                          Annually
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Website Screenshot Preview */}
                  <div className="w-64">
                    {/* Browser mockup */}
                    <div className="border rounded-md overflow-hidden shadow-sm">
                      {/* Browser Header */}
                      <div className="bg-gray-100 p-1.5 flex items-center border-b">
                        <div className="flex space-x-1 mr-2">
                          <div className="w-2 h-2 rounded-full bg-red-400"></div>
                          <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                          <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        </div>
                      </div>

                      {/* Website Screenshot Frame */}
                      <div className="relative bg-white w-full h-36 overflow-hidden">
                        {isLoadingScreenshot ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#f58327]"></div>
                          </div>
                        ) : screenshotUrl ? (
                          <div className="relative w-full h-full">
                            <img
                              src={screenshotUrl}
                              alt="Website Preview"
                              className="w-full h-full object-cover object-top"
                              onLoad={() => setIsLoadingScreenshot(false)}
                              onError={(e) => {
                                console.error("Error loading screenshot", e);
                                setIsLoadingScreenshot(false);
                              }}
                            />
                          </div>
                        ) : (
                          // Fallback when no URL is available
                          <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 text-xs text-center p-2">
                            <p>Your website preview will appear here</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-left">
                      Preview of your published website
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing Plans */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 pt-0">
                {/* Business Plan */}
                <div className="border rounded-md overflow-hidden hover:shadow-sm transition-shadow h-full">
                  <div className="p-4 border-b bg-gray-50">
                    <h3 className="text-lg font-semibold">Business</h3>
                    <div className="flex items-baseline mt-1">
                      <span className="text-2xl font-bold">
                        ${isAnnual ? "15" : "20"}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">
                        /per month
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ${isAnnual ? "18" : "18"} per additional website
                    </div>
                  </div>

                  <div className="p-4">
                    <PrimaryButton
                      className="w-full mb-3 py-1.5 h-auto text-sm cursor-pointer"
                      onClick={() => handleContinue(PLANS.business.id)}
                    >
                      Continue
                    </PrimaryButton>

                    <div className="space-y-2 text-sm">
                      {renderFeature("Generate up to 7 Pages")}
                      {renderFeature("Drag & Drop Editor")}

                      {renderFeature("10K Monthly Visitors")}
                      {renderFeature("Elementor AI Assistant")}
                      {renderFeature("Ecommerce Functionality")}
                      {renderFeature("Free SSL Certificate")}
                      {renderFeature("2 Site Regenerations")}
                      {renderFeature("Search Engine Optimization")}
                    </div>
                  </div>
                </div>

                {/* Agency Plan */}
                <div className="border-2 border-[#f58327] rounded-md overflow-hidden shadow-sm h-full relative">
                  <div className="absolute top-0 right-0">
                    <span className="bg-[#f58327] text-white text-xs font-semibold px-2 py-0.5 rounded-bl-md">
                      Popular
                    </span>
                  </div>

                  <div className="p-4 border-b bg-gray-50">
                    <h3 className="text-lg font-semibold">Agency</h3>
                    <div className="flex items-baseline mt-1">
                      <span className="text-2xl font-bold">
                        ${isAnnual ? "37" : "50"}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">
                        /per month
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ${isAnnual ? "15" : "15"} per additional website
                    </div>
                  </div>

                  <div className="p-4">
                    <PrimaryButton
                      className="w-full mb-3 py-1.5 h-auto text-sm cursor-pointer"
                      onClick={() => handleContinue(PLANS.agency.id)}
                    >
                      Continue
                    </PrimaryButton>

                    <div className="text-xs font-medium mb-2 text-gray-700">
                      everything in Business and:
                    </div>
                    <div className="space-y-2 text-sm">
                      {renderFeature("3 Live Websites Included")}
                      {renderFeature("50K Monthly Visitors")}
                      {renderFeature("3 Workspaces")}
                      {renderFeature("Invite 3 Collaborators")}
                      {renderFeature("Unlimited AI Image Generation")}
                      {renderFeature("3 Workspaces")}
                      {renderFeature("10 Site Regenerations")}
                      {renderFeature("Priority Support")}
                    </div>
                  </div>
                </div>

                {/* Enterprise Plan */}
                <div className="border rounded-md overflow-hidden hover:shadow-sm transition-shadow h-full">
                  <div className="p-4 border-b bg-gray-50">
                    <h3 className="text-lg font-semibold">Enterprise</h3>
                    <div className="flex items-baseline mt-1">
                      <span className="text-2xl font-bold">
                        ${isAnnual ? "60" : "80"}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">
                        /per month
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ${isAnnual ? "12" : "12"} per additional website
                    </div>
                  </div>

                  <div className="p-4">
                    <PrimaryButton
                      className="w-full mb-3 py-1.5 h-auto text-sm cursor-pointer"
                      onClick={() => handleContinue(PLANS.enterprise.id)}
                    >
                      Continue
                    </PrimaryButton>

                    <div className="text-xs font-medium mb-2 text-gray-700">
                      everything in Agency and:
                    </div>
                    <div className="space-y-2 text-sm">
                      {renderFeature("5 Live Websites Included")}

                      {renderFeature("100K+ Monthly Visitors")}
                      {renderFeature("Hide our branding")}
                      {renderFeature("Unlimited Collaborators")}
                      {renderFeature("Unlimited Workspaces")}
                      {renderFeature("30 Site Regenerations")}
                      {renderFeature("VIP 1-on-1 Support")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Elements stripe={stripePromise}>
              <div className="p-6 w-full">
                <button
                  onClick={handleBackToPlans}
                  className="text-[#f58327] hover:underline mb-4 flex items-center cursor-pointer"
                >
                  ← Back to plans
                </button>

                <PaymentForm
                  productId={selectedPlan || ""}
                  interval={selectedInterval}
                  customerData={{
                    email: userData?.email || user?.email || "",
                    name: `${userData?.firstName || ""} ${
                      userData?.lastName || ""
                    }`,
                  }}
                  onSuccess={handlePaymentSuccess}
                />
              </div>
            </Elements>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
