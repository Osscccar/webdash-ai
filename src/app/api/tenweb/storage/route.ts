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

    const response = await fetch(`${process.env.TENWEB_API_URL}/hosting/domains/${domainId}/storage`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.TENWEB_API_KEY || '',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get storage info');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error getting storage info:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get storage info' },
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

    const response = await fetch(`${process.env.TENWEB_API_URL}/hosting/domains/${domainId}/storage/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.TENWEB_API_KEY || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to cleanup storage');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error cleaning up storage:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cleanup storage' },
      { status: 500 }
    );
  }
}