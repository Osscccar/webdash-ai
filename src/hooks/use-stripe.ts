"use client";

import { useState } from "react";
import { useAuth } from "./use-auth";
import { PLANS, getPlanById } from "@/config/stripe";
import { useToast } from "@/components/ui/use-toast";

export function useStripe() {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Start a subscription
   */
  const startTrial = async (planId: string, promoCode?: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);

    try {
      const plan = getPlanById(planId);

      if (!plan) {
        throw new Error("Invalid plan selected");
      }

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
          promoCode, // Pass promo code if provided
          metadata: {
            planType: plan.interval,
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
      console.error("Error subscribing:", error);

      toast({
        title: "Error processing subscription",
        description: error.message || "Please try again later",
        variant: "destructive",
      });

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a subscription directly with payment method
   */
  const createSubscription = async (
    paymentMethodId: string,
    priceId: string
  ) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethodId,
          priceId,
          customerEmail: user.email,
          customerName: userData?.firstName
            ? `${userData.firstName} ${userData.lastName || ""}`
            : user.displayName || "",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create subscription");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Error creating subscription:", error);

      toast({
        title: "Error processing subscription",
        description: error.message || "Please try again later",
        variant: "destructive",
      });

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Validate a promotion code with Stripe
   */
  const validatePromoCode = async (promoCode: string, planId: string) => {
    if (!promoCode) return { valid: false, message: "No promo code provided" };

    try {
      const response = await fetch("/api/stripe/validate-promo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          promoCode,
          planId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to validate promo code");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Error validating promo code:", error);
      return {
        valid: false,
        message: error.message || "Failed to validate promo code",
      };
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
   * Upgrade an existing subscription
   */
  const upgradeSubscription = async (
    newPriceId: string,
    newProductId: string,
    newPlanType: string,
    interval: string
  ) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upgrade",
        variant: "destructive",
      });
      return null;
    }

    if (!userData?.webdashSubscription?.active) {
      toast({
        title: "No active subscription",
        description: "You need an active subscription to upgrade",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/stripe/upgrade-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          newPriceId,
          newProductId,
          newPlanType,
          interval,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upgrade subscription");
      }

      const result = await response.json();
      
      toast({
        title: "Subscription upgraded!",
        description: `Successfully upgraded to ${newPlanType} plan`,
      });

      return result;
    } catch (error: any) {
      console.error("Error upgrading subscription:", error);

      toast({
        title: "Error upgrading subscription",
        description: error.message || "Please try again later",
        variant: "destructive",
      });

      return null;
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

    return getPlanById(planId);
  };

  return {
    startTrial,
    createSubscription,
    upgradeSubscription,
    validatePromoCode,
    openCustomerPortal,
    hasActiveSubscription,
    getCurrentPlan,
    isLoading,
  };
}
