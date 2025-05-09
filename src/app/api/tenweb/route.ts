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

/**
 * Generic API handler for 10Web API endpoints
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const isAllowed = limiter.check(`${ip}_POST`);

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded, please try again later" },
        { status: 429 }
      );
    }

    // Extract endpoint from URL
    const url = new URL(request.url);
    const endpoint = url.pathname.replace("/api/tenweb", "");

    // Validate the request
    const body = await request.json();

    // Make the request to 10Web API
    const response = await tenwebApi.post(endpoint, body);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(
      "10Web API Error:",
      error?.response?.data || error?.message || error
    );

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

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const isAllowed = limiter.check(`${ip}_GET`);

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded, please try again later" },
        { status: 429 }
      );
    }

    // Extract endpoint from URL
    const url = new URL(request.url);
    const endpoint = url.pathname.replace("/api/tenweb", "");

    // Make the request to 10Web API
    const response = await tenwebApi.get(endpoint + url.search);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(
      "10Web API Error:",
      error?.response?.data || error?.message || error
    );

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
