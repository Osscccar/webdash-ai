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

    // Get SSL certificates for the domain using 10Web API
    const response = await fetch(`${process.env.TENWEB_API_URL}/hosting/domains/${domainId}/certificate`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.TENWEB_API_KEY || '',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get SSL status');
    }

    // Process certificates to provide status for each domain
    const certificates = data.data || [];
    const sslStatusByDomain: Record<string, {
      hasCertificate: boolean;
      status?: string;
      validTo?: string;
      issuer?: string;
    }> = {};

    certificates.forEach((cert: any) => {
      if (cert.domain_name) {
        // Clean domain name (remove http://)
        const cleanDomain = cert.domain_name.replace(/^https?:\/\//, '');
        sslStatusByDomain[cleanDomain] = {
          hasCertificate: true,
          status: cert.status,
          validTo: cert.valid_to,
          issuer: cert.issuer,
        };
      }
    });

    return NextResponse.json({
      success: true,
      certificates: sslStatusByDomain
    });
  } catch (error: any) {
    console.error('Error getting SSL status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get SSL status' },
      { status: 500 }
    );
  }
}