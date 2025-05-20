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

// Price IDs
export const MONTHLY_PRICE_ID = "price_monthly"; // Replace with actual Stripe price ID
export const ANNUAL_PRICE_ID = "price_annual"; // Replace with actual Stripe price ID

// Subscription plans
export const PLANS = {
  monthly: {
    id: MONTHLY_PRICE_ID,
    name: "10Web Pro",
    price: 20,
    interval: "month",
    features: [
      "1 Live Website Included",
      "Drag & Drop Editior",
      "Generate up to 7 Pages",
      "10K Monthly Visitors",
      "Elementor AI Assistant",
      "Ecommerce Functionality",
      "Free SSL Certificate",
      "2 Site Regenerations",
      "Search Engine Optimization",
      "90+ Page Speed Score",
    ],
    limits: {
      aiCredits: "Unlimited",
      imageGen: "Unlimited",
      domain: "1 year",
      hosting: true,
      visitors: "10K",
      storage: "10GB",
      editor: true,
      mobile: true,
      pageSpeed: true,
    },
  },
  annual: {
    id: ANNUAL_PRICE_ID,
    name: "10Web Pro Annual",
    price: 180, // 50% off ($120/year = $10/month)
    interval: "year",
    features: [
      "1 Live Website Included",
      "Drag & Drop Editior",
      "Generate up to 7 Pages",
      "10K Monthly Visitors",
      "Elementor AI Assistant",
      "Ecommerce Functionality",
      "Free SSL Certificate",
      "2 Site Regenerations",
      "Search Engine Optimization",
      "90+ Page Speed Score",
    ],
    limits: {
      aiCredits: "Unlimited",
      imageGen: "Unlimited",
      domain: "1 year",
      hosting: true,
      visitors: "10K",
      storage: "10GB",
      editor: true,
      mobile: true,
      pageSpeed: true,
    },
  },
};
