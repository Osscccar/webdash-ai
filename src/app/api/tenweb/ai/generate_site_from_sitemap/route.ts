// src/app/api/tenweb/ai/generate_site_from_sitemap/route.ts

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// 10Web API configuration
const TENWEB_API_KEY = process.env.TENWEB_API_KEY;
const TENWEB_API_BASE_URL = "https://api.10web.io";

// Flag to prevent duplicate website creation
let isCreatingWebsite = false;

export async function POST(request: NextRequest) {
  if (!TENWEB_API_KEY) {
    return NextResponse.json(
      { error: "TENWEB_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    // Check if a website creation is already in progress
    if (isCreatingWebsite) {
      console.log(
        "Website creation already in progress, skipping duplicate request"
      );
      return NextResponse.json({
        status: "ok",
        data: {
          domain_id: Date.now(), // Fake domain ID
          message: "Skipped duplicate request",
        },
      });
    }

    // Set the flag to prevent duplicate creations
    isCreatingWebsite = true;

    // Set a timeout to release the lock after 30 seconds in case of errors
    const timeoutId = setTimeout(() => {
      isCreatingWebsite = false;
    }, 30000);

    // Parse request body
    const body = await request.json();

    console.log("Generating AI website with params:", body);

    // First, we need to create the website
    const createWebsiteParams = {
      subdomain: body.subdomain,
      region: "us-central1-c", // Default region
      site_title: body.website_title || body.business_name,
      admin_username: `admin_${body.subdomain}`,
      admin_password: "Password1Ab", // Strong password that meets requirements
    };

    console.log("Step 1: Creating website with params:", createWebsiteParams);

    try {
      // Create website first
      const createResponse = await axios.post(
        `${TENWEB_API_BASE_URL}/hosting/website`,
        createWebsiteParams,
        {
          headers: {
            "x-api-key": TENWEB_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Website creation response:", createResponse.data);

      if (
        !createResponse.data ||
        !createResponse.data.data ||
        !createResponse.data.data.domain_id
      ) {
        throw new Error("Failed to create website");
      }

      const domainId = createResponse.data.data.domain_id;

      // STEP 2: Generate a sitemap first to get a unique_id
      const sitemapParams = {
        domain_id: domainId,
        params: {
          business_type: body.business_type,
          business_name: body.business_name,
          business_description: body.business_description,
        },
      };

      console.log("Step 2: Generating sitemap with params:", sitemapParams);

      const sitemapResponse = await axios.post(
        `${TENWEB_API_BASE_URL}/ai/generate_sitemap`,
        sitemapParams,
        {
          headers: {
            "x-api-key": TENWEB_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Sitemap response:", sitemapResponse.data);

      const unique_id = sitemapResponse.data.data.unique_id;

      // STEP 3: Now properly structure the params for generate_site_from_sitemap
      const aiGenerationParams = {
        domain_id: domainId,
        unique_id: unique_id,
        params: {
          business_type: body.business_type,
          business_name: body.business_name,
          business_description: body.business_description,
          colors: body.colors,
          fonts: body.fonts,
          pages_meta: body.pages_meta,
          website_title: body.website_title,
          website_description: body.website_description,
          website_keyphrase: body.website_keyphrase,
          website_type: body.business_type || "agency", // Use business_type as website_type
        },
      };

      console.log(
        "Step 3: Generating AI site with params:",
        aiGenerationParams
      );

      // Generate AI content for the website
      const generateResponse = await axios.post(
        `${TENWEB_API_BASE_URL}/ai/generate_site_from_sitemap`,
        aiGenerationParams,
        {
          headers: {
            "x-api-key": TENWEB_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("AI generation response:", generateResponse.data);

      // Clear the timeout as we're finishing successfully
      clearTimeout(timeoutId);

      // Reset the creating website flag
      isCreatingWebsite = false;

      // Return combined response with the domain_id
      return NextResponse.json({
        status: "ok",
        data: {
          domain_id: domainId,
          url: `https://${createWebsiteParams.subdomain}.webdash.site`,
          ...generateResponse.data?.data,
        },
      });
    } catch (error) {
      // Reset the creating website flag on error
      isCreatingWebsite = false;
      clearTimeout(timeoutId);
      throw error; // Re-throw to be caught by the outer catch block
    }
  } catch (error: any) {
    console.error("10Web API Error:", error.response?.data || error.message);

    // Reset the flag to allow future attempts
    isCreatingWebsite = false;

    // No retry - just return the error
    return NextResponse.json(
      {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to generate AI website",
        details: error.response?.data || {},
      },
      { status: error.response?.status || 500 }
    );
  }
}
