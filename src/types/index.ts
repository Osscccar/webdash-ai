// src/types/index.ts

// Core user type that's compatible with existing data structure
export interface UserData {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  // Previous subscription data
  hasPaid?: boolean;
  // New subscription data for AI website builder
  webdashSubscription?: SubscriptionStatus;
  websites?: UserWebsite[];
  stripeCustomerId?: string;
  // Website limit management
  websiteLimit?: number; // Number of websites user can create
  planType?: string; // Current plan type (business, agency, enterprise)
  additionalWebsiteSubscriptions?: AdditionalWebsiteSubscription[]; // Track additional website purchases
  createdAt?: string;
  updatedAt?: string;
  authProvider?: string;
}

// Additional website subscription tracking
export interface AdditionalWebsiteSubscription {
  subscriptionId: string;
  priceId: string;
  planType: string;
  amount: number;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Website generation types
export interface WebsiteGenerationParams {
  prompt: string;
  businessType: string;
  businessName: string;
  businessDescription: string;
  colors?: {
    backgroundDark?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  fonts?: {
    primaryFont?: string;
  };
  websiteTitle?: string;
  websiteDescription?: string;
  websiteKeyphrase?: string;
}

// src/types/index.ts (modification for UserWebsite)
export interface UserWebsite {
  id: string;
  userId: string; // Make sure this is required
  domainId: number;
  subdomain: string;
  siteUrl: string;
  title: string;
  description: string;
  createdAt: string;
  lastModified: string;
  status: "generating" | "active" | "error";
  generationParams?: WebsiteGenerationParams;
  unique_id?: string;
}

export interface SubscriptionStatus {
  active: boolean;
  planId?: string;
  productId?: string;
  planType?: string; // business, agency, enterprise
  trialEnd?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  customerId?: string;
  subscriptionId?: string;
  status?: string;
}

// Website generation progress
export interface GenerationProgress {
  step: number;
  totalSteps: number;
  currentStep: string;
  progress: number;
  status: "pending" | "processing" | "complete" | "error";
  message?: string;
}

export enum GenerationStep {
  CREATING_SITE = "Creating website",
  GENERATING_SITEMAP = "Generating sitemap",
  DESIGNING_PAGES = "Designing pages",
  SETTING_UP_NAVIGATION = "Setting up navigation",
  OPTIMIZING_FOR_DEVICES = "Optimizing for devices",
  BOOSTING_SPEED = "Boosting website speed",
  FINALIZING = "Finalizing layout and content",
}

// 10Web API types
export interface WebsiteCreateParams {
  subdomain: string;
  region: string;
  site_title: string;
  admin_username: string;
  admin_password: string;
}

export interface SitemapData {
  business_description: string;
  business_name: string;
  business_type: string;
  colors: {
    background_dark?: string;
    primary_color?: string;
    secondary_color?: string;
  };
  domain_id: number;
  fonts: {
    primary_font?: string;
  };
  pages_meta: PageMeta[];
  unique_id: string;
  website_description: string;
  website_keyphrase: string;
  website_title: string;
  website_type: string;
}

export interface PageMeta {
  description: string;
  sections: Section[];
  title: string;
}

export interface Section {
  section_description: string;
  section_title: string;
}

// Plan configuration interface
export interface PlanConfig {
  includedWebsites: number;
  additionalWebsitePrice: number;
  canUpgrade: boolean;
  upgradeToPlans: string[];
}

// Pricing plans
export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  websiteLimit: number;
  additionalWebsitePrice: number;
  features: string[];
  limits: {
    aiCredits: string | number;
    imageGen: string | number;
    domain: string;
    hosting: boolean;
    visitors: string | number;
    storage: string;
    editor: boolean;
    mobile: boolean;
    pageSpeed: boolean;
  };
}
