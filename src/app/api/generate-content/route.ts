// src/app/api/generate-content/route.ts

import { NextRequest, NextResponse } from "next/server";
import { generateWebsiteContent } from "@/lib/openai-service";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const content = await generateWebsiteContent(prompt);

    return NextResponse.json({ content });
  } catch (error: any) {
    console.error("Error generating content:", error.message);

    return NextResponse.json(
      {
        error: "Failed to generate content",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
