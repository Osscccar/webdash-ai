"use client";

import { useState, useRef } from "react";
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
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isGeneratingRef = useRef(false); // Add this to track generation state
  const [generationProgress, setGenerationProgress] = useState({
    step: 0,
    totalSteps: 3, // Simplified steps to match the API flow
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
      totalSteps: 3, // Simplified to 3 steps: start, create website, generate AI site
      currentStep,
      progress: progress,
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
    // Prevent duplicate website creation
    if (isGeneratingRef.current) {
      console.log(
        "Website generation already in progress, skipping duplicate call"
      );
      return null;
    }

    isGeneratingRef.current = true;
    setIsLoading(true);
    updateGenerationProgress(0, GenerationStep.CREATING_SITE, "processing", 0);

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

      // Using the API docs flow: create website then apply AI
      const result = await tenwebApi.generateWebsiteFromPrompt({
        prompt,
        subdomain,
        region: "us-central1-c",
        siteTitle: params?.websiteTitle || businessName,
        businessType,
        businessName,
        businessDescription,
        adminPassword: "Password1Ab", // Hard-coded password that meets requirements
        onProgress: updateGenerationProgress,
      });

      // Create a website object based on the result
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
        } catch (error) {
          console.error("Failed to update user profile:", error);
        }
      }

      // Update progress to complete
      updateGenerationProgress(3, GenerationStep.FINALIZING, "complete", 100);

      toast({
        title: "Website generated successfully",
        description: "Your website is ready to view and edit.",
      });

      return website;
    } catch (error: any) {
      console.error("Error generating website:", error);

      updateGenerationProgress(0, GenerationStep.CREATING_SITE, "error", 0);

      toast({
        title: "Error generating website",
        description: error.message || "Please try again later",
        variant: "destructive",
      });

      return null;
    } finally {
      setIsLoading(false);
      isGeneratingRef.current = false; // Reset the generation flag
    }
  };

  /**
   * Get WP autologin token for a website
   * This requires authentication
   */
  const getWPAutologinToken = async (domainId: number, adminUrl: string) => {
    if (!user) {
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
