import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { rateLimit } from "@/lib/rate-limit";

// Create a rate limiter instance
const limiter = rateLimit({
  intervalInMs: 60000, // 1 minute
  maxRequests: 100, // 100 requests per minute
});

const TENWEB_API_KEY = process.env.TENWEB_API_KEY;
const TENWEB_API_BASE_URL = "https://api.10web.io";

const tenwebApi = axios.create({
  baseURL: TENWEB_API_BASE_URL,
  headers: {
    "x-api-key": TENWEB_API_KEY,
    "Content-Type": "application/json",
  },
});

let isWebsiteCreationInProgress = false;

setInterval(() => {
  isWebsiteCreationInProgress = false;
}, 300000);

// POST Handler
export async function POST(request: NextRequest) {
  try {
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
    const body = await request.json();

    if (path === "hosting/website") {
      if (isWebsiteCreationInProgress) {
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

    if (path === "hosting/website") {
      isWebsiteCreationInProgress = false;
    }

    return NextResponse.json(response.data);
  } catch (error: any) {
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

// GET Handler
export async function GET(request: NextRequest) {
  try {
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

    const response = await tenwebApi.get(`/${path}${queryString}`);

    return NextResponse.json(response.data);
  } catch (error: any) {
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
