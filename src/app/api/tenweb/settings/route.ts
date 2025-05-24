import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const domainId = url.searchParams.get('domainId');

    if (!domainId) {
      return NextResponse.json(
        { error: "Domain ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${process.env.TENWEB_API_URL}/hosting/domains/${domainId}/settings`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.TENWEB_API_KEY || '',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get domain settings');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error getting domain settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get domain settings' },
      { status: 500 }
    );
  }
}