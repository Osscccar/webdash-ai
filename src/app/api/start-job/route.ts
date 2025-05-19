import { NextResponse } from 'next/server';
import { adminDb } from '@/config/firebase-admin';
import { generateRandomSubdomain } from '@/lib/utils';

// Get n8n webhook URL and auth credentials from environment variables
const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL ||
  'http://localhost:5678/webhook/website-generation';
const N8N_USERNAME =
  process.env.NEXT_PUBLIC_N8N_WEBHOOK_USERNAME || 'n8n-webdashuser';
const N8N_PASSWORD = process.env.NEXT_PUBLIC_N8N_WEBHOOK_PASSWORD || '1234';

// Helper function to trigger n8n webhook with basic auth
async function triggerN8nWebhook(jobData: any) {
  try {
    // Create basic auth header
    const credentials = Buffer.from(`${N8N_USERNAME}:${N8N_PASSWORD}`).toString(
      'base64'
    );

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify(jobData),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error triggering n8n webhook:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { jobId, subdomain, ...jobDetails } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Validate subdomain format if provided
    if (subdomain) {
      const subdomainRegex = /^[a-z0-9-]+$/;
      if (!subdomainRegex.test(subdomain)) {
        return NextResponse.json(
          {
            error:
              'Invalid subdomain format. Use only lowercase letters, numbers, and hyphens.',
          },
          { status: 400 }
        );
      }
    }

    // Generate a subdomain if not provided
    const finalSubdomain =
      subdomain ||
      generateRandomSubdomain(jobDetails.businessName || 'website');

    // Check if job already exists using admin SDK
    const jobRef = adminDb.collection('generation_jobs').doc(jobId);
    const jobDoc = await jobRef.get();

    if (jobDoc.exists) {
      const existingJob = jobDoc.data();

      // If job exists but failed, allow restart
      if (existingJob?.status === 'failed') {
        await jobRef.set(
          {
            ...existingJob,
            status: 'pending',
            progress: 0,
            updatedAt: new Date().toISOString(),
            error: null,
          },
          { merge: true }
        );
      } else {
        return NextResponse.json(
          { error: 'Job already exists', jobId },
          { status: 409 }
        );
      }
    } else {
      // Create new job document using admin SDK
      await jobRef.set({
        jobId,
        subdomain: finalSubdomain,
        status: 'pending',
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...jobDetails,
      });
    }

    // Trigger n8n webhook to start generation
    await triggerN8nWebhook({
      jobId,
      subdomain: finalSubdomain,
      ...jobDetails,
    });

    return NextResponse.json({
      success: true,
      jobId,
      subdomain: finalSubdomain,
    });
  } catch (error: any) {
    console.error('Error starting job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start job' },
      { status: 500 }
    );
  }
}
