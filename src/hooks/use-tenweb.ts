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
   */
  const generateWebsite = async (
    prompt: string,
    params?: Partial<WebsiteGenerationParams>
  ) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to generate a website",
        variant: "destructive",
      });

      // Save prompt to localStorage and redirect to login
      localStorage.setItem("webdash_prompt", prompt);
      router.push("/auth/login?redirect=/generate");
      return null;
    }

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

      localStorage.setItem("webdash_site_info", JSON.stringify(siteInfo));
      localStorage.setItem("webdash_subdomain", subdomain);

      updateGenerationProgress(
        1,
        GenerationStep.CREATING_SITE,
        "processing",
        20
      );

      // Call the actual 10Web API - no mock data
      const result = await tenwebApi.generateWebsiteFromPrompt({
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

      // Create a website object to store in the user's profile
      const website: UserWebsite = {
        id: `website-${Date.now()}`,
        domainId: result.domainId,
        subdomain,
        siteUrl: result.url,
        title: businessName,
        description: businessDescription,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        status: "active",
        unique_id: result.uniqueId,
      };

      // Update the user's profile with the new website
      if (user && userData) {
        // Update Firestore
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
   */
  const getWPAutologinToken = async (domainId: number, adminUrl: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to access WordPress dashboard",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);

    try {
      const result = await tenwebApi.getWPAutologinToken({
        domainId,
        adminUrl,
      });
      return result.token;
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
