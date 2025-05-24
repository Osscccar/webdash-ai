// src/app/api/tenweb/generation-status/[requestId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// In a real implementation, you would query a database
// Instead, we'll simulate status checking with a mock
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    // This is a mocked status check
    // In a real implementation, you would query a database or state store
    // to get the actual status of the background function

    // Simulate a random completion time between 10-30 seconds
    const now = Date.now();
    const requestStartTime = parseInt(requestId.split("-")[1] || "0");
    const elapsedTime = now - requestStartTime;

    // For demo purposes, we'll simulate different statuses based on time elapsed
    let status = "processing";
    let progress = Math.min(95, Math.floor(elapsedTime / 1000)); // 1% per second up to 95%

    if (elapsedTime > 30000) {
      status = "complete";
      progress = 100;
    }

    return NextResponse.json({
      status: "ok",
      data: {
        requestId,
        status,
        progress,
        message:
          status === "complete"
            ? "Website generation completed successfully"
            : "Website generation in progress",
      },
    });
  } catch (error: any) {
    console.error("Status check error:", error);

    return NextResponse.json(
      {
        error: error.message || "Failed to check generation status",
      },
      { status: 500 }
    );
  }
}
