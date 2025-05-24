import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { domainId, subdomain, domain, domainName } = await request.json();

    if (!domainId) {
      return NextResponse.json(
        { error: "Domain ID is required" },
        { status: 400 }
      );
    }

    let newDomain = '';

    if (subdomain) {
      // Add subdomain to webdash.site
      newDomain = `${subdomain}.webdash.site`;
    } else if (domain) {
      // Add custom domain
      newDomain = domain;
    } else if (domainName) {
      // Legacy support for domainName parameter
      newDomain = domainName;
    } else {
      return NextResponse.json(
        { error: "Either subdomain, domain, or domainName is required" },
        { status: 400 }
      );
    }

    // Validate domain format (basic validation)
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(newDomain)) {
      return NextResponse.json(
        { error: "Invalid domain format" },
        { status: 400 }
      );
    }

    // Call 10Web API to add domain/subdomain using the correct endpoint
    const response = await fetch(`${process.env.TENWEB_API_URL}/hosting/domains/${domainId}/domain-name`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.TENWEB_API_KEY || '',
      },
      body: JSON.stringify({
        domain_name: newDomain
      }),
    });

    const data = await response.json();

    if (!response.ok || data.status !== 'ok') {
      throw new Error(data.message || 'Failed to add domain to 10Web');
    }

    // Clean the domain name by removing http:// or https:// prefix
    const cleanDomain = (domain: string) => {
      return domain.replace(/^https?:\/\//, '');
    };

    const returnedDomain = data.data?.domain_name || newDomain;
    const cleanedDomain = cleanDomain(returnedDomain);
    const domainNameId = data.data?.id;

    // Automatically generate SSL certificate for the new domain
    if (domainNameId) {
      try {
        const sslResponse = await fetch(`${process.env.TENWEB_API_URL}/hosting/domains/${domainId}/certificate/free`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.TENWEB_API_KEY || '',
          },
          body: JSON.stringify({
            domain_name_ids: [domainNameId],
            redirect_http: 1
          }),
        });

        if (sslResponse.ok) {
          console.log('SSL certificate generation started for domain:', cleanedDomain);
        } else {
          console.warn('Failed to generate SSL certificate for domain:', cleanedDomain);
        }
      } catch (sslError) {
        console.warn('Error generating SSL certificate:', sslError);
      }
    }

    return NextResponse.json({
      success: true,
      domain: cleanedDomain,
      id: domainNameId,
      message: data.data?.message || "Domain added successfully",
      nameservers: data.data?.nameservers
    });
  } catch (error: any) {
    console.error('Error adding domain:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add domain' },
      { status: 500 }
    );
  }
}