import { NextRequest, NextResponse } from 'next/server';
import { getAuthTokens } from '@/lib/tenweb-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domainId');
    const logType = searchParams.get('type') || 'access'; // access, error, or php
    const limit = searchParams.get('limit') || '100';
    const offset = searchParams.get('offset') || '0';
    
    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 });
    }

    const { token } = await getAuthTokens();
    
    const response = await fetch(`https://my.10web.io/api/domains/${domainId}/logs/${logType}?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Logs fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domainId');
    const logType = searchParams.get('type') || 'access';
    
    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 });
    }

    const { token } = await getAuthTokens();
    
    const response = await fetch(`https://my.10web.io/api/domains/${domainId}/logs/${logType}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Logs clear error:', error);
    return NextResponse.json({ error: 'Failed to clear logs' }, { status: 500 });
  }
}