"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { GenerationStep } from "@/types";

// Helper function to generate unique job ID
const generateJobId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `job_${timestamp}_${randomStr}`;
};

// Detailed substeps for each generation step
const GENERATION_SUBSTEPS: Record<string, string[]> = {
  [GenerationStep.CREATING_SITE]: [
    "Setting up website infrastructure",
    "Configuring server environment",
  ],
  [GenerationStep.GENERATING_SITEMAP]: [
    "Analyzing website structure",
    "Planning page hierarchy",
  ],
  [GenerationStep.DESIGNING_PAGES]: [
    "Creating responsive layouts",
    "Applying design styles",
  ],
  [GenerationStep.SETTING_UP_NAVIGATION]: [
    "Building navigation menus",
    "Connecting page links",
  ],
  [GenerationStep.OPTIMIZING_FOR_DEVICES]: [
    "Fine-tuning mobile experience",
    "Adjusting desktop layouts",
  ],
  [GenerationStep.BOOSTING_SPEED]: [
    "Optimizing asset delivery",
    "Enabling content caching",
  ],
  [GenerationStep.FINALIZING]: [
    "Polishing visual details",
    "Activating features",
  ],
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
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [verifyingJob, setVerifyingJob] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [generationProgress, setGenerationProgress] = useState({
    step: 0,
    totalSteps: 7,
    currentStep: GenerationStep.CREATING_SITE,
    progress: 0,
    status: "pending" as
      | "pending"
      | "processing"
      | "complete"
      | "error"
      | "cancelled",
    substep: 0, // Track which substep we're on
  });

  // Keep original generation parameters to use for retries
  const [generationParams, setGenerationParams] = useState<any>(null);

  // Reference to actual API-reported progress
  const actualProgressRef = useRef(0);

  // Handle local cancellation
  const handleCancel = useCallback(() => {
    setIsPolling(false);
    setGenerationProgress({
      step: 0,
      totalSteps: 7,
      currentStep: GenerationStep.CREATING_SITE,
      progress: 0,
      status: "cancelled",
      substep: 0,
    });

    if (pollingTimeoutRef.current) {
      clearInterval(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }

    if (onCancel) onCancel();

    toast({
      title: "Generation cancelled",
      description: "Website generation has been cancelled",
    });
  }, [onCancel, toast]);

  // Handle retry with the same parameters but a new job ID
  const handleRetry = async () => {
    if (!generationParams) {
      window.location.reload();
      return;
    }

    setIsRetrying(true);
    try {
      const newJobId = generateJobId();
      const newParams = { ...generationParams, jobId: newJobId };

      const response = await fetch("/api/start-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newParams),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to start website generation"
        );
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to start website generation");
      }

      localStorage.setItem("webdash_job_id", newJobId);

      if (onRetry) {
        onRetry(newJobId);
      } else {
        window.location.reload();
      }
    } catch (error: any) {
      console.error("Error retrying job:", error);
      toast({
        title: "Error retrying generation",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
      setIsRetrying(false);
    }
  };

  // First, verify that the job exists
  useEffect(() => {
    const verifyJobExists = async () => {
      if (!jobId) return;

      try {
        console.log("Verifying job exists before polling:", jobId);
        const response = await fetch(`/api/job-status?jobId=${jobId}`);

        if (!response.ok) {
          console.error("Error verifying job:", response.status);
          setError("Job does not exist or cannot be accessed");
          setIsPolling(false);
          setVerifyingJob(false);
          if (onCancel) onCancel();
          return;
        }

        const data = await response.json();
        if (!data.job) {
          console.log("Job not found, may still be starting...");
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
        if (data.job.status === "failed") {
          setError(data.job.error || "Failed to generate website");
          setGenerationProgress({
            step: 0,
            totalSteps: 7,
            currentStep: GenerationStep.CREATING_SITE,
            progress: 0,
            status: "error",
            substep: 0,
          });
          setVerifyingJob(false);
          setIsPolling(false);
          return;
        }

        // If the job is already completed, process it immediately
        if (data.job.status === "complete" || data.job.status === "completed") {
          console.log("Job already completed:", data.job);

          // Get the site URL from the response
          const siteUrl = data.job.site_url || data.job.siteUrl;

          if (siteUrl) {
            setGenerationProgress({
              step: 7,
              totalSteps: 7,
              currentStep: GenerationStep.FINALIZING,
              progress: 100,
              status: "complete",
              substep: 1,
            });

            // ✅ Get or create default workspace for new users
            let workspaceId = localStorage.getItem("webdash_current_workspace");
            
            if (!workspaceId) {
              // For new users, we need to ensure they have a default workspace
              // This will be handled when they first access the dashboard
              workspaceId = "pending-workspace-assignment";
            }

            const websiteData = {
              jobId: jobId,
              siteUrl: siteUrl,
              subdomain: data.job.subdomain,
              createdAt: new Date().toISOString(),
              status: "active",
              domainId: data.job.domain_id || data.job.domainId,
              workspaceId: workspaceId,
            };

            localStorage.setItem(
              "webdash_website",
              JSON.stringify(websiteData)
            );
            setVerifyingJob(false);
            setIsPolling(false);
            onComplete(websiteData);
            return;
          }
        }

        // Job exists, start polling
        console.log("Job verified, starting to poll:", data.job);
        setIsPolling(true);
        setVerifyingJob(false);
      } catch (error) {
        console.error("Error verifying job:", error);
        setError("Error connecting to the server");
        setIsPolling(false);
        setVerifyingJob(false);
        if (onCancel) onCancel();
      }
    };

    verifyJobExists();
  }, [jobId, onCancel, onComplete]);

  // Set up polling for job status
  useEffect(() => {
    if (!jobId || !isPolling) return;

    // 1. Set up display progression
    // Assuming about 3 minutes total (180 seconds)
    // 7 steps = ~25 seconds per step
    const secondsPerStep = 25;
    let startTime = Date.now();
    let currentDisplayStep = 0;
    let currentSubstep = 0;

    // Function to update display based on elapsed time
    const updateDisplayProgress = () => {
      const elapsedSeconds = (Date.now() - startTime) / 1000;

      // Calculate progress more smoothly
      const totalDuration = 7 * secondsPerStep;
      const overallProgress = Math.min(
        (elapsedSeconds / totalDuration) * 100,
        99
      );

      // Smooth progress transition
      setGenerationProgress((prev) => ({
        ...prev,
        progress: Math.max(prev.progress, overallProgress),
      }));

      // Calculate steps and substeps
      const estimatedStepFloat = elapsedSeconds / secondsPerStep;
      const estimatedStep = Math.floor(estimatedStepFloat);
      const estimatedSubstep = Math.floor(
        (estimatedStepFloat - estimatedStep) * 2
      );

      // Only move forward, never backward
      let shouldUpdateStep = false;

      if (
        estimatedStep > currentDisplayStep ||
        (estimatedStep === currentDisplayStep &&
          estimatedSubstep > currentSubstep)
      ) {
        shouldUpdateStep = true;
        currentDisplayStep = Math.min(estimatedStep, 6); // Max is step 6 (index)
        currentSubstep = estimatedSubstep % 2; // 0 or 1
      }

      if (shouldUpdateStep) {
        // Map step number to step name
        let stepName;
        switch (currentDisplayStep) {
          case 0:
            stepName = GenerationStep.CREATING_SITE;
            break;
          case 1:
            stepName = GenerationStep.GENERATING_SITEMAP;
            break;
          case 2:
            stepName = GenerationStep.DESIGNING_PAGES;
            break;
          case 3:
            stepName = GenerationStep.SETTING_UP_NAVIGATION;
            break;
          case 4:
            stepName = GenerationStep.OPTIMIZING_FOR_DEVICES;
            break;
          case 5:
            stepName = GenerationStep.BOOSTING_SPEED;
            break;
          case 6:
            stepName = GenerationStep.FINALIZING;
            break;
          default:
            stepName = GenerationStep.CREATING_SITE;
        }

        // Update the display
        setGenerationProgress((prev) => ({
          ...prev,
          step: currentDisplayStep,
          totalSteps: 7,
          currentStep: stepName,
          status: "processing",
          substep: currentSubstep,
        }));
      }
    };

    // Start display update timer
    const displayTimer = setInterval(updateDisplayProgress, 300); // More frequent updates for smoother animation

    // 2. Set up actual status polling from API
    const checkJobStatus = async () => {
      try {
        console.log(`Polling job status: ${jobId}`);
        const response = await fetch(`/api/job-status?jobId=${jobId}`);

        if (!response.ok) {
          console.error(`Error fetching job status: ${response.status}`);
          return;
        }

        const data = await response.json();
        const jobData = data.job;

        if (!jobData) {
          console.log("Job not found yet, waiting...");
          return;
        }

        console.log(
          "Job status:",
          jobData.status,
          "Progress:",
          jobData.progress
        );

        // Store the actual progress from the API
        if (jobData.progress) {
          actualProgressRef.current = jobData.progress;
        }

        // Save parameters for retry if needed
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

        // Check for completion
        if (jobData.status === "complete" || jobData.status === "completed") {
          // Job is complete - stop display timer and update to 100%
          clearInterval(displayTimer);

          setGenerationProgress((prev) => ({
            ...prev,
            step: 6, // Last step index
            totalSteps: 7,
            currentStep: GenerationStep.FINALIZING,
            progress: 100,
            status: "complete",
            substep: 1,
          }));

          // Get the site URL from the response
          const siteUrl = jobData.site_url || jobData.siteUrl;

          if (siteUrl) {
            // ✅ Get or create default workspace for new users
            let workspaceId = localStorage.getItem("webdash_current_workspace");
            
            if (!workspaceId) {
              // For new users, we need to ensure they have a default workspace
              // This will be handled when they first access the dashboard
              workspaceId = "pending-workspace-assignment";
            }

            const websiteData = {
              jobId: jobId,
              siteUrl: siteUrl,
              subdomain: jobData.subdomain,
              createdAt: new Date().toISOString(),
              status: "active",
              domainId: jobData.domain_id || jobData.domainId,
              workspaceId: workspaceId,
            };

            localStorage.setItem(
              "webdash_website",
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
              "Job marked as complete but no site URL found:",
              jobData
            );
            setError("Website generated but URL not found");
            setIsPolling(false);
            if (pollingTimeoutRef.current) {
              clearInterval(pollingTimeoutRef.current);
              pollingTimeoutRef.current = null;
            }
          }
        } else if (jobData.status === "failed") {
          // Job failed - stop display timer
          clearInterval(displayTimer);

          setGenerationProgress({
            step: 0,
            totalSteps: 7,
            currentStep: GenerationStep.CREATING_SITE,
            progress: 0,
            status: "error",
            substep: 0,
          });

          setError(jobData.error || "Failed to generate website");
          setIsPolling(false);
          if (pollingTimeoutRef.current) {
            clearInterval(pollingTimeoutRef.current);
            pollingTimeoutRef.current = null;
          }

          toast({
            title: "Generation Failed",
            description: jobData.error || "Failed to generate website",
            variant: "destructive",
          });
        } else if (jobData.status === "cancelled") {
          // Job cancelled - stop display timer
          clearInterval(displayTimer);

          setGenerationProgress({
            step: 0,
            totalSteps: 7,
            currentStep: GenerationStep.CREATING_SITE,
            progress: 0,
            status: "cancelled",
            substep: 0,
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
        console.error("Error polling job status:", error);
      }
    };

    // Immediately check status once
    checkJobStatus();

    // Then set up the interval - poll every 3 seconds
    pollingTimeoutRef.current = setInterval(checkJobStatus, 3000);

    // Cleanup
    return () => {
      clearInterval(displayTimer);
      if (pollingTimeoutRef.current) {
        clearInterval(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    };
  }, [jobId, isPolling, onComplete, onCancel, toast]);

  // Render the UI - Use explicit conditional rendering to avoid hook errors
  return (
    <Card className="w-full shadow-sm">
      <CardContent className="p-6 space-y-6">
        {/* Verifying state */}
        {verifyingJob && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  Building Your Website
                </h2>
                <p className="text-gray-500 text-sm">
                  This can take a few minutes. Please don't reload this tab.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-normal mb-1">
                <span className="text-gray-700">Generation Progress</span>
                <span className="text-gray-900 font-semibold">
                  {Math.round(generationProgress.progress)}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="relative h-2 rounded-full bg-gradient-to-r from-[#f58327] to-[#f5a363]"
                  style={{
                    width: `${generationProgress.progress}%`,
                    transition: "width 0.5s ease-in-out",
                  }}
                >
                  <div
                    className="absolute inset-0 bg-white opacity-10"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                      backgroundSize: "200% 100%",
                      animation: "shimmer 2s infinite linear",
                    }}
                  />
                </div>
              </div>
              <style jsx>{`
                @keyframes shimmer {
                  0% {
                    background-position: 200% 0;
                  }
                  100% {
                    background-position: -200% 0;
                  }
                }
              `}</style>
            </div>
          </div>
        )}

        {/* Error state */}
        {!verifyingJob && generationProgress.status === "error" && error && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-full">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </motion.div>
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
              className="w-full relative bg-[#f58327] hover:bg-[#f58327]/90 text-white cursor-pointer"
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
                  Try Again
                </>
              )}
            </Button>
          </div>
        )}

        {/* Complete state */}
        {!verifyingJob && generationProgress.status === "complete" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, rotate: -90 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ duration: 0.5, type: "spring" }}
                >
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </motion.div>
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
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-normal mb-1">
                <span className="text-gray-700">Generation Progress</span>
                <span className="text-gray-900 font-semibold">100%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-green-500 h-2 rounded-full"
                  initial={{ width: "99%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
            <div className="space-y-6">
              {[0, 1, 2, 3, 4, 5, 6].map((index) => {
                let stepName;
                switch (index) {
                  case 0:
                    stepName = GenerationStep.CREATING_SITE;
                    break;
                  case 1:
                    stepName = GenerationStep.GENERATING_SITEMAP;
                    break;
                  case 2:
                    stepName = GenerationStep.DESIGNING_PAGES;
                    break;
                  case 3:
                    stepName = GenerationStep.SETTING_UP_NAVIGATION;
                    break;
                  case 4:
                    stepName = GenerationStep.OPTIMIZING_FOR_DEVICES;
                    break;
                  case 5:
                    stepName = GenerationStep.BOOSTING_SPEED;
                    break;
                  case 6:
                    stepName = GenerationStep.FINALIZING;
                    break;
                  default:
                    stepName = GenerationStep.CREATING_SITE;
                }

                return (
                  <motion.div
                    key={index}
                    className="flex items-center space-x-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="flex-shrink-0">
                      <div className="bg-green-50 rounded-full p-1">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{stepName}</p>
                      <div className="text-xs text-gray-500 mt-1">
                        {GENERATION_SUBSTEPS[stepName].map((substep, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-1 mt-0.5"
                          >
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            <span>{substep}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cancelled state */}
        {!verifyingJob && generationProgress.status === "cancelled" && (
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
              className="w-full bg-[#f58327] hover:bg-[#f58327]/90 text-white cursor-pointer"
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
        )}

        {/* Processing state */}
        {!verifyingJob &&
          generationProgress.status !== "error" &&
          generationProgress.status !== "complete" &&
          generationProgress.status !== "cancelled" && (
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
                    This can take a few minutes. Please don't reload this tab.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm font-normal mb-1">
                  <span className="text-gray-700">Generation Progress</span>
                  <span className="text-gray-900 font-semibold">
                    {Math.round(generationProgress.progress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="relative h-2 rounded-full bg-gradient-to-r from-[#f58327] to-[#f5a363]"
                    style={{
                      width: `${generationProgress.progress}%`,
                      transition: "width 0.5s ease-in-out",
                    }}
                  >
                    <div
                      className="absolute inset-0 bg-white opacity-10"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer 2s infinite linear",
                      }}
                    />
                  </div>
                </div>
                <style jsx>{`
                  @keyframes shimmer {
                    0% {
                      background-position: 200% 0;
                    }
                    100% {
                      background-position: -200% 0;
                    }
                  }
                `}</style>
              </div>

              <div className="space-y-6">
                {[0, 1, 2, 3, 4, 5, 6].map((index) => {
                  const isCompleted = index < generationProgress.step;
                  const isActive = index === generationProgress.step;
                  const isPending = index > generationProgress.step;
                  let stepName;

                  switch (index) {
                    case 0:
                      stepName = GenerationStep.CREATING_SITE;
                      break;
                    case 1:
                      stepName = GenerationStep.GENERATING_SITEMAP;
                      break;
                    case 2:
                      stepName = GenerationStep.DESIGNING_PAGES;
                      break;
                    case 3:
                      stepName = GenerationStep.SETTING_UP_NAVIGATION;
                      break;
                    case 4:
                      stepName = GenerationStep.OPTIMIZING_FOR_DEVICES;
                      break;
                    case 5:
                      stepName = GenerationStep.BOOSTING_SPEED;
                      break;
                    case 6:
                      stepName = GenerationStep.FINALIZING;
                      break;
                    default:
                      stepName = GenerationStep.CREATING_SITE;
                  }

                  return (
                    <div
                      key={index}
                      className={`flex items-center space-x-3 transition-opacity duration-500 ${
                        isPending ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <div className="bg-green-50 rounded-full p-1">
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0, rotate: -90 }}
                              animate={{ scale: 1, opacity: 1, rotate: 0 }}
                              transition={{ duration: 0.3, type: "spring" }}
                            >
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            </motion.div>
                          </div>
                        ) : isActive ? (
                          <div className="bg-blue-50 rounded-full p-1">
                            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-200 rounded-full h-7 w-7"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-medium ${
                            isActive
                              ? "text-gray-900"
                              : isCompleted
                              ? "text-gray-900"
                              : "text-gray-500"
                          }`}
                        >
                          {stepName}
                        </p>

                        {/* Only render substeps if completed or active */}
                        {(isActive || isCompleted) && (
                          <div className="text-xs text-gray-500 mt-1">
                            {GENERATION_SUBSTEPS[stepName].map(
                              (substep, subIndex) => {
                                // For active step, only show substeps up to the current substep
                                if (
                                  isCompleted ||
                                  (isActive &&
                                    subIndex <= generationProgress.substep)
                                ) {
                                  return (
                                    <div
                                      key={subIndex}
                                      className="flex items-center gap-1 mt-0.5"
                                    >
                                      {isCompleted ||
                                      (isActive &&
                                        subIndex <
                                          generationProgress.substep) ? (
                                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                                      ) : (
                                        <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
                                      )}
                                      <span>{substep}</span>
                                    </div>
                                  );
                                }
                                return null;
                              }
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
      </CardContent>
    </Card>
  );
}
