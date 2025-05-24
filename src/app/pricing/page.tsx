// src/app/pricing/page.tsx

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { PLANS } from "@/config/stripe";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { PaymentForm } from "@/components/payment/payment-form";
import { useStripe as useStripeHook } from "@/hooks/use-stripe";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { WebsiteDeletionPopup } from "@/components/dashboard/website-deletion-popup";
import { db } from "@/config/firebase";
import { doc, updateDoc, arrayRemove } from "firebase/firestore";

// Create a client component that uses useSearchParams
import ClientComponent from "./client-component";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function PricingPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const { upgradeSubscription, hasActiveSubscription } = useStripeHook();

  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeletionPopup, setShowDeletionPopup] = useState(false);
  const [targetDowngradePlan, setTargetDowngradePlan] = useState<string | null>(
    null
  );
  const [requiredDeletions, setRequiredDeletions] = useState(0);
  const [isUpgrade, setIsUpgrade] = useState(false);

  const currentPlan = userData?.webdashSubscription?.planType || "business";
  const currentWebsiteCount = userData?.websites?.length || 0;
  const currentWebsiteLimit = userData?.websiteLimit || 1;

  // Plan limits
  const planLimits = {
    business: 1,
    agency: 3,
    enterprise: 5,
  };

  // Function to handle upgrade param from the client component
  const handleUpgradeParam = (upgradeValue: boolean) => {
    setIsUpgrade(upgradeValue);
  };

  useEffect(() => {
    // If user is trying to upgrade and not logged in, redirect to login
    if (isUpgrade && !user) {
      router.push("/login?redirect=/pricing?upgrade=true");
    }
  }, [isUpgrade, user, router]);

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      router.push(`/login?redirect=/pricing`);
      return;
    }

    // Check if this is actually an upgrade
    const selectedPlanName = Object.keys(PLANS).find(
      (key) => PLANS[key as keyof typeof PLANS].id === planId
    );
    const currentPlanIndex = ["business", "agency", "enterprise"].indexOf(
      currentPlan
    );
    const selectedPlanIndex = ["business", "agency", "enterprise"].indexOf(
      selectedPlanName || ""
    );

    if (isUpgrade && selectedPlanIndex <= currentPlanIndex) {
      toast({
        title: "Invalid selection",
        description: "Please select a higher tier plan to upgrade.",
        variant: "destructive",
      });
      return;
    }

    // Check if this is a downgrade
    if (selectedPlanIndex < currentPlanIndex) {
      // This is a downgrade, check website count
      const targetPlanLimit =
        planLimits[selectedPlanName as keyof typeof planLimits] || 1;

      if (currentWebsiteCount > targetPlanLimit) {
        // User needs to delete websites first
        const websitesToDelete = currentWebsiteCount - targetPlanLimit;
        setRequiredDeletions(websitesToDelete);
        setTargetDowngradePlan(selectedPlanName || "business");
        setSelectedPlan(planId);
        setShowDeletionPopup(true);
        return;
      }
    }

    // Check if user has an active subscription
    if (hasActiveSubscription()) {
      // This is an upgrade - handle it directly
      handleUpgradeSubscription(planId, selectedPlanName || "business");
    } else {
      // This is a new subscription - show payment modal
      setSelectedPlan(planId);
      setShowPaymentModal(true);
    }
  };

  const handleDeleteWebsites = async (websiteIds: string[]) => {
    if (!user || !userData) return;

    try {
      // Delete each selected website from the user's websites array
      const userRef = doc(db, "users", user.uid);

      // Get the websites to delete
      const websitesToDelete =
        userData.websites?.filter((w) => websiteIds.includes(w.id)) || [];

      // Remove each website from the array
      for (const website of websitesToDelete) {
        await updateDoc(userRef, {
          websites: arrayRemove(website),
        });
      }

      // After deletion, close the popup and handle the downgrade
      setShowDeletionPopup(false);
      
      // Handle the downgrade as an upgrade (subscription modification)
      if (selectedPlan && targetDowngradePlan) {
        await handleUpgradeSubscription(selectedPlan, targetDowngradePlan);
      }

      toast({
        title: "Websites deleted",
        description: "You can now proceed with the downgrade.",
      });
    } catch (error) {
      console.error("Error deleting websites:", error);
      throw error;
    }
  };

  const handleUpgradeSubscription = async (planId: string, planType: string) => {
    try {
      // Get the plan details
      const plan = PLANS[planType as keyof typeof PLANS];
      if (!plan) {
        throw new Error("Invalid plan selected");
      }

      // Get the price for the selected billing interval
      const priceInfo = plan.prices[billingInterval];
      if (!priceInfo) {
        throw new Error("Price information not found");
      }

      // Call the upgrade function
      const result = await upgradeSubscription(
        priceInfo.id,
        plan.id,
        planType,
        billingInterval
      );

      if (result) {
        // Set flag for dashboard reload
        sessionStorage.setItem("webdash_just_purchased", "true");
        
        // Redirect to dashboard
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      }
    } catch (error: any) {
      toast({
        title: "Upgrade failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);

    // Set flag for dashboard reload
    sessionStorage.setItem("webdash_just_purchased", "true");

    toast({
      title:
        selectedPlan && targetDowngradePlan
          ? "Downgrade successful!"
          : "Upgrade successful!",
      description: `Your plan has been ${
        targetDowngradePlan ? "downgraded" : "upgraded"
      }. Redirecting to dashboard...`,
    });

    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {/* Wrap the component that uses useSearchParams in Suspense */}
      <Suspense fallback={<div>Loading...</div>}>
        <ClientComponent onUpgradeChange={handleUpgradeParam} />
      </Suspense>

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {isUpgrade ? "Upgrade Your Plan" : "Choose Your Plan"}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {isUpgrade
              ? "Unlock more websites and features with a higher tier plan"
              : "Start creating AI-powered websites today"}
          </p>
          {userData && (
            <p className="text-sm text-gray-500 mt-2">
              Current plan: <span className="font-medium">{currentPlan}</span> •
              Websites:{" "}
              <span className="font-medium">
                {currentWebsiteCount}/{currentWebsiteLimit}
              </span>
            </p>
          )}
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-sm p-1 inline-flex">
            <button
              onClick={() => setBillingInterval("monthly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                billingInterval === "monthly"
                  ? "bg-[#f58327] text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("annual")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                billingInterval === "annual"
                  ? "bg-[#f58327] text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Annual
              <Badge className="ml-2 bg-green-100 text-green-800">
                Save 25%
              </Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {Object.entries(PLANS).map(([key, plan]) => {
            const price = plan.prices[billingInterval];
            const isCurrentPlan = key === currentPlan;
            const planIndex = ["business", "agency", "enterprise"].indexOf(key);
            const currentPlanIndex = [
              "business",
              "agency",
              "enterprise",
            ].indexOf(currentPlan);
            const isDowngrade = planIndex < currentPlanIndex;
            const isActualUpgrade = planIndex > currentPlanIndex;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-lg shadow-lg overflow-hidden flex flex-col ${
                  plan.popular ? "ring-2 ring-[#f58327]" : ""
                } ${isCurrentPlan ? "ring-2 ring-gray-400" : ""}`}
              >
                {plan.popular && (
                  <div className="bg-[#f58327] text-white text-center py-2 text-sm font-medium">
                    Most Popular
                  </div>
                )}

                <div className="p-6 flex flex-col flex-grow">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {plan.name}
                    </h3>
                    <p className="text-gray-600 mt-2">{plan.description}</p>
                  </div>

                  <div className="mt-6">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(
                        billingInterval === "annual"
                          ? price.yearlyTotal / 12
                          : price.amount
                      )}
                    </span>
                    <span className="text-gray-500">/month</span>
                    {billingInterval === "annual" && (
                      <p className="text-sm text-gray-500 mt-1">
                        {formatPrice(price.yearlyTotal)} billed annually
                      </p>
                    )}
                  </div>

                  <div className="mt-6 mb-6">
                    <Button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={
                        isCurrentPlan || (isUpgrade && !isActualUpgrade)
                      }
                      className={`w-full cursor-pointer ${
                        isCurrentPlan
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : isUpgrade && !isActualUpgrade
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : isDowngrade
                          ? "bg-orange-500 hover:bg-orange-600 text-white"
                          : "bg-[#f58327] hover:bg-[#f58327]/90 text-white"
                      }`}
                    >
                      {isCurrentPlan
                        ? "Current Plan"
                        : isUpgrade && !isActualUpgrade
                        ? "Not Available"
                        : isDowngrade
                        ? "Downgrade"
                        : isUpgrade
                        ? "Upgrade Now"
                        : "Get Started"}
                    </Button>
                    {isDowngrade &&
                      currentWebsiteCount >
                        planLimits[key as keyof typeof planLimits] && (
                        <p className="text-xs text-orange-600 mt-2 text-center">
                          Requires deleting{" "}
                          {currentWebsiteCount -
                            planLimits[key as keyof typeof planLimits]}{" "}
                          website(s)
                        </p>
                      )}
                  </div>

                  <div className="border-t pt-6">
                    <div className="mb-4">
                      <div className="flex items-center text-sm text-gray-700 mb-2">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span className="font-medium">
                          {plan.websiteLimit} websites included
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 ml-6">
                        Additional websites:{" "}
                        {formatPrice(plan.additionalWebsitePrice)}/month each
                      </p>
                    </div>

                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-sm text-gray-700">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Back to Dashboard link */}
        <div className="text-center mt-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            ← Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <Elements stripe={stripePromise}>
            <PaymentForm
              productId={selectedPlan || ""}
              interval={billingInterval}
              customerData={{
                email: userData?.email || user?.email || "",
                name: `${userData?.firstName || ""} ${
                  userData?.lastName || ""
                }`.trim(),
              }}
              onSuccess={handlePaymentSuccess}
            />
          </Elements>
        </DialogContent>
      </Dialog>

      {/* Website Deletion Popup */}
      <WebsiteDeletionPopup
        isOpen={showDeletionPopup}
        onClose={() => setShowDeletionPopup(false)}
        websites={userData?.websites || []}
        requiredDeletions={requiredDeletions}
        targetPlan={targetDowngradePlan || ""}
        onConfirmDeletion={handleDeleteWebsites}
      />
    </div>
  );
}
