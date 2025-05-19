import { NextResponse } from 'next/server';
import { adminDb } from '@/config/firebase-admin';

export async function GET(request: Request) {
  try {
    // Get jobId from URL search params
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get job document using admin SDK
    const jobRef = adminDb.collection('generation_jobs').doc(jobId);
    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const jobData = jobDoc.data();

    return NextResponse.json({
      success: true,
      job: {
        id: jobId,
        ...jobData,
      },
    });
  } catch (error: any) {
    console.error('Error fetching job status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job status' },
      { status: 500 }
    );
  }
}
