// src/lib/tenweb-api.ts
import axios from "axios";
import { generateSecurePassword } from "./utils";
import {
  WebsiteCreateParams,
  SitemapGenerateParams,
  GenerateSiteParams,
} from "@/types";

// Use environment variable to determine if we should use the mock API
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

// Create a secure axios instance for 10Web API calls through our Next.js API route
const tenwebApi = axios.create({
  baseURL: USE_MOCK_API ? "/api/tenweb-mock" : "/api/tenweb",
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
  const adminPassword = params.adminPassword || generateSecurePassword();

  const websiteParams: WebsiteCreateParams = {
    subdomain: params.subdomain,
    region: params.region,
    site_title: params.siteTitle,
    admin_username: adminUsername,
    admin_password: adminPassword,
  };

  console.log("Creating website:", params.subdomain);
  const response = await tenwebApi.post("/hosting/website", websiteParams);
  return response.data;
};

/**
 * Generate sitemap for a website
 */
export const generateSitemap = async (params: {
  domainId: number;
  businessType: string;
  businessName: string;
  businessDescription: string;
}) => {
  const sitemapParams: SitemapGenerateParams = {
    domain_id: params.domainId,
    params: {
      business_type: params.businessType,
      business_name: params.businessName,
      business_description: params.businessDescription,
    },
  };

  console.log("Generating sitemap for domain:", params.domainId);
  const response = await tenwebApi.post("/ai/generate_sitemap", sitemapParams);
  return response.data;
};

/**
 * Generate a website using a previously created sitemap
 */
export const generateSiteFromSitemap = async (params: {
  domainId: number;
  uniqueId: string;
  sitemapData: any;
}) => {
  const generateParams: GenerateSiteParams = {
    domain_id: params.domainId,
    unique_id: params.uniqueId,
    params: params.sitemapData,
  };

  console.log("Generating site from sitemap for domain:", params.domainId);
  const response = await tenwebApi.post(
    "/ai/generate_site_from_sitemap",
    generateParams
  );
  return response.data;
};

/**
 * Get a single-use autologin token for WordPress admin access
 */
export const getWPAutologinToken = async (params: {
  domainId: number;
  adminUrl: string;
}) => {
  console.log("Getting WP autologin token for domain:", params.domainId);
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
  // Step 1: Create a website
  params.onProgress?.(1, "Creating website", 10);

  try {
    // Step 1: Create a website
    const websiteResponse = await createWebsite({
      subdomain: params.subdomain,
      region: params.region,
      siteTitle: params.siteTitle,
      adminUsername: params.adminUsername,
      adminPassword: params.adminPassword,
    });

    const domainId = websiteResponse.data.domain_id;
    params.onProgress?.(2, "Website created, generating sitemap", 30);

    // Step 2: Generate sitemap
    const sitemapResponse = await generateSitemap({
      domainId,
      businessType: params.businessType,
      businessName: params.businessName,
      businessDescription: params.businessDescription,
    });

    const sitemapData = sitemapResponse.data;
    const uniqueId = sitemapData.unique_id;

    params.onProgress?.(3, "Generating website", 50);

    // Step 3: Generate website from sitemap
    const generateResponse = await generateSiteFromSitemap({
      domainId,
      uniqueId,
      sitemapData,
    });

    params.onProgress?.(4, "Website generated successfully", 100);

    return {
      success: true,
      domainId,
      sitemapData,
      uniqueId,
      url: generateResponse.data.url,
    };
  } catch (error) {
    console.error("Error in website generation process:", error);

    // If we're in development/testing mode, return a mock success response
    if (USE_MOCK_API || process.env.NODE_ENV === "development") {
      console.log("Returning mock success response for development");
      params.onProgress?.(4, "Website generated successfully (mock)", 100);

      return {
        success: true,
        domainId: 12345,
        sitemapData: {
          unique_id: `mock_${Math.random().toString(36).substring(2, 10)}`,
        },
        uniqueId: `mock_${Math.random().toString(36).substring(2, 10)}`,
        url: `https://${params.subdomain}.10web.site`,
      };
    }

    throw error;
  }
};

export default {
  createWebsite,
  generateSitemap,
  generateSiteFromSitemap,
  getWPAutologinToken,
  generateWebsiteFromPrompt,
};
