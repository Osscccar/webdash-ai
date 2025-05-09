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
 * Dynamic API handler for all 10Web API endpoints
 * This handles paths like /api/tenweb/hosting/website
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
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

    // Get the path from the URL (e.g. /hosting/website)
    // Use string manipulation instead of directly accessing params.path
    // This avoids the "params should be awaited" error
    const url = request.nextUrl.pathname;
    // Extract the part after /api/tenweb/
    const path = url.replace(/^\/api\/tenweb\//, "");

    console.log(`Forwarding 10Web API request to: ${path}`);

    // Parse request body
    const body = await request.json();

    // Make the request to 10Web API
    const response = await tenwebApi.post(`/${path}`, body);

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

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
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

    // Get the path from the URL
    // Use string manipulation instead of directly accessing params.path
    const url = request.nextUrl.pathname;
    // Extract the part after /api/tenweb/
    const path = url.replace(/^\/api\/tenweb\//, "");

    const queryString = request.nextUrl.search || "";
    console.log(`Forwarding 10Web API GET request to: ${path}${queryString}`);

    // Make the request to 10Web API
    const response = await tenwebApi.get(`/${path}${queryString}`);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(
      "10Web API GET Error:",
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
