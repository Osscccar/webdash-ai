// src/components/preview/generation-popup.tsx

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GenerationProgress } from '@/components/generate/generation-progress';
import { GenerationStep } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ui/use-toast';
import FirestoreService from '@/lib/firestore-service';

// Helper function to generate unique job ID
const generateJobId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `job_${timestamp}_${randomStr}`;
};

interface GenerationPopupProps {
  siteInfo: any;
  onSuccess: (jobId: string) => void;
}

export function GenerationPopup({ siteInfo, onSuccess }: GenerationPopupProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [estimatedTime, setEstimatedTime] = useState<number>(180); // 3 minutes in seconds
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [progress, setProgress] = useState({
    step: 0,
    totalSteps: 7,
    currentStep: GenerationStep.CREATING_SITE,
    progress: 0,
    status: 'pending' as
      | 'pending'
      | 'processing'
      | 'complete'
      | 'error'
      | 'cancelled',
  });
  const hasStartedRef = useRef(false);

  // Countdown timer for estimated time
  useEffect(() => {
    if (progress.step > 0 && estimatedTime > 0) {
      const timer = setTimeout(() => {
        setEstimatedTime((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [estimatedTime, progress.step]);

  // Start job once when component mounts
  useEffect(() => {
    if (hasStartedRef.current || isStarting) return;

    const startJob = async () => {
      // Check for existing website
      const existingWebsite = localStorage.getItem('webdash_website');
      if (existingWebsite) {
        try {
          const website = JSON.parse(existingWebsite);
          if (website.siteUrl) {
            console.log(
              'Found existing website, skipping generation:',
              website
            );
            onSuccess(website.jobId || 'existing');
            return;
          }
        } catch (e) {
          console.error('Error parsing existing website:', e);
        }
      }

      try {
        setIsStarting(true);
        setError(null);
        setErrorDetails(null);
        hasStartedRef.current = true;

        // Prepare generation parameters
        const prompt = localStorage.getItem('webdash_prompt') || '';
        const savedColorsAndFonts = localStorage.getItem(
          'webdash_colors_fonts'
        );
        const colorAndFontData = savedColorsAndFonts
          ? JSON.parse(savedColorsAndFonts)
          : {
              colors: {
                primaryColor: '#f58327',
                secondaryColor: '#4a5568',
                backgroundDark: '#212121',
              },
              fonts: {
                primaryFont: 'Montserrat',
              },
            };

        // Get pages metadata
        const savedPagesMeta = localStorage.getItem('webdash_pages_meta');
        let pagesMeta = [];
        if (savedPagesMeta) {
          try {
            pagesMeta = JSON.parse(savedPagesMeta);
          } catch (error) {
            console.error('Error parsing pages metadata:', error);
          }
        }

        // Generate unique job ID
        const jobId = generateJobId();
        localStorage.setItem('webdash_job_id', jobId);

        // Prepare parameters
        const generationParams = {
          jobId,
          prompt,
          businessType: siteInfo?.businessType || 'agency',
          businessName: siteInfo?.businessName || 'Business Website',
          businessDescription:
            siteInfo?.businessDescription || prompt || 'A modern website.',
          websiteTitle: siteInfo?.websiteTitle || siteInfo?.businessName,
          websiteDescription:
            siteInfo?.websiteDescription || siteInfo?.businessDescription,
          websiteKeyphrase:
            siteInfo?.websiteKeyphrase || siteInfo?.businessName?.toLowerCase(),
          colors: colorAndFontData.colors,
          fonts: colorAndFontData.fonts,
          pagesMeta: pagesMeta,
        };

        // Store website generation information in localStorage
        localStorage.setItem('webdash_prompt', prompt);
        localStorage.setItem(
          'webdash_site_info',
          JSON.stringify({
            businessType: generationParams.businessType,
            businessName: generationParams.businessName,
            businessDescription: generationParams.businessDescription,
            websiteTitle: generationParams.websiteTitle,
            websiteDescription: generationParams.websiteDescription,
            websiteKeyphrase: generationParams.websiteKeyphrase,
            colors: generationParams.colors,
            fonts: generationParams.fonts,
          })
        );

        // Start the job
        console.log('Starting new job with params:', generationParams);
        const response = await fetch('/api/start-job', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(generationParams),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || 'Failed to start website generation'
          );
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to start website generation');
        }

        console.log('Job started successfully:', data);

        // Job started successfully, hand control to parent component for polling
        onSuccess(jobId);
      } catch (error: any) {
        console.error('Error generating website:', error);
        setError(error.message || 'An unexpected error occurred');
        if (error.details) {
          setErrorDetails(error.details);
        }
        toast({
          title: 'Website generation error',
          description: error.message || 'Please try again later',
          variant: 'destructive',
        });

        // Clear job ID on error
        localStorage.removeItem('webdash_job_id');

        // Reset the started flag so we can try again
        hasStartedRef.current = false;
        setIsStarting(false);
      }
    };

    startJob();
  }, [siteInfo, onSuccess, toast]);

  // Format time from seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle retry
  const handleRetry = () => {
    // Reset states
    setError(null);
    setErrorDetails(null);
    setIsStarting(false);
    hasStartedRef.current = false;

    // Reload the page to start fresh
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <Card className="w-full max-w-xl shadow-lg animate-fade-in">
        <CardContent className="p-6 space-y-8">
          {error ? (
            // Error state
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 p-2 rounded-full">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Website Generation Error
                  </h2>
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-gray-700 text-sm">
                  There was a problem generating your website. This could be due
                  to:
                </p>
                <ul className="list-disc list-inside text-gray-600 text-sm mt-2">
                  <li>Temporary 10Web API issues</li>
                  <li>Network connectivity problems</li>
                  <li>Server capacity issues</li>
                </ul>
              </div>

              {errorDetails && (
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-gray-700 text-sm font-medium">
                    Error details:
                  </p>
                  <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-auto max-h-32">
                    {JSON.stringify(errorDetails, null, 2)}
                  </pre>
                </div>
              )}

              <Button
                className="w-full bg-[#f58327] hover:bg-[#f58327]/90 cursor-pointer text-white"
                onClick={handleRetry}
              >
                Try Again
              </Button>
            </div>
          ) : (
            // Starting state
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gray-100 p-2 rounded-full">
                  <Loader2 className="h-5 w-5 text-gray-700 animate-spin" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Starting website generation
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Please wait while we prepare your website...
                  </p>
                </div>
              </div>

              <GenerationProgress
                progress={0}
                currentStep={GenerationStep.CREATING_SITE}
                step={0}
                totalSteps={7}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
