import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${process.env.TENWEB_API_URL}/hosting/supported-php-versions`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.TENWEB_API_KEY || '',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get PHP versions');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error getting PHP versions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get PHP versions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { domainId, action, phpVersion } = await request.json();

    if (!domainId || !action) {
      return NextResponse.json(
        { error: "Domain ID and action are required" },
        { status: 400 }
      );
    }

    let endpoint = '';
    let body = {};

    switch (action) {
      case 'switch':
        if (!phpVersion) {
          return NextResponse.json(
            { error: "PHP version is required for switch action" },
            { status: 400 }
          );
        }
        endpoint = `/hosting/domains/${domainId}/php-version/switch`;
        body = { php_version: phpVersion };
        break;
      case 'restart':
        endpoint = `/hosting/domains/${domainId}/php/restart`;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    const response = await fetch(`${process.env.TENWEB_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.TENWEB_API_KEY || '',
      },
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to perform PHP action');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error performing PHP action:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to perform PHP action' },
      { status: 500 }
    );
  }
}