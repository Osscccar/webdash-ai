// src/app/api/tenweb/ai/generate_site_from_sitemap/route.ts

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// 10Web API configuration
const TENWEB_API_KEY = process.env.TENWEB_API_KEY;

// Keep track of pending requests (this is in-memory only, reset on function cold start)
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

    console.log("Starting background website generation with params:", body);

    // Call the Netlify background function using fetch
    // We need the absolute URL for the background function
    // This depends on your Netlify site name
    // During local development, you can use the netlify dev proxy at port 8888
    let backgroundFunctionUrl;

    if (process.env.NETLIFY_DEV === "true") {
      // Local development with netlify dev
      backgroundFunctionUrl =
        "http://localhost:8888/.netlify/functions/background-site-generator";
    } else {
      // Production URL - replace YOUR_SITE_NAME with your Netlify site name
      backgroundFunctionUrl = `https://${
        process.env.URL || request.headers.get("host")
      }/.netlify/functions/background-site-generator`;
    }

    const response = await fetch(backgroundFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    // Store in pending requests map with a placeholder domain ID
    // In a real implementation, you'd use a database to track this
    pendingRequests.set(requestId, "pending");

    // Set a timeout to remove from pending requests after 10 minutes
    setTimeout(() => {
      pendingRequests.delete(requestId);
    }, 10 * 60 * 1000);

    return NextResponse.json({
      status: "accepted",
      data: {
        requestId: requestId,
        message: "Website generation started in background",
      },
    });
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
