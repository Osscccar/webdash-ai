// src/app/api/screenshot/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get the URL from the query parameters
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");
    const refresh = searchParams.get("refresh") === "true";

    // If no URL is provided, return an error
    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    // Get the API key from environment variables
    const apiKey = process.env.NEXT_PUBLIC_SCREENSHOT_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Screenshot API key is not configured" },
        { status: 500 }
      );
    }

    // Generate a timestamp for cache busting if refresh is requested
    const timestamp = refresh ? Date.now() : "";

    // Construct the screenshot API URL
    const screenshotApiUrl = `https://api.screenshotmachine.com/?key=${apiKey}&url=${encodeURIComponent(
      url
    )}&dimension=1024x768&cacheLimit=${refresh ? "0" : "14"}&delay=1000${
      refresh ? `&timestamp=${timestamp}` : ""
    }`;

    // Proxy the image instead of just returning the URL
    const screenshotResponse = await fetch(screenshotApiUrl);

    if (!screenshotResponse.ok) {
      return NextResponse.json(
        { error: "Failed to generate screenshot" },
        { status: 502 }
      );
    }

    // Get the screenshot image data
    const imageBuffer = await screenshotResponse.arrayBuffer();

    // Prepare the response with appropriate headers
    const response = new NextResponse(imageBuffer);

    // Set appropriate content type and cache headers
    response.headers.set("Content-Type", "image/png");
    response.headers.set(
      "Cache-Control",
      refresh ? "no-cache, no-store" : "public, max-age=86400"
    );

    return response;
  } catch (error) {
    console.error("Screenshot API error:", error);
    return NextResponse.json(
      { error: "Failed to process screenshot request" },
      { status: 500 }
    );
  }
}
