// src/app/api/tenweb-mock/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateRandomSubdomain } from "@/lib/utils";

// Mock 10Web API for testing purposes
export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Parse request body
    const body = await request.json();

    // Determine which endpoint was called based on path
    const path = params.path.join("/");
    console.log(`Mock 10Web API called: ${path}`);
    console.log("Request body:", JSON.stringify(body, null, 2));

    // Handle different mock endpoints
    if (path === "hosting/website") {
      return handleCreateWebsite(body);
    } else if (path === "ai/generate_sitemap") {
      return handleGenerateSitemap(body);
    } else if (path === "ai/generate_site_from_sitemap") {
      return handleGenerateSiteFromSitemap(body);
    }

    // Default mock response
    return NextResponse.json({
      status: "ok",
      message: "Mock operation successful",
      data: {
        id: Math.floor(Math.random() * 10000),
      },
    });
  } catch (error: any) {
    console.error("Mock API error:", error);

    return NextResponse.json(
      {
        error: error.message || "Mock API error",
        status: 500,
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Determine which endpoint was called based on path
    const path = params.path.join("/");
    const queryString = new URL(request.url).search;
    console.log(`Mock 10Web API GET called: ${path}${queryString}`);

    // Handle different GET endpoints
    if (path.includes("/single")) {
      return handleGetWPAutologinToken();
    }

    // Default mock response
    return NextResponse.json({
      status: "ok",
      message: "Mock GET operation successful",
      data: {
        id: Math.floor(Math.random() * 10000),
      },
    });
  } catch (error: any) {
    console.error("Mock API GET error:", error);

    return NextResponse.json(
      {
        error: error.message || "Mock API GET error",
        status: 500,
      },
      { status: 500 }
    );
  }
}

// Mock handlers for specific endpoints

function handleCreateWebsite(body: any) {
  // Simulate website creation
  const { subdomain, region, site_title } = body;

  // Validate required fields
  if (!subdomain || !region || !site_title) {
    return NextResponse.json(
      {
        error: "Missing required fields",
        status: 400,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    status: "ok",
    data: {
      domain_id: Math.floor(Math.random() * 10000) + 10000,
      subdomain,
      site_url: `https://${subdomain}.10web.site`,
    },
  });
}

function handleGenerateSitemap(body: any) {
  // Simulate sitemap generation
  const { domain_id, params } = body;

  if (!domain_id || !params) {
    return NextResponse.json(
      {
        error: "Missing required fields",
        status: 400,
      },
      { status: 400 }
    );
  }

  // Create a mock sitemap based on the business description
  const { business_type, business_name, business_description } = params;

  return NextResponse.json({
    status: "ok",
    data: {
      business_description,
      business_name,
      business_type,
      colors: {
        background_dark: "#212121",
        primary_color: "#ff69b4",
        secondary_color: "#ffd700",
      },
      domain_id,
      fonts: {
        primary_font: "Montserrat",
      },
      pages_meta: [
        {
          description:
            "The home page is the primary landing page for the website.",
          sections: [
            {
              section_description: "Header section with logo and navigation.",
              section_title: "Header",
            },
            {
              section_description: "Hero section with main value proposition.",
              section_title: "Hero",
            },
          ],
          title: "Home",
        },
        {
          description: "About page with company details.",
          sections: [
            {
              section_description: "Our story and mission.",
              section_title: "About Us",
            },
          ],
          title: "About",
        },
      ],
      unique_id: `mock_unique_${Math.random().toString(36).substring(2, 15)}`,
      website_description: `${business_name} - ${business_description}`,
      website_keyphrase: business_name.toLowerCase(),
      website_title: business_name,
      website_type: "basic",
    },
  });
}

function handleGenerateSiteFromSitemap(body: any) {
  // Simulate website generation from sitemap
  const { domain_id, unique_id } = body;

  if (!domain_id || !unique_id) {
    return NextResponse.json(
      {
        error: "Missing required fields",
        status: 400,
      },
      { status: 400 }
    );
  }

  // Simulate a delay for more realistic behavior
  // In a real implementation, we'd use await new Promise(resolve => setTimeout(resolve, 2000));

  return NextResponse.json({
    status: "ok",
    data: {
      url: `https://${generateRandomSubdomain("site")}.10web.site`,
      domain_id,
      unique_id,
    },
  });
}

function handleGetWPAutologinToken() {
  // Simulate generating a WordPress autologin token
  return NextResponse.json({
    status: "ok",
    token: `mock_wp_token_${Math.random().toString(36).substring(2, 15)}`,
  });
}
