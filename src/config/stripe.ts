// src/config/stripe.ts

import { loadStripe } from "@stripe/stripe-js";
import Stripe from "stripe";

export const stripePublishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!;

// Client-side Stripe
export const getStripe = async () => {
  const stripePromise = loadStripe(stripePublishableKey);
  return stripePromise;
};

// Server-side Stripe
let stripeInstance: Stripe | null = null;

export const getServerStripe = () => {
  if (!stripeInstance && process.env.STRIPE_SECRET_KEY) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16", // Use the latest API version
    });
  }
  return stripeInstance;
};

// Export a default stripe instance for convenience
export const stripe = getServerStripe();

// Product IDs for all plans
export const PRODUCT_IDS = {
  BUSINESS: "prod_SLW6KBiglhhYlh",
  AGENCY: "prod_SLW74DJP2aPaN7",
  ENTERPRISE: "prod_SLW70YpoGn9giO",
};

// Price IDs for all plans
export const PRICE_IDS = {
  BUSINESS_MONTHLY: "price_1RQp4cBUIdTRY5XzIaoa4ooq",
  BUSINESS_ANNUAL: "price_1RQp5vBUIdTRY5Xz6iPoigCK",
  AGENCY_MONTHLY: "price_1RQp4vBUIdTRY5XzxNeR39Ys",
  AGENCY_ANNUAL: "price_1RQp6XBUIdTRY5Xz182zgj2f",
  ENTERPRISE_MONTHLY: "price_1RQp4cBUIdTRY5XzIaoa4ooq",
  ENTERPRISE_ANNUAL: "price_1RQp5vBUIdTRY5Xz6iPoigCK",
};

// Additional website price IDs - You need to create these in your Stripe dashboard
export const ADDITIONAL_WEBSITE_PRICE_IDS = {
  BUSINESS: "price_1RRRA7BUIdTRY5Xzgm97tt8m", // $18/month - Replace with actual Stripe price ID
  AGENCY: "price_1RRRAUBUIdTRY5XzJ4VsHqEy", // $15/month - Replace with actual Stripe price ID
  ENTERPRISE: "price_1RRRAuBUIdTRY5Xz2GUGjE9k", // $12/month - Replace with actual Stripe price ID
};

// Additional website pricing information
export const ADDITIONAL_WEBSITE_PRICING = {
  business: {
    priceId: ADDITIONAL_WEBSITE_PRICE_IDS.BUSINESS,
    amount: 18,
    name: "Additional Business Website",
    description: "Add one more website to your Business plan",
  },
  agency: {
    priceId: ADDITIONAL_WEBSITE_PRICE_IDS.AGENCY,
    amount: 15,
    name: "Additional Agency Website",
    description: "Add one more website to your Agency plan",
  },
  enterprise: {
    priceId: ADDITIONAL_WEBSITE_PRICE_IDS.ENTERPRISE,
    amount: 12,
    name: "Additional Enterprise Website",
    description: "Add one more website to your Enterprise plan",
  },
};

// Subscription plans with detailed information including website limits
export const PLANS = {
  business: {
    id: PRODUCT_IDS.BUSINESS,
    name: "Business",
    description: "Perfect for small businesses and individuals",
    websiteLimit: 1,
    additionalWebsitePrice: 18,
    prices: {
      monthly: {
        id: PRICE_IDS.BUSINESS_MONTHLY,
        amount: 20,
        additionalWebsitePrice: 18,
      },
      annual: {
        id: PRICE_IDS.BUSINESS_ANNUAL,
        amount: 15, // Monthly equivalent with 25% discount
        yearlyTotal: 180, // $15 * 12
        additionalWebsitePrice: 18,
      },
    },
    features: [
      "Drag & Drop Editor",
      "Generate up to 7 Pages",
      "10K Monthly Visitors",
      "Elementor AI Assistant",
      "Ecommerce Functionality",
      "Free SSL Certificate",
      "2 Site Regenerations",
      "Search Engine Optimization",
      "90+ Page Speed Score",
    ],
  },
  agency: {
    id: PRODUCT_IDS.AGENCY,
    name: "Agency",
    description: "For growing agencies and businesses",
    popular: true,
    websiteLimit: 3,
    additionalWebsitePrice: 15,
    prices: {
      monthly: {
        id: PRICE_IDS.AGENCY_MONTHLY,
        amount: 50,
        additionalWebsitePrice: 15,
      },
      annual: {
        id: PRICE_IDS.AGENCY_ANNUAL,
        amount: 37, // Monthly equivalent with 25% discount
        yearlyTotal: 444, // $37 * 12
        additionalWebsitePrice: 15,
      },
    },
    features: [
      "3 Live Websites Included",
      "Invite 3 Collaborators",
      "Unlimited AI Image Generation",
      "50K Monthly Visitors",
      "3 Workspaces",
      "10 Site Regenerations",
      "Priority Support",
    ],
  },
  enterprise: {
    id: PRODUCT_IDS.ENTERPRISE,
    name: "Enterprise",
    description: "For large organizations with multiple websites",
    websiteLimit: 5,
    additionalWebsitePrice: 12,
    prices: {
      monthly: {
        id: PRICE_IDS.ENTERPRISE_MONTHLY,
        amount: 80,
        additionalWebsitePrice: 12,
      },
      annual: {
        id: PRICE_IDS.ENTERPRISE_ANNUAL,
        amount: 60, // Monthly equivalent with 25% discount
        yearlyTotal: 720, // $60 * 12
        additionalWebsitePrice: 12,
      },
    },
    features: [
      "5 Live Websites Included",
      "Hide our branding",
      "Unlimited Collaborators",
      "100K Monthly Visitors",
      "Unlimited Workspaces",
      "30 Site Regenerations",
    ],
  },
};

// Helper function to get plan price by product ID and billing interval
export const getPlanPrice = (
  productId: string,
  interval: "monthly" | "annual"
) => {
  const plan = Object.values(PLANS).find((plan) => plan.id === productId);
  return plan ? plan.prices[interval] : null;
};

// Helper function to get plan by product ID
export const getPlanById = (productId: string) => {
  return Object.values(PLANS).find((plan) => plan.id === productId);
};

// Helper function to get additional website pricing by plan type
export const getAdditionalWebsitePricing = (planType: string) => {
  console.log("getAdditionalWebsitePricing called with planType:", planType);
  console.log(
    "Available pricing configs:",
    Object.keys(ADDITIONAL_WEBSITE_PRICING)
  );

  const pricing =
    ADDITIONAL_WEBSITE_PRICING[
      planType as keyof typeof ADDITIONAL_WEBSITE_PRICING
    ];

  if (!pricing) {
    console.error(
      `No additional website pricing found for plan type: ${planType}`
    );
    console.log("Falling back to business pricing");
    return ADDITIONAL_WEBSITE_PRICING.business;
  }

  return pricing;
};

// Helper function to determine plan type from product/price ID - IMPROVED VERSION
export const getPlanTypeFromId = (id: string): string => {
  console.log("getPlanTypeFromId called with:", id);

  // Check against known product IDs first
  if (
    id === PRODUCT_IDS.BUSINESS ||
    id.includes("business") ||
    id.includes("BUSINESS")
  ) {
    return "business";
  }
  if (
    id === PRODUCT_IDS.AGENCY ||
    id.includes("agency") ||
    id.includes("AGENCY")
  ) {
    return "agency";
  }
  if (
    id === PRODUCT_IDS.ENTERPRISE ||
    id.includes("enterprise") ||
    id.includes("ENTERPRISE")
  ) {
    return "enterprise";
  }

  // Check against known price IDs
  const businessPriceIds = [
    PRICE_IDS.BUSINESS_MONTHLY,
    PRICE_IDS.BUSINESS_ANNUAL,
  ];
  const agencyPriceIds = [PRICE_IDS.AGENCY_MONTHLY, PRICE_IDS.AGENCY_ANNUAL];
  const enterprisePriceIds = [
    PRICE_IDS.ENTERPRISE_MONTHLY,
    PRICE_IDS.ENTERPRISE_ANNUAL,
  ];

  if (businessPriceIds.includes(id)) {
    return "business";
  }
  if (agencyPriceIds.includes(id)) {
    return "agency";
  }
  if (enterprisePriceIds.includes(id)) {
    return "enterprise";
  }

  console.log("Could not determine plan type from ID, defaulting to business");
  return "business"; // Default fallback
};

// Add a new helper function to get plan type from subscription data
export const getPlanTypeFromSubscription = (subscription: any): string => {
  console.log("getPlanTypeFromSubscription called with:", subscription);

  // First, try the planType field if it exists
  if (subscription.planType) {
    return subscription.planType;
  }

  // Then try productId
  if (subscription.productId) {
    return getPlanTypeFromId(subscription.productId);
  }

  // Then try planId (which might be a price ID)
  if (subscription.planId) {
    return getPlanTypeFromId(subscription.planId);
  }

  // Finally, try subscriptionId if it contains plan info
  if (subscription.subscriptionId) {
    return getPlanTypeFromId(subscription.subscriptionId);
  }

  console.log(
    "Could not determine plan type from subscription, defaulting to business"
  );
  return "business";
};

// Add validation function for additional website pricing
export const validateAdditionalWebsitePricing = (planType: string): boolean => {
  const validPlanTypes = Object.keys(ADDITIONAL_WEBSITE_PRICING);
  return validPlanTypes.includes(planType);
};
