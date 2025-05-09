"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { PLANS } from "@/config/stripe";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface TrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTrial: (plan: "monthly" | "annual") => void;
  selectedPlan: "monthly" | "annual";
  setSelectedPlan: (plan: "monthly" | "annual") => void;
}

export function TrialModal({
  isOpen,
  onClose,
  onStartTrial,
  selectedPlan,
  setSelectedPlan,
}: TrialModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <div className="grid md:grid-cols-5">
          {/* Left side: Plan details */}
          <div className="md:col-span-2 bg-gray-50 p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl">Try 10Web Pro</DialogTitle>
              <DialogDescription>7 days free, cancel anytime</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex gap-4">
                <Button
                  variant={selectedPlan === "monthly" ? "default" : "outline"}
                  className={
                    selectedPlan === "monthly"
                      ? "bg-[#f58327] hover:bg-[#f58327]/90 flex-1"
                      : "flex-1"
                  }
                  onClick={() => setSelectedPlan("monthly")}
                >
                  Monthly
                  <span className="ml-1 text-xs">
                    ${PLANS.monthly.price}/mo
                  </span>
                </Button>
                <Button
                  variant={selectedPlan === "annual" ? "default" : "outline"}
                  className={
                    selectedPlan === "annual"
                      ? "bg-[#f58327] hover:bg-[#f58327]/90 flex-1"
                      : "flex-1"
                  }
                  onClick={() => setSelectedPlan("annual")}
                >
                  Annual
                  <span className="ml-1 text-xs">${PLANS.annual.price}/yr</span>
                </Button>
              </div>

              {selectedPlan === "annual" && (
                <div className="text-center text-sm bg-green-100 text-green-800 p-2 rounded">
                  Save 50% with annual billing
                </div>
              )}

              <div className="pt-4">
                <h3 className="font-medium mb-3">Included in your plan:</h3>
                <ul className="space-y-2">
                  {PLANS[selectedPlan].features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        {feature}{" "}
                        {PLANS[selectedPlan].limits &&
                          feature in PLANS[selectedPlan].limits &&
                          `(${
                            PLANS[selectedPlan].limits[
                              feature as keyof (typeof PLANS)[typeof selectedPlan]["limits"]
                            ]
                          })`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right side: Payment form */}
          <div className="md:col-span-3 p-6">
            <Elements stripe={stripePromise}>
              <PaymentForm
                onStartTrial={() => onStartTrial(selectedPlan)}
                planType={selectedPlan}
                price={PLANS[selectedPlan].price}
              />
            </Elements>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PaymentFormProps {
  onStartTrial: () => void;
  planType: "monthly" | "annual";
  price: number;
}

function PaymentForm({ onStartTrial, planType, price }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [cardError, setCardError] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [isPromoApplied, setIsPromoApplied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    setIsLoading(true);

    try {
      // In a real implementation, you would validate the card and create a customer/subscription
      // For demo purposes, we'll just call the onStartTrial callback

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      onStartTrial();

      toast({
        title: "Trial started successfully",
        description: "Your 7-day free trial has begun!",
      });
    } catch (error: any) {
      setCardError(error.message || "An error occurred");
      toast({
        title: "Error starting trial",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPromo = () => {
    if (promoCode.toLowerCase() === "welcome10") {
      setIsPromoApplied(true);
      toast({
        title: "Promo code applied",
        description: "You've received 10% off your subscription!",
      });
    } else {
      toast({
        title: "Invalid promo code",
        description: "Please enter a valid promo code",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Payment Information</h3>
        <p className="text-sm text-gray-500 mb-6">
          Your card won't be charged until your free trial ends on{" "}
          <strong>
            {new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toLocaleDateString()}
          </strong>
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="card">Card Information</Label>
          <div className="border rounded-md p-3">
            <CardElement
              id="card"
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#424770",
                    "::placeholder": {
                      color: "#aab7c4",
                    },
                  },
                  invalid: {
                    color: "#9e2146",
                  },
                },
              }}
              onChange={(e) => {
                setCardError(e.error ? e.error.message : "");
              }}
            />
          </div>
          {cardError && (
            <p className="text-sm text-red-500 mt-1">{cardError}</p>
          )}
        </div>

        <div className="flex gap-2">
          <div className="flex-grow space-y-2">
            <Label htmlFor="promo">Promo Code</Label>
            <Input
              id="promo"
              placeholder="Enter promo code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              disabled={isPromoApplied}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleApplyPromo}
              disabled={!promoCode || isPromoApplied}
              className="mb-px"
            >
              Apply
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between mb-2">
          <span>Plan Price</span>
          <span>
            {formatCurrency(price)}/{planType === "monthly" ? "month" : "year"}
          </span>
        </div>
        {isPromoApplied && (
          <div className="flex justify-between mb-2 text-green-600">
            <span>Promo (WELCOME10)</span>
            <span>-{formatCurrency(price * 0.1)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-lg">
          <span>Due today</span>
          <span>$0</span>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {isPromoApplied
            ? `Then ${formatCurrency(price * 0.9)}/${
                planType === "monthly" ? "month" : "year"
              } after trial`
            : `Then ${formatCurrency(price)}/${
                planType === "monthly" ? "month" : "year"
              } after trial`}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-[#f58327] hover:bg-[#f58327]/90 text-white"
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : "Try 10Web Pro Free for 7 Days"}
      </Button>

      <p className="text-xs text-center text-gray-500">
        By starting your free trial, you agree to our{" "}
        <a href="/terms" className="text-[#f58327] hover:underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy" className="text-[#f58327] hover:underline">
          Privacy Policy
        </a>
      </p>
    </form>
  );
}
