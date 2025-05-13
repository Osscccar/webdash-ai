// src/app/api/tenweb/visitors/[domainId]/route.ts

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

export async function GET(request: NextRequest, context: any) {
  try {
    console.log("🔍 Received 10Web visitors API request");

    // Apply rate limiting
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const isAllowed = limiter.check(`${ip}_GET`);

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded, please try again later" },
        { status: 429 }
      );
    }

    // Extract domain ID from context
    const domainId = context.params?.domainId;

    if (!domainId) {
      return NextResponse.json(
        { error: "Domain ID is required" },
        { status: 400 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";

    console.log(
      `🔍 Fetching visitor statistics for domain ID: ${domainId}, period: ${period}`
    );

    // Make the request to 10Web API using the correct endpoint
    const response = await tenwebApi.get(
      `/hosting/domains/${domainId}/visitors?period=${period}`
    );
    console.log(`✅ 10Web API visitors response:`, response.data);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(
      "❌ 10Web API Visitors Error:",
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
