// src/app/api/tenweb/ai/generate_site_from_sitemap/route.ts

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// 10Web API configuration
const TENWEB_API_KEY = process.env.TENWEB_API_KEY;
const TENWEB_API_BASE_URL = "https://api.10web.io"; // Corrected base URL

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

    // Create website first
    console.log("Creating website with params:", {
      subdomain: body.subdomain,
      region: "us-central1-c",
      site_title: body.website_title || body.business_name,
      admin_username: `admin_${body.subdomain}`,
      admin_password: "Password1Ab", // Secure default password
    });

    const createResponse = await axios.post(
      `${TENWEB_API_BASE_URL}/hosting/website`,
      {
        subdomain: body.subdomain,
        region: "us-central1-c", // Default region
        site_title: body.website_title || body.business_name,
        admin_username: `admin_${body.subdomain}`,
        admin_password: "Password1Ab", // Strong password that meets requirements
      },
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
    console.log("Generating sitemap with params:", {
      domain_id: domainId,
      business_type: body.business_type,
      business_name: body.business_name,
      business_description: body.business_description,
    });

    const sitemapResponse = await axios.post(
      `${TENWEB_API_BASE_URL}/ai/generate_sitemap`,
      {
        domain_id: domainId,
        params: {
          business_type: body.business_type,
          business_name: body.business_name,
          business_description: body.business_description,
        },
      },
      {
        headers: {
          "x-api-key": TENWEB_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Sitemap response:", sitemapResponse.data);

    const unique_id = sitemapResponse.data.data.unique_id;

    // Format website title and description from provided values or use defaults
    const websiteTitle =
      body.website_title || `${body.business_name} - Official Website`;
    const websiteDescription =
      body.website_description || body.business_description;
    const websiteKeyphrase =
      body.website_keyphrase || body.business_name.toLowerCase();

    // STEP 3: Generate site from sitemap
    console.log("Generating site from sitemap with params:", {
      domain_id: domainId,
      unique_id: unique_id,
      // Include other relevant params...
    });

    const generateResponse = await axios.post(
      `${TENWEB_API_BASE_URL}/ai/generate_site_from_sitemap`,
      {
        domain_id: domainId,
        unique_id: unique_id,
        params: {
          business_type: body.business_type,
          business_name: body.business_name,
          business_description: body.business_description,
          colors: body.colors || {
            primary_color: "#f58327",
            secondary_color: "#4a5568",
            background_dark: "#212121",
          },
          fonts: body.fonts || {
            primary_font: "Montserrat",
          },
          pages_meta: body.pages_meta || [],
          website_title: websiteTitle,
          website_description: websiteDescription,
          website_keyphrase: websiteKeyphrase,
          website_type: body.business_type || "agency",
        },
      },
      {
        headers: {
          "x-api-key": TENWEB_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 60000, // Increase timeout to 60 seconds
      }
    );

    console.log("Site generation response:", generateResponse.data);

    // Return combined response
    return NextResponse.json({
      status: "ok",
      data: {
        domain_id: domainId,
        url: `https://${body.subdomain}.webdash.site`,
        ...generateResponse.data?.data,
      },
    });
  } catch (error: any) {
    console.error("10Web API Error:", error.response?.data || error.message);

    // Return detailed error response
    return NextResponse.json(
      {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to generate AI website",
        details: error.response?.data || {},
        stack: error.stack,
      },
      { status: error.response?.status || 500 }
    );
  }
}
