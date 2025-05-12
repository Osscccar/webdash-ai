// src/app/api/tenweb/hosting/website/route.ts

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// 10Web API configuration
const TENWEB_API_KEY = process.env.TENWEB_API_KEY;
const TENWEB_API_BASE_URL = "https://api.10web.io";

export async function POST(request: NextRequest) {
  if (!TENWEB_API_KEY) {
    return NextResponse.json(
      { error: "TENWEB_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    console.log("Creating website with params:", body);

    // Make the request to 10Web API
    const response = await axios.post(
      `${TENWEB_API_BASE_URL}/hosting/website`,
      body,
      {
        headers: {
          "x-api-key": TENWEB_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("10Web API response:", response.data);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("10Web API Error:", error.response?.data || error.message);

    return NextResponse.json(
      {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to create website",
        details: error.response?.data || {},
      },
      { status: error.response?.status || 500 }
    );
  }
}
