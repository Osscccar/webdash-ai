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

    // Get performance/cache status from 10Web API
    const response = await fetch(`${process.env.TENWEB_API_URL}/hosting/domains/${domainId}/cache/status`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.TENWEB_API_KEY || '',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get performance metrics');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error getting performance metrics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get performance metrics' },
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

    // Performance optimization via cache management
    const response = await fetch(`${process.env.TENWEB_API_URL}/hosting/domains/${domainId}/cache/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.TENWEB_API_KEY || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to optimize performance');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error optimizing performance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to optimize performance' },
      { status: 500 }
    );
  }
}