// src/hooks/use-tenweb.ts

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./use-auth";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { generateRandomSubdomain } from "@/lib/utils";
import { GenerationStep, UserWebsite } from "@/types";
import { db } from "@/config/firebase";
import {
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";

export function useTenWeb() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isGeneratingRef = useRef(false);
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
      progress: progress,
      status,
    });
  };

  /**
   * Generate a website from a prompt with full configuration
   * Using ONLY the generate_site_from_sitemap endpoint
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

      // Check if we already have a domain ID - if so, use it
      const existingDomainId = localStorage.getItem("webdash_domain_id");
      const existingSubdomain = localStorage.getItem("webdash_subdomain");

      // Generate a random subdomain based on business name or use existing
      let subdomain;
      if (existingSubdomain) {
        console.log("Using existing subdomain:", existingSubdomain);
        subdomain = existingSubdomain;
      } else {
        const businessNameInput = params?.businessName || "mywebsite";
        const sanitizedBusinessName = businessNameInput
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
        subdomain = generateRandomSubdomain(sanitizedBusinessName);
        console.log("Generated new subdomain:", subdomain);
        localStorage.setItem("webdash_subdomain", subdomain);
      }

      // Get required parameters from the passed configuration
      const businessType = params?.businessType || "agency";
      const businessName = params?.businessName || "Business Website";
      const businessDescription =
        params?.businessDescription || prompt || "A modern website.";
      const websiteTitle = params?.websiteTitle || businessName;
      const websiteDescription =
        params?.websiteDescription || businessDescription;
      const websiteKeyphrase =
        params?.websiteKeyphrase || businessName.toLowerCase();

      // Store website generation information in localStorage
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

      // Generate unique ID for the request
      const uniqueId = `webdash_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;

      // Update progress
      updateGenerationProgress(
        2,
        GenerationStep.GENERATING_SITEMAP,
        "processing",
        30
      );

      // Get pages meta from localStorage if not provided in params
      let pagesMeta = params.pagesMeta;

      if (!pagesMeta) {
        const savedPagesMeta = localStorage.getItem("webdash_pages_meta");
        if (savedPagesMeta) {
          try {
            pagesMeta = JSON.parse(savedPagesMeta);
          } catch (error) {
            console.error("Error parsing pages meta from localStorage:", error);
            // Continue without the parsed data
          }
        }
      }

      // Use default pages meta if none is available
      if (!pagesMeta) {
        pagesMeta = [
          {
            title: "Home",
            description: `Welcome to ${businessName}`,
            sections: [
              {
                section_title: "Hero Section",
                section_description: businessDescription,
              },
              {
                section_title: "Services Overview",
                section_description: `Discover what ${businessName} has to offer.`,
              },
            ],
          },
          {
            title: "About",
            description: `Learn more about ${businessName}`,
            sections: [
              {
                section_title: "Our Story",
                section_description: `The story behind ${businessName}.`,
              },
              {
                section_title: "Our Team",
                section_description: "Meet our team of professionals.",
              },
            ],
          },
          {
            title: "Services",
            description: `Services offered by ${businessName}`,
            sections: [
              {
                section_title: "Service 1",
                section_description: "Description of our first service.",
              },
              {
                section_title: "Service 2",
                section_description: "Description of our second service.",
              },
            ],
          },
          {
            title: "Contact",
            description: `Get in touch with ${businessName}`,
            sections: [
              {
                section_title: "Contact Form",
                section_description: "Send us a message.",
              },
              {
                section_title: "Contact Information",
                section_description: "Our address, phone, and email.",
              },
            ],
          },
        ];
      }

      // Make the API call to generate the website
      const requestBody = {
        subdomain,
        unique_id: uniqueId,
        business_type: businessType,
        business_name: businessName,
        business_description: businessDescription,
        colors: {
          primary_color: params.colors?.primaryColor || "#f58327",
          secondary_color: params.colors?.secondaryColor || "#4a5568",
          background_dark: params.colors?.backgroundDark || "#212121",
        },
        fonts: {
          primary_font: params.fonts?.primaryFont || "Montserrat",
        },
        pages_meta: pagesMeta,
        website_title: websiteTitle,
        website_description: websiteDescription,
        website_keyphrase: websiteKeyphrase,
        website_type: businessType,
      };

      console.log("Sending API request to generate site:", requestBody);

      // Make the request with a generous timeout
      const response = await axios.post(
        "/api/tenweb/ai/generate_site_from_sitemap",
        requestBody,
        {
          timeout: 180000, // 3-minute timeout
        }
      );

      console.log("API response for site generation:", response.data);

      // Extract domain ID and URL from response
      const domainId = response.data?.data?.domain_id || Date.now();
      const siteUrl =
        response.data?.data?.url || `https://${subdomain}.webdash.site`;

      // Store the domain_id in localStorage
      localStorage.setItem("webdash_domain_id", domainId.toString());

      // Update progress for remaining steps
      updateGenerationProgress(
        3,
        GenerationStep.DESIGNING_PAGES,
        "processing",
        45
      );
      await new Promise((resolve) => setTimeout(resolve, 500));

      updateGenerationProgress(
        4,
        GenerationStep.SETTING_UP_NAVIGATION,
        "processing",
        60
      );
      await new Promise((resolve) => setTimeout(resolve, 500));

      updateGenerationProgress(
        5,
        GenerationStep.OPTIMIZING_FOR_DEVICES,
        "processing",
        75
      );
      await new Promise((resolve) => setTimeout(resolve, 500));

      updateGenerationProgress(
        6,
        GenerationStep.BOOSTING_SPEED,
        "processing",
        90
      );
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Create website object
      const website: UserWebsite = {
        id: `website-${Date.now()}`,
        userId: user?.uid || "",
        domainId: domainId,
        subdomain,
        siteUrl: siteUrl,
        title: businessName,
        description: businessDescription,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        status: "active",
        generationParams: {
          prompt,
          businessType,
          businessName,
          businessDescription,
          colors: params.colors,
          fonts: params.fonts,
          websiteTitle,
          websiteDescription,
          websiteKeyphrase,
        },
      };

      // Store the website data in localStorage
      localStorage.setItem("webdash_website", JSON.stringify(website));

      // Only update Firestore if user is logged in
      if (user && user.uid) {
        try {
          console.log("Saving website to Firestore for user:", user.uid);
          console.log("Website data:", website);

          // Update user document to add this website
          const userRef = doc(db, "users", user.uid);

          // Use arrayUnion to add the website to the array without duplicates
          await updateDoc(userRef, {
            websites: arrayUnion(website),
            updatedAt: serverTimestamp(),
          });

          console.log(
            "Successfully saved website to user document in Firestore"
          );
        } catch (error) {
          console.error("Failed to save website to Firestore:", error);
          // Continue anyway to show the site to the user from localStorage
        }
      }

      // Update progress to complete
      updateGenerationProgress(7, GenerationStep.FINALIZING, "complete", 100);

      toast({
        title: "Website created successfully",
        description: "Your website is ready to view and edit.",
      });

      return website;
    } catch (error: any) {
      console.error("Error generating website:", error);

      // Detailed error logging
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }

      updateGenerationProgress(0, GenerationStep.CREATING_SITE, "error", 0);

      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to generate website";

      toast({
        title: "Error generating website",
        description: errorMessage,
        variant: "destructive",
      });

      // Add details to the error for better handling in the UI
      const enhancedError = new Error(errorMessage);
      // @ts-ignore
      enhancedError.details = error.response?.data || {};

      throw enhancedError;
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
      const response = await axios.get(
        `/api/tenweb/account/domains/${domainId}/single?admin_url=${encodeURIComponent(
          adminUrl
        )}`
      );
      return response.data.token;
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
