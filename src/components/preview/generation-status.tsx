'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GenerationProgress } from '@/components/generate/generation-progress';
import { GenerationStep } from '@/types';
import { useToast } from '@/components/ui/use-toast';

// Helper function to generate unique job ID
const generateJobId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `job_${timestamp}_${randomStr}`;
};

interface GenerationStatusProps {
  jobId: string;
  onComplete: (data: any) => void;
  onCancel?: () => void;
  onRetry?: (newJobId: string) => void;
}

export function GenerationStatus({
  jobId,
  onComplete,
  onCancel,
  onRetry,
}: GenerationStatusProps) {
  const { toast } = useToast();
  const [estimatedTime, setEstimatedTime] = useState<number>(120); // 2 minutes in seconds
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false); // Start false until job is verified
  const [verifyingJob, setVerifyingJob] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [generationProgress, setGenerationProgress] = useState({
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

  // Keep original generation parameters to use for retries
  const [generationParams, setGenerationParams] = useState<any>(null);

  // Handle local cancellation - we don't update Firestore
  const handleCancel = useCallback(() => {
    // Just stop polling and update local state
    setIsPolling(false);
    setGenerationProgress({
      step: 0,
      totalSteps: 7,
      currentStep: GenerationStep.CREATING_SITE,
      progress: 0,
      status: 'cancelled',
    });

    // Clear polling interval
    if (pollingTimeoutRef.current) {
      clearInterval(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }

    // Call parent cancel handler if provided
    if (onCancel) {
      onCancel();
    }

    toast({
      title: 'Generation cancelled',
      description: 'Website generation has been cancelled',
    });
  }, [onCancel, toast]);

  // Handle retry with the same parameters but a new job ID
  const handleRetry = async () => {
    if (!generationParams) {
      // If we don't have generation parameters, just reload the page
      window.location.reload();
      return;
    }

    setIsRetrying(true);
    try {
      // Generate a new job ID
      const newJobId = generateJobId();

      // Copy the saved parameters and update the job ID
      const newParams = {
        ...generationParams,
        jobId: newJobId,
      };

      // Start the new job
      console.log('Retrying with new job ID:', newJobId);
      const response = await fetch('/api/start-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newParams),
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

      // Update localStorage with the new job ID
      localStorage.setItem('webdash_job_id', newJobId);

      // Tell the parent component to switch to the new job ID
      if (onRetry) {
        onRetry(newJobId);
      } else {
        // As a fallback, reload the page
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Error retrying job:', error);
      toast({
        title: 'Error retrying generation',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
      setIsRetrying(false);
    }
  };

  // First, verify that the job exists
  useEffect(() => {
    const verifyJobExists = async () => {
      if (!jobId) return;

      try {
        console.log('Verifying job exists before polling:', jobId);
        const response = await fetch(`/api/job-status?jobId=${jobId}`);

        if (!response.ok) {
          console.error('Error verifying job:', response.status);
          // Job doesn't exist or error fetching
          setError('Job does not exist or cannot be accessed');
          setIsPolling(false);
          setVerifyingJob(false);

          // Notify parent to handle the situation
          if (onCancel) {
            onCancel();
          }
          return;
        }

        const data = await response.json();
        if (!data.job) {
          console.log('Job not found, may still be starting...');
          // Give it a moment to appear in the database
          setTimeout(() => verifyJobExists(), 2000);
          return;
        }

        // Save the generation parameters for potential retries
        if (data.job.prompt || data.job.businessName) {
          setGenerationParams({
            jobId: data.job.jobId,
            prompt: data.job.prompt,
            businessType: data.job.businessType,
            businessName: data.job.businessName,
            businessDescription: data.job.businessDescription,
            websiteTitle: data.job.websiteTitle,
            websiteDescription: data.job.websiteDescription,
            websiteKeyphrase: data.job.websiteKeyphrase,
            colors: data.job.colors,
            fonts: data.job.fonts,
            pagesMeta: data.job.pagesMeta,
            subdomain: data.job.subdomain,
          });
        }

        // If the job is already failed, update the UI
        if (data.job.status === 'failed') {
          setError(data.job.error || 'Failed to generate website');
          setGenerationProgress({
            step: 0,
            totalSteps: 7,
            currentStep: GenerationStep.CREATING_SITE,
            progress: 0,
            status: 'error',
          });
          setVerifyingJob(false);
          setIsPolling(false);
          return;
        }

        // If the job is already completed, process it immediately
        if (data.job.status === 'complete' || data.job.status === 'completed') {
          console.log('Job already completed:', data.job);

          // Get the site URL from the response
          const siteUrl = data.job.site_url || data.job.siteUrl;

          if (siteUrl) {
            setGenerationProgress({
              step: 7,
              totalSteps: 7,
              currentStep: GenerationStep.FINALIZING,
              progress: 100,
              status: 'complete',
            });

            const websiteData = {
              jobId: jobId,
              siteUrl: siteUrl,
              subdomain: data.job.subdomain,
              createdAt: new Date().toISOString(),
              status: 'active',
              domainId: data.job.domain_id || data.job.domainId,
            };

            localStorage.setItem(
              'webdash_website',
              JSON.stringify(websiteData)
            );

            setVerifyingJob(false);
            setIsPolling(false);

            // Call onComplete callback with the website data
            onComplete(websiteData);
            return;
          }
        }

        // Job exists, we can start polling
        console.log('Job verified, starting to poll:', data.job);
        setIsPolling(true);
        setVerifyingJob(false);
      } catch (error) {
        console.error('Error verifying job:', error);
        setError('Error connecting to the server');
        setIsPolling(false);
        setVerifyingJob(false);

        if (onCancel) {
          onCancel();
        }
      }
    };

    verifyJobExists();
  }, [jobId, onCancel]);

  // Countdown timer for estimated time
  useEffect(() => {
    if (
      estimatedTime > 0 &&
      isPolling &&
      generationProgress.status === 'processing'
    ) {
      const timer = setTimeout(() => {
        setEstimatedTime((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [estimatedTime, isPolling, generationProgress.status]);

  // Start polling for job status only after job is verified
  useEffect(() => {
    if (!jobId || !isPolling) return;

    console.log('Starting to poll job status for:', jobId);
    let retryCount = 0;
    const maxRetries = 3;

    const checkJobStatus = async () => {
      try {
        console.log(`Polling job status: ${jobId}`);
        const response = await fetch(`/api/job-status?jobId=${jobId}`);

        if (!response.ok) {
          console.error(`Error fetching job status: ${response.status}`);
          retryCount++;

          if (retryCount >= maxRetries) {
            setError('Failed to get job status after multiple attempts');
            setIsPolling(false);
            if (pollingTimeoutRef.current) {
              clearInterval(pollingTimeoutRef.current);
              pollingTimeoutRef.current = null;
            }
          }
          return;
        }

        // Reset retry counter on successful response
        retryCount = 0;

        const data = await response.json();
        const jobData = data.job;

        if (!jobData) {
          console.log('Job not found yet, waiting...');
          return;
        }

        console.log(
          'Job status:',
          jobData.status,
          'Progress:',
          jobData.progress
        );

        // Save the generation parameters for potential retries if they exist
        if (jobData.prompt || jobData.businessName) {
          setGenerationParams({
            jobId: jobData.jobId,
            prompt: jobData.prompt,
            businessType: jobData.businessType,
            businessName: jobData.businessName,
            businessDescription: jobData.businessDescription,
            websiteTitle: jobData.websiteTitle,
            websiteDescription: jobData.websiteDescription,
            websiteKeyphrase: jobData.websiteKeyphrase,
            colors: jobData.colors,
            fonts: jobData.fonts,
            pagesMeta: jobData.pagesMeta,
            subdomain: jobData.subdomain,
          });
        }

        // Update progress based on job status
        if (jobData.status === 'processing') {
          // Map progress to steps
          let currentStep = GenerationStep.CREATING_SITE;
          let stepNumber = 0;

          if (jobData.progress <= 20) {
            currentStep = GenerationStep.CREATING_SITE;
            stepNumber = 0;
          } else if (jobData.progress <= 40) {
            currentStep = GenerationStep.GENERATING_SITEMAP;
            stepNumber = 1;
          } else if (jobData.progress <= 60) {
            currentStep = GenerationStep.DESIGNING_PAGES;
            stepNumber = 2;
          } else if (jobData.progress <= 80) {
            currentStep = GenerationStep.OPTIMIZING_FOR_DEVICES;
            stepNumber = 3;
          } else {
            currentStep = GenerationStep.FINALIZING;
            stepNumber = 4;
          }

          setGenerationProgress({
            step: stepNumber,
            totalSteps: 7,
            currentStep,
            progress: jobData.progress,
            status: 'processing',
          });
        } else if (
          jobData.status === 'complete' ||
          jobData.status === 'completed'
        ) {
          // Job is complete
          console.log('Job completed successfully:', jobData);

          setGenerationProgress({
            step: 7,
            totalSteps: 7,
            currentStep: GenerationStep.FINALIZING,
            progress: 100,
            status: 'complete',
          });

          // Get the site URL from the response
          const siteUrl = jobData.site_url || jobData.siteUrl;

          // Store the site URL and other data
          if (siteUrl) {
            const websiteData = {
              jobId: jobId,
              siteUrl: siteUrl,
              subdomain: jobData.subdomain,
              createdAt: new Date().toISOString(),
              status: 'active',
              domainId: jobData.domain_id || jobData.domainId,
            };

            console.log('Saving website data and redirecting:', websiteData);

            localStorage.setItem(
              'webdash_website',
              JSON.stringify(websiteData)
            );

            // Stop polling
            setIsPolling(false);
            if (pollingTimeoutRef.current) {
              clearInterval(pollingTimeoutRef.current);
              pollingTimeoutRef.current = null;
            }

            // Call onComplete callback with the website data
            onComplete(websiteData);
          } else {
            console.error(
              'Job marked as complete but no site URL found:',
              jobData
            );
            setError('Website generated but URL not found');
            setIsPolling(false);
            if (pollingTimeoutRef.current) {
              clearInterval(pollingTimeoutRef.current);
              pollingTimeoutRef.current = null;
            }
          }
        } else if (jobData.status === 'failed') {
          // Job failed
          setGenerationProgress({
            step: 0,
            totalSteps: 7,
            currentStep: GenerationStep.CREATING_SITE,
            progress: 0,
            status: 'error',
          });

          setError(jobData.error || 'Failed to generate website');
          setIsPolling(false);
          if (pollingTimeoutRef.current) {
            clearInterval(pollingTimeoutRef.current);
            pollingTimeoutRef.current = null;
          }

          toast({
            title: 'Generation Failed',
            description: jobData.error || 'Failed to generate website',
            variant: 'destructive',
          });
        } else if (jobData.status === 'cancelled') {
          setGenerationProgress({
            step: 0,
            totalSteps: 7,
            currentStep: GenerationStep.CREATING_SITE,
            progress: 0,
            status: 'cancelled',
          });

          setIsPolling(false);
          if (pollingTimeoutRef.current) {
            clearInterval(pollingTimeoutRef.current);
            pollingTimeoutRef.current = null;
          }

          if (onCancel) {
            onCancel();
          }
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        retryCount++;

        if (retryCount >= maxRetries) {
          setError('Failed to connect to the server after multiple attempts');
          setIsPolling(false);
          if (pollingTimeoutRef.current) {
            clearInterval(pollingTimeoutRef.current);
            pollingTimeoutRef.current = null;
          }
        }
      }
    };

    // Immediately check status once
    checkJobStatus();

    // Then set up the interval
    pollingTimeoutRef.current = setInterval(checkJobStatus, 2000);

    // Cleanup on unmount or when polling stops
    return () => {
      if (pollingTimeoutRef.current) {
        clearInterval(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    };
  }, [jobId, isPolling, onComplete, onCancel, toast]);

  // Format time from seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Render the component based on status
  return (
    <Card className="w-full shadow-sm">
      <CardContent className="p-6 space-y-6">
        {verifyingJob ? (
          // Verifying job state
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  Verifying job status
                </h2>
                <p className="text-gray-500 text-sm">
                  Please wait while we connect to your job...
                </p>
              </div>
            </div>
            <GenerationProgress
              progress={0}
              currentStep={GenerationStep.CREATING_SITE}
              step={0}
              totalSteps={7}
            />
          </div>
        ) : generationProgress.status === 'error' && error ? (
          // Error state
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  Generation Failed
                </h2>
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-gray-700 text-sm">This could be due to:</p>
              <ul className="list-disc list-inside text-gray-600 text-sm mt-2">
                <li>Temporary server issues</li>
                <li>API rate limiting</li>
                <li>Content restrictions in your prompt</li>
              </ul>
            </div>

            <Button
              className="w-full relative"
              onClick={handleRetry}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Restarting Generation...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again With Same Settings
                </>
              )}
            </Button>
          </div>
        ) : generationProgress.status === 'complete' ? (
          // Complete state
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  Website Generated!
                </h2>
                <p className="text-gray-500 text-sm">
                  Your website is ready to view.
                </p>
              </div>
            </div>
            <GenerationProgress
              progress={100}
              currentStep={GenerationStep.FINALIZING}
              step={7}
              totalSteps={7}
            />
          </div>
        ) : generationProgress.status === 'cancelled' ? (
          // Cancelled state
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-2 rounded-full">
                <AlertCircle className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  Generation Cancelled
                </h2>
                <p className="text-gray-500 text-sm">
                  The website generation was cancelled.
                </p>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleRetry}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Restarting Generation...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Start New Generation
                </>
              )}
            </Button>
          </div>
        ) : (
          // Processing state
          <>
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  Building Your Website
                </h2>
                <p className="text-gray-500 text-sm">
                  Estimated time remaining: {formatTime(estimatedTime)}
                </p>
              </div>
            </div>
            <GenerationProgress
              progress={generationProgress.progress}
              currentStep={generationProgress.currentStep}
              step={generationProgress.step}
              totalSteps={generationProgress.totalSteps}
            />
            {onCancel && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleCancel}
              >
                Cancel Generation
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
