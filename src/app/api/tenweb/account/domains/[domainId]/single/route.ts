import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ domainId: string }> }) {
  try {
    const { domainId } = await params;
    const url = new URL(request.url);
    const adminUrl = url.searchParams.get('admin_url');

    if (!domainId) {
      return NextResponse.json(
        { error: "Domain ID is required" },
        { status: 400 }
      );
    }

    if (!adminUrl) {
      return NextResponse.json(
        { error: "Admin URL is required" },
        { status: 400 }
      );
    }

    // Call the 10Web autologin API
    const response = await fetch(`${process.env.TENWEB_API_URL}/account/domains/${domainId}/single?admin_url=${encodeURIComponent(adminUrl)}`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.TENWEB_API_KEY || '',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get autologin token');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error getting autologin token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get autologin token' },
      { status: 500 }
    );
  }
}