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
    price: 10,
    interval: "month",
    features: [
      "AI Copilot credits",
      "Image generation",
      "Free custom domain",
      "10Web Premium Hosting",
      "Website visitors",
      "SSD storage",
      "Website Editor / AI Copilot",
      "Mobile optimized",
      "90+ PageSpeed score",
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
    price: 60, // 50% off ($120/year = $10/month)
    interval: "year",
    features: [
      "AI Copilot credits",
      "Image generation",
      "Free custom domain",
      "10Web Premium Hosting",
      "Website visitors",
      "SSD storage",
      "Website Editor / AI Copilot",
      "Mobile optimized",
      "90+ PageSpeed score",
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
