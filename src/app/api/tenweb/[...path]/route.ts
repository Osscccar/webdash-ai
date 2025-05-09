import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// 10Web API configuration
const TENWEB_API_KEY = process.env.TENWEB_API_KEY;
const TENWEB_API_BASE_URL = "https://10web.io/api/v1";

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Parse request body
    const body = await request.json();

    // Construct API path
    const path = params.path.join("/");
    const url = `${TENWEB_API_BASE_URL}/${path}`;

    console.log(`Making POST request to 10Web API: ${url}`);
    console.log("Request body:", JSON.stringify(body, null, 2));
    console.log(
      "API Key (first 5 chars):",
      TENWEB_API_KEY ? TENWEB_API_KEY.substring(0, 5) : "undefined"
    );

    // Test if we can make a basic request to 10Web API
    const testResponse = await axios.get(
      `${TENWEB_API_BASE_URL}/account/domains`,
      {
        headers: {
          "x-api-key": TENWEB_API_KEY as string,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Test request successful:", testResponse.status);

    // If test request succeeded, make the actual request
    const response = await axios.post(url, body, {
      headers: {
        "x-api-key": TENWEB_API_KEY as string,
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    // Detailed error logging
    console.error("10Web API Error Details:");
    console.error("Status:", error.response?.status);
    console.error("Status Text:", error.response?.statusText);
    console.error("Headers:", JSON.stringify(error.response?.headers, null, 2));
    console.error("Data:", JSON.stringify(error.response?.data, null, 2));

    if (error.response?.status === 403) {
      console.error("403 Forbidden - This typically means:");
      console.error("1. Your API key is invalid or expired");
      console.error(
        "2. Your account doesn't have permissions for this operation"
      );
      console.error("3. The request format is incorrect");

      // Check if the API key is being passed correctly
      console.error(
        "API Key check:",
        TENWEB_API_KEY ? "Present (masked)" : "Missing"
      );
    }

    return NextResponse.json(
      {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to post data to 10Web API",
        status: error.response?.status || 500,
        details: error.response?.data || null,
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Construct API path
    const path = params.path.join("/");
    const queryString = new URL(request.url).search;
    const url = `${TENWEB_API_BASE_URL}/${path}${queryString}`;

    console.log(`Making GET request to 10Web API: ${url}`);

    // Make request to 10Web API
    const response = await axios.get(url, {
      headers: {
        "x-api-key": TENWEB_API_KEY as string,
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    // Detailed error logging
    console.error("10Web API Error Details:");
    console.error("Status:", error.response?.status);
    console.error("Status Text:", error.response?.statusText);
    console.error("Headers:", JSON.stringify(error.response?.headers, null, 2));
    console.error("Data:", JSON.stringify(error.response?.data, null, 2));

    return NextResponse.json(
      {
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch data from 10Web API",
        status: error.response?.status || 500,
        details: error.response?.data || null,
      },
      { status: error.response?.status || 500 }
    );
  }
}
