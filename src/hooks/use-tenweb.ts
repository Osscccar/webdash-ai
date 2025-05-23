// src/hooks/use-tenweb.ts

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './use-auth';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';
import { generateRandomSubdomain } from '@/lib/utils';
import { GenerationStep, UserWebsite } from '@/types';
import { db } from '@/config/firebase';
import {
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';

export function useTenWeb() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const pollingRef = useRef<{ jobId: string | null; isPolling: boolean }>({
    jobId: null,
    isPolling: false,
  });
  const [isCancelled, setIsCancelled] = useState(false);
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

  /**
   * Update the generation progress state
   */
  const updateGenerationProgress = (
    step: number,
    currentStep: GenerationStep,
    status: 'pending' | 'processing' | 'complete' | 'error' | 'cancelled',
    progress = 0
  ) => {
    setGenerationProgress({
      step,
      totalSteps: 7,
      currentStep,
      progress: progress,
      status,
    });
  };

  /**
   * Poll for website generation status
   * This should only be called after a job has been started
   */
  const pollGenerationStatus = async (jobId: string, generationParams: any) => {
    // Only allow polling if we're not already polling a different job
    if (pollingRef.current.isPolling && pollingRef.current.jobId !== jobId) {
      console.log('Already polling a different job, skipping');
      return null;
    }

    // If we're already polling this job, continue
    if (pollingRef.current.jobId === jobId && pollingRef.current.isPolling) {
      console.log('Already polling this job, continuing');
      return null;
    }

    // Start polling this job
    pollingRef.current = { jobId, isPolling: true };
    setIsLoading(true);
    setIsCancelled(false);
    updateGenerationProgress(0, GenerationStep.CREATING_SITE, 'processing', 0);

    try {
      console.log('Starting to poll for website generation status:', jobId);

      // Start polling for status
      let isComplete = false;
      let retryCount = 0;
      let notFoundRetries = 0;
      let consecutiveErrors = 0;
      const maxRetries = 120;
      const maxNotFoundRetries = 10;
      const maxConsecutiveErrors = 5;
      const notFoundRetryDelay = 2000;
      const errorRetryDelay = 1000;

      while (!isComplete && retryCount < maxRetries && !isCancelled) {
        try {
          // Wait between checks
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Check job status
          const statusResponse = await axios.get(
            `/api/job-status?jobId=${jobId}`
          );
          const jobData = statusResponse.data.job;

          // Reset error counters on successful response
          consecutiveErrors = 0;
          notFoundRetries = 0;

          if (!jobData) {
            console.log(
              `Job not found, retry ${
                notFoundRetries + 1
              }/${maxNotFoundRetries}`
            );
            notFoundRetries++;

            if (notFoundRetries >= maxNotFoundRetries) {
              throw new Error('Job not found after maximum retries');
            }

            await new Promise((resolve) =>
              setTimeout(resolve, notFoundRetryDelay)
            );
            continue;
          }

          if (jobData.status === 'complete') {
            isComplete = true;
            // Get the workspace ID from localStorage if available
            const storedWorkspaceId = localStorage.getItem("webdash_current_workspace");
            
            const website: UserWebsite = {
              id: jobId,
              userId: user?.uid || '',
              workspaceId: storedWorkspaceId || 'default-workspace',
              domainId: jobData.domainId || Date.now(),
              subdomain: jobData.subdomain,
              siteUrl: jobData.siteUrl,
              title: generationParams.businessName,
              description: generationParams.businessDescription,
              createdAt: new Date().toISOString(),
              lastModified: new Date().toISOString(),
              status: 'active',
              generationParams: {
                prompt: generationParams.prompt,
                ...generationParams,
              },
            };

            // Store the website data in localStorage
            localStorage.setItem('webdash_website', JSON.stringify(website));

            // Only update Firestore if user is logged in
            if (user && user.uid) {
              try {
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                  websites: arrayUnion(website),
                  updatedAt: serverTimestamp(),
                });
              } catch (error) {
                console.error('Failed to save website to Firestore:', error);
              }
            }

            toast({
              title: 'Website created successfully',
              description: 'Your website is ready to view!',
            });

            return website;
          } else if (jobData.status === 'failed') {
            throw new Error(jobData.error || 'Website generation failed');
          } else if (jobData.status === 'cancelled') {
            setIsCancelled(true);
            throw new Error('Website generation was cancelled');
          }

          // Update progress based on job status
          if (jobData.status === 'processing') {
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

            updateGenerationProgress(
              stepNumber,
              currentStep,
              'processing',
              jobData.progress
            );
          }

          retryCount++;
        } catch (error: any) {
          console.error('Error checking generation status:', error);

          if (isCancelled) {
            throw new Error('Website generation was cancelled');
          }

          // Handle specific error cases
          if (
            error.response?.status === 404 ||
            error.message?.includes('Job not found')
          ) {
            notFoundRetries++;
            console.log(
              `Job not found, retry ${notFoundRetries}/${maxNotFoundRetries}`
            );

            if (notFoundRetries >= maxNotFoundRetries) {
              console.error('Job not found after maximum retries');
              throw new Error('Job not found after maximum retries');
            }

            await new Promise((resolve) =>
              setTimeout(resolve, notFoundRetryDelay)
            );
            continue;
          }

          // Handle other errors
          consecutiveErrors++;
          console.log(
            `Consecutive errors: ${consecutiveErrors}/${maxConsecutiveErrors}`
          );

          if (consecutiveErrors >= maxConsecutiveErrors) {
            console.error('Too many consecutive errors');
            throw new Error(
              'Too many consecutive errors while checking job status'
            );
          }

          await new Promise((resolve) => setTimeout(resolve, errorRetryDelay));
          retryCount++;
        }
      }

      if (!isComplete && !isCancelled) {
        throw new Error('Website generation timed out');
      }

      return null;
    } catch (error: any) {
      console.error('Error polling website generation:', error);
      updateGenerationProgress(
        0,
        GenerationStep.CREATING_SITE,
        isCancelled ? 'cancelled' : 'error',
        0
      );

      // Don't throw the error, just return null and let the component handle it
      return null;
    } finally {
      // Only reset polling state if this is the current job
      if (pollingRef.current.jobId === jobId) {
        pollingRef.current = { jobId: null, isPolling: false };
      }
      setIsLoading(false);
    }
  };

  /**
   * Get WP autologin token for a website
   * This requires authentication
   */
  const getWPAutologinToken = async (domainId: number, adminUrl: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to access WordPress dashboard',
        variant: 'destructive',
      });

      router.push(`/login?redirect=${encodeURIComponent('/dashboard')}`);
      return null;
    }

    setIsLoading(true);

    try {
      const response = await axios.get(
        `/api/tenweb/account/domains/${domainId}/single?admin_url=${encodeURIComponent(
          adminUrl
        )}`
      );
      return response.data.token;
    } catch (error: any) {
      console.error('Error getting WP autologin token:', error);

      toast({
        title: 'Error accessing WordPress dashboard',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Add cancel function
  const cancelGeneration = async (jobId: string) => {
    if (!jobId) return;

    try {
      await axios.post('/api/update-job-status', {
        jobId,
        status: 'cancelled',
        error: 'Job cancelled by user',
      });

      setIsCancelled(true);
      updateGenerationProgress(0, GenerationStep.CREATING_SITE, 'cancelled', 0);

      toast({
        title: 'Generation cancelled',
        description: 'Website generation has been cancelled',
      });
    } catch (error) {
      console.error('Error cancelling generation:', error);
    }
  };

  return {
    pollGenerationStatus,
    getWPAutologinToken,
    generationProgress,
    isLoading,
    cancelGeneration,
    isCancelled,
  };
}

// Default export for compatibility
export default useTenWeb;
