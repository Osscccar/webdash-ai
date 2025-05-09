"use client";

import { useState } from "react";
import { useAuth } from "./use-auth";
import { PLANS } from "@/config/stripe";
import { useToast } from "@/components/ui/use-toast";

export function useStripe() {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Start a subscription with a trial period
   */
  const startTrial = async (planType: "monthly" | "annual") => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to start a trial",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);

    try {
      const plan = PLANS[planType];

      // Create a checkout session
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: plan.id,
          userId: user.uid,
          email: user.email,
          name: userData?.firstName
            ? `${userData.firstName} ${userData.lastName || ""}`
            : undefined,
          returnUrl: window.location.origin + "/dashboard",
          trialPeriodDays: 7,
          metadata: {
            planType,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create checkout session");
      }

      const { sessionId, url } = await response.json();

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
        return { sessionId, url };
      } else {
        throw new Error("No redirect URL returned from Stripe");
      }
    } catch (error: any) {
      console.error("Error starting trial:", error);

      toast({
        title: "Error starting trial",
        description: error.message || "Please try again later",
        variant: "destructive",
      });

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Open the Stripe Customer Portal to manage subscription
   */
  const openCustomerPortal = async () => {
    if (!userData?.stripeCustomerId) {
      toast({
        title: "No subscription found",
        description: "You don't have an active subscription to manage",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: userData.stripeCustomerId,
          returnUrl: window.location.origin + "/dashboard",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to open customer portal");
      }

      const { url } = await response.json();

      // Redirect to Stripe Customer Portal
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No redirect URL returned from Stripe");
      }
    } catch (error: any) {
      console.error("Error opening customer portal:", error);

      toast({
        title: "Error opening portal",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check if the user has an active subscription
   */
  const hasActiveSubscription = (): boolean => {
    return !!userData?.webdashSubscription?.active;
  };

  /**
   * Check if the user is in a trial period
   */
  const isInTrialPeriod = (): boolean => {
    if (!userData?.webdashSubscription?.trialEnd) {
      return false;
    }

    const trialEnd = new Date(userData.webdashSubscription.trialEnd);
    return trialEnd > new Date();
  };

  /**
   * Get the current subscription plan
   */
  const getCurrentPlan = () => {
    if (!userData?.webdashSubscription?.active) {
      return null;
    }

    const planId = userData.webdashSubscription.planId;

    if (!planId) {
      return null;
    }

    if (planId === PLANS.monthly.id) {
      return PLANS.monthly;
    } else if (planId === PLANS.annual.id) {
      return PLANS.annual;
    }

    return null;
  };

  return {
    startTrial,
    openCustomerPortal,
    hasActiveSubscription,
    isInTrialPeriod,
    getCurrentPlan,
    isLoading,
  };
}
