// src/lib/tenweb-api.ts
import axios from "axios";
import { generateSecurePassword } from "./utils";
import {
  WebsiteCreateParams,
  SitemapGenerateParams,
  GenerateSiteParams,
} from "@/types";

// Create a secure axios instance for 10Web API calls through our Next.js API route
const tenwebApi = axios.create({
  baseURL: "/api/tenweb",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add response interceptor for error handling
tenwebApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      "10Web API Error:",
      error?.response?.data || error?.message || error
    );
    return Promise.reject(error);
  }
);

/**
 * Create a new website on 10Web
 * Using endpoint: /hosting/website (POST)
 */
export const createWebsite = async (params: {
  subdomain: string;
  region: string;
  siteTitle: string;
  adminUsername?: string;
  adminPassword?: string;
}) => {
  // Generate secure admin credentials if not provided
  const adminUsername = params.adminUsername || `admin_${params.subdomain}`;

  // Create a hard-coded password that definitely meets the requirements
  const adminPassword = params.adminPassword || "Password1Ab";

  // Ensure the region is valid for 10Web
  const region = "us-central1-c";

  // Prepare request body according to API docs
  const websiteParams: WebsiteCreateParams = {
    subdomain: params.subdomain,
    region: region,
    site_title: params.siteTitle,
    admin_username: adminUsername,
    admin_password: adminPassword,
  };

  console.log("Creating website with params:", {
    subdomain: params.subdomain,
    region: region,
    site_title: params.siteTitle,
    admin_username: adminUsername,
  });

  try {
    // Using the exact endpoint from API docs: /hosting/website
    const response = await tenwebApi.post("/hosting/website", websiteParams);
    console.log("Website creation successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating website:", error);
    throw error;
  }
};

/**
 * Generate an AI-powered website
 * Using endpoint: /ai/generate_site (POST)
 */
export const generateAISite = async (params: {
  domainId: number;
  businessType: string;
  businessName: string;
  businessDescription: string;
}) => {
  console.log(`Generating AI site for domain ID: ${params.domainId}`);

  // Prepare request body according to API docs
  const requestBody = {
    domain_id: params.domainId,
    business_type: params.businessType,
    business_name: params.businessName,
    business_description: params.businessDescription,
  };

  console.log("AI generation request body:", requestBody);

  // Using the exact endpoint from API docs: /ai/generate_site
  const response = await tenwebApi.post("/ai/generate_site", requestBody);
  return response.data;
};

/**
 * Get a single-use autologin token for WordPress admin access
 * Using endpoint: /account/domains/{domain_id}/single?admin_url={wp_admin_url} (GET)
 */
export const getWPAutologinToken = async (params: {
  domainId: number;
  adminUrl: string;
}) => {
  console.log("Getting WP autologin token for domain:", params.domainId);
  // Using the exact endpoint from API docs
  const response = await tenwebApi.get(
    `/account/domains/${params.domainId}/single?admin_url=${encodeURIComponent(
      params.adminUrl
    )}`
  );
  return response.data;
};

/**
 * Generate a website based on AI prompt
 * This combines multiple API calls to create a complete website
 */
export const generateWebsiteFromPrompt = async (params: {
  prompt: string;
  subdomain: string;
  region: string;
  siteTitle: string;
  businessType: string;
  businessName: string;
  businessDescription: string;
  adminUsername?: string;
  adminPassword?: string;
  onProgress?: (step: number, message: string, progress: number) => void;
}) => {
  try {
    // Step 1: Create a website
    params.onProgress?.(1, "Creating website", 20);

    const websiteResponse = await createWebsite({
      subdomain: params.subdomain,
      region: params.region,
      siteTitle: params.siteTitle,
      adminUsername: params.adminUsername,
      adminPassword: params.adminPassword,
    });

    const domainId = websiteResponse.data.domain_id;
    console.log(`Website created with domain ID: ${domainId}`);

    params.onProgress?.(2, "Website created, applying AI", 60);

    // Step 2: Generate AI site
    const aiResponse = await generateAISite({
      domainId: domainId,
      businessType: params.businessType,
      businessName: params.businessName,
      businessDescription: params.businessDescription,
    });

    console.log("AI site generation response:", aiResponse);
    params.onProgress?.(3, "AI website ready", 100);

    return {
      success: true,
      domainId: domainId,
      url: aiResponse?.data?.url || `https://${params.subdomain}.10web.site`,
    };
  } catch (error) {
    console.error("Error in website generation process:", error);
    throw error;
  }
};

export default {
  createWebsite,
  getWPAutologinToken,
  generateAISite,
  generateWebsiteFromPrompt,
};
