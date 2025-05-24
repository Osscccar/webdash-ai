import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const domainId = url.searchParams.get('domainId');
    const customDomain = url.searchParams.get('domain');

    if (!domainId) {
      return NextResponse.json(
        { error: "Domain ID is required" },
        { status: 400 }
      );
    }

    let primaryIP = '';
    
    // Get instance info from 10Web API to fetch the real IP address
    try {
      const instanceResponse = await fetch(`${process.env.TENWEB_API_URL}/hosting/domains/${domainId}/instance-info`, {
        method: 'GET',
        headers: {
          'x-api-key': process.env.TENWEB_API_KEY || '',
        },
      });

      if (instanceResponse.ok) {
        const instanceData = await instanceResponse.json();
        if (instanceData.status === 'ok' && instanceData.data?.ip) {
          primaryIP = instanceData.data.ip;
        }
      }
    } catch (error) {
      console.error('Failed to fetch instance info from 10Web:', error);
    }

    // Fallback to a default IP if we couldn't get the real one
    if (!primaryIP) {
      console.warn('Using fallback IP address - could not fetch from 10Web API');
      primaryIP = '35.193.39.110';
    }

    return NextResponse.json({
      success: true,
      dns: {
        a_record: primaryIP,
        cname_target: customDomain || `${domainId}.webdash.site`,
        domain: customDomain,
        records: [
          {
            type: 'A',
            name: '@',
            value: primaryIP,
            description: `Points your root domain (${customDomain || 'your domain'}) to our servers`
          },
          {
            type: 'CNAME', 
            name: 'www',
            value: customDomain || `${domainId}.webdash.site`,
            description: `Points www.${customDomain || 'your domain'} to your root domain`
          }
        ]
      },
      ttl: 300,
      propagation_time: "24-48 hours"
    });
  } catch (error: any) {
    console.error('Error getting DNS info:', error);
    
    return NextResponse.json({
      error: "Failed to fetch DNS information",
      message: error.message
    }, { status: 500 });
  }
}