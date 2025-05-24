import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { domainId, action, stagingDomainId } = await request.json();

    if (!domainId || !action) {
      return NextResponse.json(
        { error: "Domain ID and action are required" },
        { status: 400 }
      );
    }

    let endpoint = '';
    
    switch (action) {
      case 'enable':
        endpoint = `/hosting/domains/${domainId}/staging/enable`;
        break;
      case 'disable':
        if (!stagingDomainId) {
          return NextResponse.json(
            { error: "Staging domain ID is required for disable action" },
            { status: 400 }
          );
        }
        endpoint = `/hosting/domains/${stagingDomainId}/staging/disable`;
        break;
      case 'push-to-live':
        if (!stagingDomainId) {
          return NextResponse.json(
            { error: "Staging domain ID is required for push-to-live action" },
            { status: 400 }
          );
        }
        endpoint = `/hosting/domains/${stagingDomainId}/push-to-live`;
        break;
      case 'push-to-staging':
        endpoint = `/hosting/domains/${domainId}/push-to-staging`;
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
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to perform staging action');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error performing staging action:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to perform staging action' },
      { status: 500 }
    );
  }
}