// src/lib/tenweb-service.ts
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

// Create a secure axios instance for 10Web API calls
const tenWebApi = axios.create({
  baseURL: "/api/tenweb",
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Website10WebParams {
  subdomain: string;
  region: string;
  siteTitle: string;
  adminUsername?: string;
  adminPassword?: string;
}

export interface AIWebsiteGenerationParams {
  domainId: number;
  businessType: string;
  businessName: string;
  businessDescription: string;
  colors: {
    primaryColor: string;
    secondaryColor: string;
    backgroundDark: string;
  };
  fonts: {
    primaryFont: string;
  };
  pagesMeta: {
    title: string;
    description: string;
    sections: {
      section_title: string;
      section_description: string;
    }[];
  }[];
  websiteTitle: string;
  websiteDescription: string;
  websiteKeyphrase: string;
  websiteType: string;
}

/**
 * Create a new 10Web website
 */
export async function createWebsite(params: Website10WebParams) {
  try {
    // Format params for the API
    const apiParams = {
      subdomain: params.subdomain,
      region: params.region,
      site_title: params.siteTitle,
      admin_username: params.adminUsername,
      admin_password: params.adminPassword,
    };

    console.log("Creating 10Web website with params:", apiParams);

    const response = await tenWebApi.post("/hosting/website", apiParams);
    console.log("Website creation response:", response.data);

    return response.data;
  } catch (error) {
    console.error("Error creating 10Web website:", error);
    throw error;
  }
}

/**
 * Generate an AI website using 10Web's AI generation API
 */
export async function generateAIWebsite(params: AIWebsiteGenerationParams) {
  try {
    // Generate a unique ID for this request
    const uniqueId = `webdash_${uuidv4()}`;

    // Format params for the API
    const apiParams = {
      domain_id: params.domainId,
      unique_id: uniqueId,
      business_type: params.businessType,
      business_name: params.businessName,
      business_description: params.businessDescription,
      colors: {
        primary_color: params.colors.primaryColor,
        secondary_color: params.colors.secondaryColor,
        background_dark: params.colors.backgroundDark,
      },
      fonts: {
        primary_font: params.fonts.primaryFont,
      },
      pages_meta: params.pagesMeta,
      website_title: params.websiteTitle,
      website_description: params.websiteDescription,
      website_keyphrase: params.websiteKeyphrase,
      website_type: params.websiteType || params.businessType,
    };

    console.log("Generating AI website with params:", apiParams);

    const response = await tenWebApi.post(
      "/ai/generate_site_from_sitemap",
      apiParams
    );
    console.log("AI website generation response:", response.data);

    return response.data;
  } catch (error) {
    console.error("Error generating AI website:", error);
    throw error;
  }
}
