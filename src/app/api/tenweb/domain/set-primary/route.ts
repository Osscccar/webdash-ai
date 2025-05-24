import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { domainId, domainNameId } = await request.json();

    if (!domainId || !domainNameId) {
      return NextResponse.json(
        { error: "Domain ID and domain name ID are required" },
        { status: 400 }
      );
    }

    // Set domain as primary using 10Web API
    const response = await fetch(`${process.env.TENWEB_API_URL}/hosting/domains/${domainId}/domain-name/${domainNameId}/default`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.TENWEB_API_KEY || '',
      },
    });

    const data = await response.json();

    if (!response.ok || data.status !== 'ok') {
      throw new Error(data.message || 'Failed to set primary domain');
    }

    return NextResponse.json({
      success: true,
      domain_name: data.domain_name,
      message: data.message || "Domain set as primary successfully"
    });
  } catch (error: any) {
    console.error('Error setting primary domain:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set primary domain' },
      { status: 500 }
    );
  }
}