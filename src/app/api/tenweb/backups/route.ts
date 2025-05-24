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

    const response = await fetch(`${process.env.TENWEB_API_URL}/hosting/domains/${domainId}/backup/list`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.TENWEB_API_KEY || '',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get backups');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error getting backups:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get backups' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { domainId, action, backupId } = await request.json();

    if (!domainId || !action) {
      return NextResponse.json(
        { error: "Domain ID and action are required" },
        { status: 400 }
      );
    }

    let endpoint = '';
    let method = 'POST';
    let body = null;

    if (action === 'create') {
      endpoint = `/hosting/domains/${domainId}/backup/run`;
    } else if (action === 'restore' && backupId) {
      endpoint = `/hosting/domains/${domainId}/backup/${backupId}/restore`;
    } else {
      return NextResponse.json(
        { error: "Invalid action or missing backup ID for restore" },
        { status: 400 }
      );
    }

    const response = await fetch(`${process.env.TENWEB_API_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.TENWEB_API_KEY || '',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to perform backup action');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error performing backup action:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to perform backup action' },
      { status: 500 }
    );
  }
}