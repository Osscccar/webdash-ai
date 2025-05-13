// src/app/api/tenweb/ai/generate_site_from_sitemap/route.ts

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// 10Web API configuration
const TENWEB_API_KEY = process.env.TENWEB_API_KEY;
const TENWEB_API_BASE_URL = "https://api.10web.io";

// Flag to prevent duplicate website creation
let pendingRequests = new Map();

export async function POST(request: NextRequest) {
  if (!TENWEB_API_KEY) {
    return NextResponse.json(
      { error: "TENWEB_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    // Parse request body
    const body = await request.json();
    const requestId = body.unique_id || `request-${Date.now()}`;

    // Check if this request is already in progress
    if (pendingRequests.has(requestId)) {
      console.log(
        "Website generation already in progress for this request, skipping duplicate"
      );
      return NextResponse.json({
        status: "ok",
        data: {
          domain_id: pendingRequests.get(requestId),
          message: "Website generation in progress",
        },
      });
    }

    console.log("Starting website generation with params:", body);

    // Step 1: Create the website
    try {
      console.log("Step 1: Creating website with subdomain:", body.subdomain);

      const createResponse = await axios.post(
        `${TENWEB_API_BASE_URL}/hosting/website`,
        {
          subdomain: body.subdomain,
          region: "us-central1-c", // Default region
          site_title: body.website_title || body.business_name || "New Website",
          admin_username: `admin_${body.subdomain}`,
          admin_password: "Password1Ab", // Strong password that meets requirements
        },
        {
          headers: {
            "x-api-key": TENWEB_API_KEY,
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30-second timeout
        }
      );

      console.log("Website creation response:", createResponse.data);

      if (
        !createResponse.data ||
        !createResponse.data.data ||
        !createResponse.data.data.domain_id
      ) {
        throw new Error(
          "Failed to create website - missing domain_id in response"
        );
      }

      const domainId = createResponse.data.data.domain_id;

      // Store in pending requests map
      pendingRequests.set(requestId, domainId);

      // Set a timeout to remove from pending requests after 5 minutes
      setTimeout(() => {
        pendingRequests.delete(requestId);
      }, 5 * 60 * 1000);

      // Step 2: Generate a sitemap first to get a unique_id
      console.log("Step 2: Generating sitemap for domain ID:", domainId);

      const sitemapParams = {
        domain_id: domainId,
        params: {
          business_type: body.business_type || "agency",
          business_name: body.business_name || "My Business",
          business_description:
            body.business_description || "A professional website",
        },
      };

      const sitemapResponse = await axios.post(
        `${TENWEB_API_BASE_URL}/ai/generate_sitemap`,
        sitemapParams,
        {
          headers: {
            "x-api-key": TENWEB_API_KEY,
            "Content-Type": "application/json",
          },
          timeout: 60000, // 60-second timeout
        }
      );

      console.log("Sitemap generation response:", sitemapResponse.data);

      if (!sitemapResponse.data?.data?.unique_id) {
        throw new Error(
          "Failed to generate sitemap - missing unique_id in response"
        );
      }

      const unique_id = sitemapResponse.data.data.unique_id;

      // Step 3: Generate site from sitemap
      console.log(
        "Step 3: Generating site from sitemap for domain ID:",
        domainId
      );

      const generateParams = {
        domain_id: domainId,
        unique_id: unique_id,
        params: {
          business_type: body.business_type || "agency",
          business_name: body.business_name || "My Business",
          business_description:
            body.business_description || "A professional website",
          colors: body.colors || {
            primary_color: "#f58327",
            secondary_color: "#4a5568",
            background_dark: "#212121",
          },
          fonts: body.fonts || {
            primary_font: "Montserrat",
          },
          pages_meta: body.pages_meta || [],
          website_title:
            body.website_title || body.business_name || "My Website",
          website_description:
            body.website_description ||
            body.business_description ||
            "A professional website",
          website_keyphrase:
            body.website_keyphrase ||
            body.business_name?.toLowerCase() ||
            "website",
          website_type: body.website_type || body.business_type || "agency",
        },
      };

      const generateResponse = await axios.post(
        `${TENWEB_API_BASE_URL}/ai/generate_site_from_sitemap`,
        generateParams,
        {
          headers: {
            "x-api-key": TENWEB_API_KEY,
            "Content-Type": "application/json",
          },
          timeout: 120000, // 120-second timeout for this potentially long operation
        }
      );

      console.log("AI site generation response:", generateResponse.data);

      // Remove from pending requests map
      pendingRequests.delete(requestId);

      // Return successful response
      return NextResponse.json({
        status: "ok",
        data: {
          domain_id: domainId,
          url: `https://${body.subdomain}.webdash.site`,
          ...generateResponse.data?.data,
        },
      });
    } catch (error: any) {
      // If an error occurred during website creation, remove from pending requests
      pendingRequests.delete(requestId);
      throw error; // Re-throw the error for the outer catch block
    }
  } catch (error: any) {
    console.error("10Web API Error:", error.message);

    let errorMessage = "An error occurred during website generation";
    let errorDetails = {};

    // Extract useful error info if available
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);

      errorMessage =
        error.response.data?.message ||
        error.response.data?.error ||
        errorMessage;
      errorDetails = error.response.data || {};
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        message: error.message,
      },
      { status: 500 }
    );
  }
}
