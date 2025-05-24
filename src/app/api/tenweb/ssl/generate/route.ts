import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { domainId, domainNameIds, redirectHttp = 1 } = await request.json();

    if (!domainId) {
      return NextResponse.json(
        { error: "Domain ID is required" },
        { status: 400 }
      );
    }

    if (!domainNameIds || !Array.isArray(domainNameIds) || domainNameIds.length === 0) {
      return NextResponse.json(
        { error: "Domain name IDs are required" },
        { status: 400 }
      );
    }

    // Generate free SSL certificate using 10Web API
    const response = await fetch(`${process.env.TENWEB_API_URL}/hosting/domains/${domainId}/certificate/free`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.TENWEB_API_KEY || '',
      },
      body: JSON.stringify({
        domain_name_ids: domainNameIds,
        redirect_http: redirectHttp
      }),
    });

    const data = await response.json();

    if (!response.ok || data.status !== 'ok') {
      throw new Error(data.message || 'Failed to generate SSL certificate');
    }

    return NextResponse.json({
      success: true,
      message: data.message || "SSL certificate generation started",
      certificate: data.data
    });
  } catch (error: any) {
    console.error('Error generating SSL certificate:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate SSL certificate' },
      { status: 500 }
    );
  }
}