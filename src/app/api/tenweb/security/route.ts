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
    
    const response = await fetch(`https://my.10web.io/api/domains/${domainId}/security`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Security settings error:', error);
    return NextResponse.json({ error: 'Failed to get security settings' }, { status: 500 });
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
    
    const response = await fetch(`https://my.10web.io/api/domains/${domainId}/security`, {
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
    console.error('Security update error:', error);
    return NextResponse.json({ error: 'Failed to update security settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domainId');
    const body = await request.json();
    
    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 });
    }

    const { token } = await getAuthTokens();
    
    // Password protection endpoint
    const response = await fetch(`https://my.10web.io/api/domains/${domainId}/password-protection`, {
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
    console.error('Password protection error:', error);
    return NextResponse.json({ error: 'Failed to update password protection' }, { status: 500 });
  }
}