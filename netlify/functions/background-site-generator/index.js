const axios = require("axios");

// Background functions need to export a handler that returns a 202 response quickly
exports.handler = async (event, context) => {
  // Parse the request body
  const body = JSON.parse(event.body);
  const {
    subdomain,
    unique_id,
    business_type,
    business_name,
    business_description,
    colors,
    fonts,
    pages_meta,
    website_title,
    website_description,
    website_keyphrase,
    website_type,
  } = body;

  // Return 202 Accepted immediately to prevent timeout
  // Store requestId so client can check status
  const requestId = unique_id || `request-${Date.now()}`;

  // Start the background processing
  // We don't await this because we want to return immediately
  generateSiteInBackground(body, requestId);

  return {
    statusCode: 202,
    body: JSON.stringify({
      status: "accepted",
      message:
        "Your request has been accepted and is being processed in the background",
      requestId: requestId,
    }),
  };
};

// This function runs in the background and can take up to 10 minutes
async function generateSiteInBackground(params, requestId) {
  try {
    console.log(
      "Background function: Starting website generation with params:",
      JSON.stringify(params)
    );

    // Step 1: Create the website
    console.log("Step 1: Creating website with subdomain:", params.subdomain);

    const createResponse = await axios.post(
      "https://api.10web.io/hosting/website",
      {
        subdomain: params.subdomain,
        region: "us-central1-c", // Default region
        site_title:
          params.website_title || params.business_name || "New Website",
        admin_username: `admin_${params.subdomain}`,
        admin_password: "Password1Ab", // Strong password that meets requirements
      },
      {
        headers: {
          "x-api-key": process.env.TENWEB_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 60000, // 60-second timeout for this step
      }
    );

    console.log(
      "Website creation response:",
      JSON.stringify(createResponse.data)
    );

    if (
      !createResponse.data ||
      !createResponse.data.data ||
      !createResponse.data.data.domain_id
    ) {
      throw new Error(
        "Failed to create website - missing domain_id in response"
      );
    }

    const domainId = createResponse.data.data.domain_id;

    // Step 2: Generate a sitemap first to get a unique_id
    console.log("Step 2: Generating sitemap for domain ID:", domainId);

    const sitemapParams = {
      domain_id: domainId,
      params: {
        business_type: params.business_type || "agency",
        business_name: params.business_name || "My Business",
        business_description:
          params.business_description || "A professional website",
      },
    };

    const sitemapResponse = await axios.post(
      "https://api.10web.io/ai/generate_sitemap",
      sitemapParams,
      {
        headers: {
          "x-api-key": process.env.TENWEB_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 60000, // 60-second timeout for this step
      }
    );

    console.log(
      "Sitemap generation response:",
      JSON.stringify(sitemapResponse.data)
    );

    if (!sitemapResponse.data?.data?.unique_id) {
      throw new Error(
        "Failed to generate sitemap - missing unique_id in response"
      );
    }

    const unique_id = sitemapResponse.data.data.unique_id;

    // Step 3: Generate site from sitemap
    console.log(
      "Step 3: Generating site from sitemap for domain ID:",
      domainId
    );

    const generateParams = {
      domain_id: domainId,
      unique_id: unique_id,
      params: {
        business_type: params.business_type || "agency",
        business_name: params.business_name || "My Business",
        business_description:
          params.business_description || "A professional website",
        colors: params.colors || {
          primary_color: "#f58327",
          secondary_color: "#4a5568",
          background_dark: "#212121",
        },
        fonts: params.fonts || {
          primary_font: "Montserrat",
        },
        pages_meta: params.pages_meta || [],
        website_title:
          params.website_title || params.business_name || "My Website",
        website_description:
          params.website_description ||
          params.business_description ||
          "A professional website",
        website_keyphrase:
          params.website_keyphrase ||
          params.business_name?.toLowerCase() ||
          "website",
        website_type: params.website_type || params.business_type || "agency",
      },
    };

    // This is the long-running call that was timing out before
    const generateResponse = await axios.post(
      "https://api.10web.io/ai/generate_site_from_sitemap",
      generateParams,
      {
        headers: {
          "x-api-key": process.env.TENWEB_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 540000, // 9-minute timeout for this step
      }
    );

    console.log(
      "AI site generation response:",
      JSON.stringify(generateResponse.data)
    );

    // Save the successful result to a database or file storage
    // Here we would typically store this in a database to allow status checking
    // For this example, we'll use console.log
    console.log(
      `GENERATION_COMPLETE:${requestId}:${domainId}:${params.subdomain}`
    );
  } catch (error) {
    console.error("Background function error:", error);
    console.log(`GENERATION_ERROR:${requestId}:${error.message}`);
  }
}
