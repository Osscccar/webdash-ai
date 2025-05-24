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

    const response = await fetch(`${process.env.TENWEB_API_URL}/hosting/domains/${domainId}/ssl`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.TENWEB_API_KEY || '',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get SSL status');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error getting SSL status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get SSL status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const domainId = url.searchParams.get('domainId');
    const body = await request.json();
    
    if (!domainId) {
      return NextResponse.json(
        { error: "Domain ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${process.env.TENWEB_API_URL}/hosting/domains/${domainId}/ssl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.TENWEB_API_KEY || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to manage SSL');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error managing SSL:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to manage SSL' },
      { status: 500 }
    );
  }
}