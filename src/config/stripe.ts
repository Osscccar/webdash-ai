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

// Product IDs for all plans
export const PRODUCT_IDS = {
  BUSINESS: "prod_SLW6KBiglhhYlh",
  AGENCY: "prod_SLW74DJP2aPaN7",
  ENTERPRISE: "prod_SLW70YpoGn9giO",
};

// Price IDs for all plans
// Replace these with your actual Stripe price IDs
export const PRICE_IDS = {
  BUSINESS_MONTHLY: "price_1RQp4cBUIdTRY5XzIaoa4ooq",
  BUSINESS_ANNUAL: "price_1RQp5vBUIdTRY5Xz6iPoigCK",
  AGENCY_MONTHLY: "price_1RQp4vBUIdTRY5XzxNeR39Ys",
  AGENCY_ANNUAL: "price_1RQp6XBUIdTRY5Xz182zgj2f",
  ENTERPRISE_MONTHLY: "price_1RQp4cBUIdTRY5XzIaoa4ooq",
  ENTERPRISE_ANNUAL: "price_1RQp5vBUIdTRY5Xz6iPoigCK",
};

// Subscription plans with detailed information
export const PLANS = {
  business: {
    id: PRODUCT_IDS.BUSINESS,
    name: "Business",
    description: "Perfect for small businesses and individuals",
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
