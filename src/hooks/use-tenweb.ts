"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./use-auth";
import { useToast } from "@/components/ui/use-toast";
import tenwebApi from "@/lib/tenweb-api";
import { generateRandomSubdomain } from "@/lib/utils";
import { GenerationStep, UserWebsite, WebsiteGenerationParams } from "@/types";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/config/firebase";

// Option to enable mockMode for testing
const mockMode =
  process.env.NEXT_PUBLIC_USE_MOCK_API === "true" ||
  process.env.NODE_ENV === "development";

export function useTenWeb() {
  const router = useRouter();
  const { user, userData, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({
    step: 0,
    totalSteps: 7,
    currentStep: GenerationStep.CREATING_SITE,
    progress: 0,
    status: "pending" as "pending" | "processing" | "complete" | "error",
  });

  /**
   * Update the generation progress state
   */
  const updateGenerationProgress = (
    step: number,
    currentStep: string,
    status: "pending" | "processing" | "complete" | "error",
    progress = 0
  ) => {
    setGenerationProgress({
      step,
      totalSteps: 7,
      currentStep,
      progress: progress || (step / 7) * 100,
      status,
    });
  };

  /**
   * Generate a website from a prompt
   * No authentication required for this step
   */
  const generateWebsite = async (
    prompt: string,
    params?: Partial<WebsiteGenerationParams>
  ) => {
    setIsLoading(true);
    updateGenerationProgress(0, GenerationStep.CREATING_SITE, "processing");

    try {
      // Generate a random subdomain if not provided
      const businessNameInput = params?.businessName || "mywebsite";
      const sanitizedBusinessName = businessNameInput
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const subdomain = params?.businessName
        ? generateRandomSubdomain(sanitizedBusinessName)
        : generateRandomSubdomain("site");

      // Parse the prompt to extract business info
      const businessType = params?.businessType || "agency";
      const businessName = params?.businessName || "Creative Solutions";
      const businessDescription =
        params?.businessDescription ||
        prompt ||
        "A modern agency providing creative solutions.";

      // Store website generation information in localStorage for the preview
      const siteInfo = {
        businessType,
        businessName,
        businessDescription,
        websiteTitle: params?.websiteTitle || businessName,
        websiteDescription: businessDescription,
        websiteKeyphrase: businessName.toLowerCase().split(" ").join(" "),
      };

      localStorage.setItem("webdash_prompt", prompt);
      localStorage.setItem("webdash_site_info", JSON.stringify(siteInfo));
      localStorage.setItem("webdash_subdomain", subdomain);

      updateGenerationProgress(
        1,
        GenerationStep.CREATING_SITE,
        "processing",
        20
      );

      // Call the 10Web API to generate the website
      let result;

      try {
        result = await tenwebApi.generateWebsiteFromPrompt({
          prompt,
          subdomain,
          region: "us-central1",
          siteTitle: params?.websiteTitle || businessName,
          businessType,
          businessName,
          businessDescription,
          onProgress: (step, message, progress) => {
            let currentStep = GenerationStep.CREATING_SITE;

            switch (step) {
              case 1:
                currentStep = GenerationStep.CREATING_SITE;
                break;
              case 2:
                currentStep = GenerationStep.GENERATING_SITEMAP;
                break;
              case 3:
                currentStep = GenerationStep.DESIGNING_PAGES;
                break;
              case 4:
                currentStep = GenerationStep.FINALIZING;
                break;
              default:
                currentStep = GenerationStep.CREATING_SITE;
            }

            updateGenerationProgress(step, currentStep, "processing", progress);
          },
        });
      } catch (error) {
        console.error("Error in API call:", error);

        if (mockMode) {
          console.log("Using mock data due to API error");
          // Simulate successful generation with mock data
          result = {
            success: true,
            domainId: 12345,
            sitemapData: {},
            uniqueId: `mock_${Math.random().toString(36).substring(2, 10)}`,
            url: `https://${subdomain}.10web.site`,
          };

          // Simulate progress
          for (let i = 2; i <= 7; i++) {
            const step = i;
            const progress = (step / 7) * 100;
            let currentStep = GenerationStep.CREATING_SITE;

            switch (step) {
              case 2:
                currentStep = GenerationStep.GENERATING_SITEMAP;
                break;
              case 3:
                currentStep = GenerationStep.DESIGNING_PAGES;
                break;
              case 4:
                currentStep = GenerationStep.SETTING_UP_NAVIGATION;
                break;
              case 5:
                currentStep = GenerationStep.OPTIMIZING_FOR_DEVICES;
                break;
              case 6:
                currentStep = GenerationStep.BOOSTING_SPEED;
                break;
              case 7:
                currentStep = GenerationStep.FINALIZING;
                break;
            }

            // Update progress with a slight delay for each step
            setTimeout(() => {
              updateGenerationProgress(
                step,
                currentStep,
                "processing",
                progress
              );

              if (step === 7) {
                updateGenerationProgress(
                  7,
                  GenerationStep.FINALIZING,
                  "complete",
                  100
                );
              }
            }, (i - 1) * 1000);
          }
        } else {
          throw error;
        }
      }

      // Create a website object
      const website: UserWebsite = {
        id: `website-${Date.now()}`,
        domainId: result.domainId || 12345,
        subdomain,
        siteUrl: result.url || `https://${subdomain}.10web.site`,
        title: businessName,
        description: businessDescription,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        status: "active",
        unique_id: result.uniqueId,
      };

      // Store the website data in localStorage for later access after auth
      localStorage.setItem("webdash_website", JSON.stringify(website));

      // Only update Firestore if user is logged in
      if (user && userData) {
        try {
          const websiteDocRef = doc(db, "websites", website.id);
          await setDoc(websiteDocRef, {
            ...website,
            userId: user.uid,
          });

          // Update user's website list
          const websites = userData.websites || [];
          await updateUserProfile({
            websites: [...websites, website],
          });
        } catch (error) {
          console.error("Failed to update user profile:", error);
        }
      }

      // Update generation progress
      updateGenerationProgress(6, GenerationStep.FINALIZING, "complete", 100);

      toast({
        title: "Website generated successfully",
        description: "Your website is ready to view and edit.",
      });

      return website;
    } catch (error: any) {
      console.error("Error generating website:", error);

      updateGenerationProgress(0, GenerationStep.CREATING_SITE, "error");

      toast({
        title: "Error generating website",
        description: error.message || "Please try again later",
        variant: "destructive",
      });

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get WP autologin token for a website
   * This does require authentication
   */
  const getWPAutologinToken = async (domainId: number, adminUrl: string) => {
    if (!user && !mockMode) {
      toast({
        title: "Authentication required",
        description: "Please sign in to access WordPress dashboard",
        variant: "destructive",
      });

      router.push(`/login?redirect=${encodeURIComponent("/dashboard")}`);
      return null;
    }

    setIsLoading(true);

    try {
      let token;

      try {
        const result = await tenwebApi.getWPAutologinToken({
          domainId,
          adminUrl,
        });
        token = result.token;
      } catch (error) {
        console.error("Error getting WP autologin token:", error);

        if (mockMode) {
          // Generate a mock token for testing
          token = `mock_token_${Math.random().toString(36).substring(2, 15)}`;
        } else {
          throw error;
        }
      }

      return token;
    } catch (error: any) {
      console.error("Error getting WP autologin token:", error);

      toast({
        title: "Error accessing WordPress dashboard",
        description: error.message || "Please try again later",
        variant: "destructive",
      });

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateWebsite,
    getWPAutologinToken,
    generationProgress,
    isLoading,
  };
}

// Default export for compatibility
export default useTenWeb;
