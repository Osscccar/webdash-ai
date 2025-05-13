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

// Set a timeout to reset the flag after 5 minutes
setInterval(() => {
  isWebsiteCreationInProgress = false;
}, 300000);

// POST handler
export async function POST(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  try {
    console.log("🔍 Received 10Web API POST request");

    // Apply rate limiting
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const isAllowed = limiter.check(`${ip}_POST`);
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded, please try again later" },
        { status: 429 }
      );
    }

    const url = request.nextUrl.pathname;
    const path = url.replace(/^\/api\/tenweb\//, "");

    console.log(`🔍 Forwarding 10Web API POST request to path: ${path}`);

    const body = await request.json();
    console.log("🔍 Request body:", body);

    if (path === "hosting/website") {
      if (isWebsiteCreationInProgress) {
        console.log("⚠️ Website creation already in progress");
        return NextResponse.json({
          status: "ok",
          data: {
            domain_id: Date.now(),
            message: "Skipped duplicate website creation",
          },
        });
      }

      isWebsiteCreationInProgress = true;

      setTimeout(() => {
        isWebsiteCreationInProgress = false;
      }, 30000);
    }

    const response = await tenwebApi.post(`/${path}`, body);
    console.log(`✅ 10Web API POST response for ${path}:`, response.data);

    if (path === "hosting/website") {
      isWebsiteCreationInProgress = false;
    }

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(
      "❌ 10Web API POST Error:",
      error?.response?.data || error?.message || error
    );

    if (error.response) {
      console.error("❌ Error Response Data:", error.response.data);
      console.error("❌ Error Response Status:", error.response.status);
      console.error("❌ Error Response Headers:", error.response.headers);
    } else if (error.request) {
      console.error("❌ Error Request:", error.request);
    } else {
      console.error("❌ Error Message:", error.message);
    }

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

// GET handler
export async function GET(
  request: NextRequest,
  context: { params: { path: string[] } }
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
