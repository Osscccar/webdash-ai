import { NextRequest, NextResponse } from 'next/server';
import { getAuthTokens } from '@/lib/tenweb-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domainId');
    
    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 });
    }

    const { token } = await getAuthTokens();
    
    const response = await fetch(`https://my.10web.io/api/domains/${domainId}/dns-zone`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('DNS zone error:', error);
    return NextResponse.json({ error: 'Failed to get DNS zone' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domainId');
    const body = await request.json();
    
    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 });
    }

    const { token } = await getAuthTokens();
    
    const response = await fetch(`https://my.10web.io/api/domains/${domainId}/dns-zone`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('DNS record creation error:', error);
    return NextResponse.json({ error: 'Failed to create DNS record' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domainId');
    const recordId = searchParams.get('recordId');
    const body = await request.json();
    
    if (!domainId || !recordId) {
      return NextResponse.json({ error: 'Domain ID and Record ID are required' }, { status: 400 });
    }

    const { token } = await getAuthTokens();
    
    const response = await fetch(`https://my.10web.io/api/domains/${domainId}/dns-zone/${recordId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('DNS record update error:', error);
    return NextResponse.json({ error: 'Failed to update DNS record' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domainId');
    const recordId = searchParams.get('recordId');
    
    if (!domainId || !recordId) {
      return NextResponse.json({ error: 'Domain ID and Record ID are required' }, { status: 400 });
    }

    const { token } = await getAuthTokens();
    
    const response = await fetch(`https://my.10web.io/api/domains/${domainId}/dns-zone/${recordId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('DNS record deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete DNS record' }, { status: 500 });
  }
}