// src/app/api/tenweb/analytics/route.ts

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

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    console.log("🔍 Received 10Web analytics API request");

    // Apply rate limiting
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const isAllowed = limiter.check(`${ip}_GET`);

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded, please try again later" },
        { status: 429 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get("domain_id");
    const period = searchParams.get("period") || "month";

    if (!domainId) {
      return NextResponse.json(
        { error: "domain_id is required" },
        { status: 400 }
      );
    }

    console.log(
      `🔍 Fetching analytics for domain ID: ${domainId}, period: ${period}`
    );

    // Make the request to 10Web API
    const response = await tenwebApi.get(
      `/hosting/website/${domainId}/statistics?period=${period}`
    );
    console.log(`✅ 10Web API analytics response:`, response.data);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(
      "❌ 10Web API Analytics Error:",
      error?.response?.data || error?.message || error
    );

    // Enhanced error logging
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
