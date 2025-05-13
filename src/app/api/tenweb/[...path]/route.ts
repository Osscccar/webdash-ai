// src/app/api/tenweb/[...path]/route.ts

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { rateLimit } from "@/lib/rate-limit";

// Create a rate limiter instance
const limiter = rateLimit({
  intervalInMs: 60000, // 1 minute
  maxRequests: 100, // 100 requests per minute
});

// 10Web API configuration
const TENWEB_API_KEY = process.env.TENWEB_API_KEY;
const TENWEB_API_BASE_URL = "https://api.10web.io";

// Create a secure axios instance for 10Web API calls
const tenwebApi = axios.create({
  baseURL: TENWEB_API_BASE_URL,
  headers: {
    "x-api-key": TENWEB_API_KEY,
    "Content-Type": "application/json",
  },
});

// Set a global flag to track if a website creation is in progress
let isWebsiteCreationInProgress = false;
// Set a timeout to reset the flag after 5 minutes (in case something goes wrong)
setInterval(() => {
  isWebsiteCreationInProgress = false;
}, 300000);

/**
 * Dynamic API handler for all 10Web API endpoints
 * This handles paths like /api/tenweb/hosting/website
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    console.log("🔍 Received 10Web API request");

    // Apply rate limiting
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const isAllowed = limiter.check(`${ip}_POST`);

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded, please try again later" },
        { status: 429 }
      );
    }

    // Get the path from the URL (e.g. /hosting/website)
    // Use string manipulation instead of directly accessing params.path
    // This avoids the "params should be awaited" error
    const url = request.nextUrl.pathname;
    // Extract the part after /api/tenweb/
    const path = url.replace(/^\/api\/tenweb\//, "");

    console.log(`🔍 Forwarding 10Web API request to path: ${path}`);

    // Parse request body
    const body = await request.json();
    console.log("🔍 Request body:", body);

    // Check if this is a website creation request
    if (path === "hosting/website") {
      // If we're already creating a website, don't create another one
      if (isWebsiteCreationInProgress) {
        console.log(
          "⚠️ Website creation already in progress, skipping duplicate request"
        );
        return NextResponse.json({
          status: "ok",
          data: {
            domain_id: Date.now(), // Return a fake domain ID
            message: "Skipped duplicate website creation",
          },
        });
      }

      // Set the flag to prevent duplicate creations
      isWebsiteCreationInProgress = true;

      // Reset the flag after 30 seconds
      setTimeout(() => {
        isWebsiteCreationInProgress = false;
      }, 30000);
    }

    // Make the request to 10Web API
    console.log(
      `🔍 Making request to 10Web API: ${TENWEB_API_BASE_URL}/${path}`
    );
    const response = await tenwebApi.post(`/${path}`, body);
    console.log(`✅ 10Web API response for ${path}:`, response.data);

    // If this was a website creation, reset the flag immediately
    if (path === "hosting/website") {
      isWebsiteCreationInProgress = false;
    }

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(
      "❌ 10Web API Error:",
      error?.response?.data || error?.message || error
    );

    // Enhanced error logging
    if (error.response) {
      console.error("❌ Error Response Data:", error.response.data);
      console.error("❌ Error Response Status:", error.response.status);
      console.error("❌ Error Response Headers:", error.response.headers);
    } else if (error.request) {
      console.error("❌ Error Request:", error.request);
    } else {
      console.error("❌ Error Message:", error.message);
    }
    console.error("❌ Error Config:", error.config);

    // Reset the website creation flag if there was an error
    isWebsiteCreationInProgress = false;

    return NextResponse.json(
      {
        error:
          error?.response?.data?.message ||
          error?.message ||
          "Something went wrong",
        status: error?.response?.status || 500,
        details: error?.response?.data || {},
      },
      { status: error?.response?.status || 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: NextApiRequestContext
) {
  try {
    const { params } = context;

    // Apply rate limiting
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const isAllowed = limiter.check(`${ip}_GET`);

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded, please try again later" },
        { status: 429 }
      );
    }

    const url = request.nextUrl.pathname;
    const path = url.replace(/^\/api\/tenweb\//, "");
    const queryString = request.nextUrl.search || "";

    console.log(
      `🔍 Forwarding 10Web API GET request to: ${path}${queryString}`
    );

    const response = await tenwebApi.get(`/${path}${queryString}`);
    console.log(`✅ 10Web API GET response for ${path}:`, response.data);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(
      "❌ 10Web API GET Error:",
      error?.response?.data || error?.message || error
    );

    if (error.response) {
      console.error("❌ Error Response Data:", error.response.data);
      console.error("❌ Error Response Status:", error.response.status);
      console.error("❌ Error Response Headers:", error.response.headers);
    }

    return NextResponse.json(
      {
        error:
          error?.response?.data?.message ||
          error?.message ||
          "Something went wrong",
        status: error?.response?.status || 500,
        details: error?.response?.data || {},
      },
      { status: error?.response?.status || 500 }
    );
  }
}
