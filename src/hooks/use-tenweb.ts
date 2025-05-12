"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./use-auth";
import { useToast } from "@/components/ui/use-toast";
import tenwebApi from "@/lib/tenweb-api";
import { generateRandomSubdomain } from "@/lib/utils";
import { GenerationStep, UserWebsite } from "@/types";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/config/firebase";

export function useTenWeb() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isGeneratingRef = useRef(false); // Track generation state
  const [generationProgress, setGenerationProgress] = useState({
    step: 0,
    totalSteps: 7, // Match the steps in GenerationStep enum
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
      totalSteps: 7, // Match the steps in GenerationStep enum
      currentStep,
      progress: progress,
      status,
    });
  };

  /**
   * Generate a website from a prompt with full configuration
   */
  const generateWebsite = async (prompt: string, params: any) => {
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
      console.log("Starting website generation with parameters:", params);

      // Generate a random subdomain based on business name
      const businessNameInput = params?.businessName || "mywebsite";
      const sanitizedBusinessName = businessNameInput
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const subdomain = generateRandomSubdomain(sanitizedBusinessName);

      // Get required parameters from the passed configuration
      const businessType = params?.businessType || "agency";
      const businessName = params?.businessName || "Business Website";
      const businessDescription =
        params?.businessDescription || prompt || "A modern website.";
      const websiteTitle = params?.websiteTitle || businessName;
      const websiteDescription =
        params?.websiteDescription || businessDescription;
      const websiteKeyphrase =
        params?.websiteKeyphrase ||
        businessName.toLowerCase().split(" ").join(" ");

      // Store website generation information in localStorage for the preview
      const siteInfo = {
        businessType,
        businessName,
        businessDescription,
        websiteTitle,
        websiteDescription,
        websiteKeyphrase,
        colors: params?.colors,
        fonts: params?.fonts,
      };

      localStorage.setItem("webdash_prompt", prompt);
      localStorage.setItem("webdash_site_info", JSON.stringify(siteInfo));
      localStorage.setItem("webdash_subdomain", subdomain);

      // Step 1: Create the base website
      updateGenerationProgress(
        1,
        GenerationStep.CREATING_SITE,
        "processing",
        15
      );

      console.log("Creating base website with subdomain:", subdomain);

      const baseWebsite = await tenwebApi.createWebsite({
        subdomain,
        region: "us-central1-c", // Use a default region
        siteTitle: websiteTitle,
        adminUsername: `admin_${subdomain}`,
        adminPassword: "Password1Ab", // Using a password that meets requirements
      });

      if (!baseWebsite || !baseWebsite.data || !baseWebsite.data.domain_id) {
        throw new Error("Failed to create base website");
      }

      const domainId = baseWebsite.data.domain_id;
      console.log("Base website created with domain ID:", domainId);

      // Step 2: Generate the sitemap
      updateGenerationProgress(
        2,
        GenerationStep.GENERATING_SITEMAP,
        "processing",
        30
      );

      // Step 3-6: Design pages, navigation, device optimization, and speed
      // These steps are simulated in the UI but are handled by the AI Generate Site API
      updateGenerationProgress(
        3,
        GenerationStep.DESIGNING_PAGES,
        "processing",
        45
      );
      updateGenerationProgress(
        4,
        GenerationStep.SETTING_UP_NAVIGATION,
        "processing",
        60
      );
      updateGenerationProgress(
        5,
        GenerationStep.OPTIMIZING_FOR_DEVICES,
        "processing",
        70
      );

      // Step 7: Generate the AI site with all required parameters
      updateGenerationProgress(
        6,
        GenerationStep.BOOSTING_SPEED,
        "processing",
        80
      );

      console.log("Generating AI site for domain ID:", domainId);

      // Prepare complete parameters for the API
      const aiSiteParams = {
        domainId: domainId,
        businessType,
        businessName,
        businessDescription,
        websiteTitle,
        websiteDescription,
        websiteKeyphrase,
        websiteType: businessType,
        colors: params.colors,
        fonts: params.fonts,
      };

      const aiGenResult = await tenwebApi.generateAISite(aiSiteParams);

      if (!aiGenResult || !aiGenResult.data) {
        throw new Error("Failed to generate AI site");
      }

      // Create a website object based on the result
      const website: UserWebsite = {
        id: `website-${Date.now()}`,
        domainId: domainId,
        subdomain,
        siteUrl: aiGenResult.data.url || `https://${subdomain}.10web.site`,
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
          console.log("Website saved to Firestore");
        } catch (error) {
          console.error("Failed to save website to Firestore:", error);
        }
      }

      // Update progress to complete
      updateGenerationProgress(7, GenerationStep.FINALIZING, "complete", 100);

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
