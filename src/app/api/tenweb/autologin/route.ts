import { NextRequest, NextResponse } from "next/server";
import { TENWEB_API_BASE_URL, TENWEB_API_KEY } from "@/config/tenweb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domainId, siteUrl, email } = body;

    if (!domainId) {
      return NextResponse.json(
        { error: "Domain ID is required" },
        { status: 400 }
      );
    }

    // Construct the admin URL based on siteUrl or fallback to subdomain
    const adminUrl = siteUrl ? `${siteUrl}/wp-admin` : `https://${domainId}.webdash.site/wp-admin`;
    
    // Use the configured base URL and make request according to OpenAPI spec
    const apiUrl = `${TENWEB_API_BASE_URL}/account/domains/${domainId}/single?admin_url=${encodeURIComponent(adminUrl)}`;
    
    console.log('Making autologin request to:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-api-key': TENWEB_API_KEY || '',
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.log('Non-JSON response received:', textResponse.substring(0, 500));
      throw new Error(`API returned non-JSON response (${response.status}): ${textResponse.substring(0, 200)}`);
    }

    const data = await response.json();
    console.log('TenWeb API response:', data);

    if (!response.ok) {
      console.error('TenWeb API error response:', data);
      throw new Error(data.message || data.error || 'Failed to get autologin token');
    }

    // Check if the response has the expected structure
    if (data.status === 'ok' && data.token) {
      // Construct the autologin URL with email parameter as per OpenAPI spec
      const userEmail = email || 'admin@webdash.site'; // Use provided email or fallback
      const autologinUrl = `${adminUrl}/?twb_wp_login_token=${data.token}&email=${encodeURIComponent(userEmail)}`;
      
      return NextResponse.json({ 
        url: autologinUrl, 
        token: data.token,
        status: 'success'
      });
    }

    // If status is not 'ok' or no token, return error
    if (data.status === 'error') {
      throw new Error(data.message || 'API returned error status');
    }

    return NextResponse.json({
      error: 'Invalid response from TenWeb API',
      details: data
    }, { status: 500 });

  } catch (error: any) {
    console.error('Error getting autologin token:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to get autologin token',
        details: error.stack || 'No additional details'
      },
      { status: 500 }
    );
  }
}