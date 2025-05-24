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

    // Get cache status
    const response = await fetch(`${process.env.TENWEB_API_URL}/hosting/domains/${domainId}/cache`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.TENWEB_API_KEY || '',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get cache status');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error getting cache status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get cache status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { domainId, action, cacheTime, recache } = await request.json();

    if (!domainId || !action) {
      return NextResponse.json(
        { error: "Domain ID and action are required" },
        { status: 400 }
      );
    }

    let endpoint = '';
    let method = 'POST';
    let body = {};

    switch (action) {
      case 'enable':
        endpoint = `/hosting/domains/${domainId}/cache/enable`;
        method = 'PUT';
        if (cacheTime) {
          body = { cache_time: cacheTime };
        }
        break;
      case 'disable':
        endpoint = `/hosting/domains/${domainId}/cache/disable`;
        method = 'PUT';
        break;
      case 'purge':
        endpoint = `/hosting/domains/${domainId}/cache`;
        method = 'DELETE';
        if (recache !== undefined) {
          body = { recache };
        }
        break;
      case 'object-cache-enable':
        endpoint = `/hosting/domains/${domainId}/object-cache/toggle`;
        body = { action: 'enable' };
        break;
      case 'object-cache-disable':
        endpoint = `/hosting/domains/${domainId}/object-cache/toggle`;
        body = { action: 'disable' };
        break;
      case 'object-cache-flush':
        endpoint = `/hosting/domains/${domainId}/object-cache/flush`;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    const response = await fetch(`${process.env.TENWEB_API_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.TENWEB_API_KEY || '',
      },
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to perform cache action');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error performing cache action:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to perform cache action' },
      { status: 500 }
    );
  }
}