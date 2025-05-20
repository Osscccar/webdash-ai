// src/components/preview/payment-card.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStripe } from "@/hooks/use-stripe";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { PrimaryButton } from "@/components/ui/custom-button";
import { PLANS } from "@/config/stripe";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { PaymentForm } from "@/components/payment/payment-form";

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
}: PaymentCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, userData } = useAuth();
  const { startTrial, isLoading } = useStripe();

  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<
    "monthly" | "annual"
  >("monthly");
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const handleContinue = (productId: string) => {
    setSelectedPlan(productId);
    setSelectedInterval(isAnnual ? "annual" : "monthly");
    setShowPaymentForm(true);
  };

  const handleBackToPlans = () => {
    setSelectedPlan(null);
    setShowPaymentForm(false);
  };

  const handlePaymentSuccess = async (productId: string) => {
    try {
      onStartTrial(productId);
      toast({
        title: "Subscription started!",
        description: "Your subscription has been activated successfully.",
      });
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Error starting subscription:", error);
      toast({
        title: "Error",
        description: "There was a problem starting your subscription.",
        variant: "destructive",
      });
    }
  };

  const renderFeature = (text: string) => (
    <div className="flex items-start space-x-2">
      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-white">
        {!showPaymentForm ? (
          <div className="flex flex-col">
            {/* Header with pricing toggle */}
            <div className="text-center p-4 border-b">
              <h2 className="text-xl font-semibold mb-1">Choose Your Plan</h2>

              <div className="flex justify-center items-center mt-3 mb-1 space-x-4">
                <button
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    !isAnnual
                      ? "bg-[#f58327] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setIsAnnual(false)}
                >
                  Monthly
                </button>

                <button
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    isAnnual
                      ? "bg-[#f58327] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setIsAnnual(true)}
                >
                  Annually
                </button>
              </div>
            </div>

            {/* Pricing Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
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
                    className="w-full mb-3 py-1.5 h-auto text-sm"
                    onClick={() => handleContinue(PLANS.business.id)}
                  >
                    Continue
                  </PrimaryButton>

                  <div className="space-y-2 text-sm">
                    {renderFeature("1 Live Website included")}
                    {renderFeature("Drag & Drop Editor")}
                    {renderFeature("Generate up to 7 Pages")}
                    {renderFeature("10K Monthly Visitors")}
                    {renderFeature("Elementor AI Assistant")}
                    {renderFeature("Ecommerce Functionality")}
                    {renderFeature("Free SSL Certificate")}
                    {renderFeature("2 Site Regenerations")}
                    {renderFeature("Search Engine Optimization")}
                    {renderFeature("90+ Page Speed Score")}
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
                    className="w-full mb-3 py-1.5 h-auto text-sm"
                    onClick={() => handleContinue(PLANS.agency.id)}
                  >
                    Continue
                  </PrimaryButton>

                  <div className="text-xs font-medium mb-2 text-gray-700">
                    everything in Business and:
                  </div>
                  <div className="space-y-2 text-sm">
                    {renderFeature("3 Live Websites Included")}
                    {renderFeature("Invite 3 Collaborators")}
                    {renderFeature("Unlimited AI Image Generation")}
                    {renderFeature("50K Monthly Visitors")}
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
                    className="w-full mb-3 py-1.5 h-auto text-sm"
                    onClick={() => handleContinue(PLANS.enterprise.id)}
                  >
                    Continue
                  </PrimaryButton>

                  <div className="text-xs font-medium mb-2 text-gray-700">
                    everything in Agency and:
                  </div>
                  <div className="space-y-2 text-sm">
                    {renderFeature("5 Live Websites Included")}
                    {renderFeature("Hide our branding")}
                    {renderFeature("Unlimited Collaborators")}
                    {renderFeature("100K Monthly Visitors")}
                    {renderFeature("Unlimited Workspaces")}
                    {renderFeature("30 Site Regenerations")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Elements stripe={stripePromise}>
            <div className="p-6">
              <button
                onClick={handleBackToPlans}
                className="text-[#f58327] hover:underline mb-4 flex items-center"
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
      </DialogContent>
    </Dialog>
  );
}
