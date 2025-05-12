// src/components/preview/generation-popup.tsx

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { GenerationProgress } from "@/components/generate/generation-progress";
import { GenerationStep } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/use-toast";
import { createWebsite, generateAIWebsite } from "@/lib/tenweb-service";
import { generateRandomSubdomain } from "@/lib/utils";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/config/firebase";

interface GenerationPopupProps {
  siteInfo: any;
  onSuccess: () => void;
}

export function GenerationPopup({ siteInfo, onSuccess }: GenerationPopupProps) {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [estimatedTime, setEstimatedTime] = useState<number>(180); // 3 minutes in seconds
  const [generationProgress, setGenerationProgress] = useState({
    step: 0,
    totalSteps: 7,
    currentStep: GenerationStep.CREATING_SITE,
    progress: 0,
    status: "pending" as "pending" | "processing" | "complete" | "error",
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Update the generation progress state
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

  // Start generation when component mounts
  useEffect(() => {
    if (isGenerating) return; // Prevent multiple generations
    setIsGenerating(true);

    const generateWebsite = async () => {
      try {
        // Get the saved prompt
        const prompt = localStorage.getItem("webdash_prompt") || "";

        // Start the generation process
        updateGenerationProgress(
          0,
          GenerationStep.CREATING_SITE,
          "processing",
          0
        );

        // Generate a random subdomain based on business name
        const businessNameInput = siteInfo?.businessName || "mywebsite";
        const sanitizedBusinessName = businessNameInput
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
        const subdomain = generateRandomSubdomain(sanitizedBusinessName);

        // Extract info from siteInfo
        const businessType = siteInfo?.businessType || "agency";
        const businessName = siteInfo?.businessName || "Business Website";
        const businessDescription =
          siteInfo?.businessDescription || prompt || "A modern website.";
        const websiteTitle = siteInfo?.websiteTitle || businessName;
        const websiteDescription =
          siteInfo?.websiteDescription || businessDescription;
        const websiteKeyphrase =
          siteInfo?.websiteKeyphrase ||
          businessName.toLowerCase().split(" ").join(" ");

        // Get color and font data
        const savedColorsAndFonts = localStorage.getItem(
          "webdash_colors_fonts"
        );
        const colorAndFontData = savedColorsAndFonts
          ? JSON.parse(savedColorsAndFonts)
          : {
              colors: {
                primaryColor: "#f58327",
                secondaryColor: "#4a5568",
                backgroundDark: "#212121",
              },
              fonts: {
                primaryFont: "Montserrat",
              },
            };

        // Get pages metadata
        const savedPagesMeta = localStorage.getItem("webdash_pages_meta");
        let pagesMeta = [];

        if (savedPagesMeta) {
          try {
            pagesMeta = JSON.parse(savedPagesMeta);
          } catch (error) {
            console.error("Error parsing pages metadata:", error);
          }
        } else {
          // Generate default pages meta if none exists
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

        // Step 1: Create the base website
        updateGenerationProgress(
          1,
          GenerationStep.CREATING_SITE,
          "processing",
          15
        );

        console.log("Creating base website with subdomain:", subdomain);

        const createWebsiteResponse = await createWebsite({
          subdomain,
          region: "us-central1-c", // Use a default region
          siteTitle: websiteTitle,
          adminUsername: `admin_${subdomain}`,
          adminPassword: "Password1Ab", // Using a password that meets requirements
        });

        if (!createWebsiteResponse?.data?.domain_id) {
          throw new Error("Failed to create base website");
        }

        const domainId = createWebsiteResponse.data.domain_id;
        console.log("Base website created with domain ID:", domainId);

        // Store the domain_id in localStorage
        localStorage.setItem("webdash_domain_id", domainId.toString());
        localStorage.setItem("webdash_subdomain", subdomain);

        // Step 2: Generate the AI website
        updateGenerationProgress(
          2,
          GenerationStep.GENERATING_SITEMAP,
          "processing",
          30
        );

        const aiWebsiteResponse = await generateAIWebsite({
          domainId,
          businessType,
          businessName,
          businessDescription,
          colors: colorAndFontData.colors,
          fonts: colorAndFontData.fonts,
          pagesMeta,
          websiteTitle,
          websiteDescription,
          websiteKeyphrase,
          websiteType: businessType,
        });

        console.log("AI website generation response:", aiWebsiteResponse);

        // Update progress for remaining steps
        updateGenerationProgress(
          3,
          GenerationStep.DESIGNING_PAGES,
          "processing",
          45
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));

        updateGenerationProgress(
          4,
          GenerationStep.SETTING_UP_NAVIGATION,
          "processing",
          60
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));

        updateGenerationProgress(
          5,
          GenerationStep.OPTIMIZING_FOR_DEVICES,
          "processing",
          75
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));

        updateGenerationProgress(
          6,
          GenerationStep.BOOSTING_SPEED,
          "processing",
          90
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Create the website URL
        const siteUrl = `https://${subdomain}.webdash.site`;

        // Create website object
        const website = {
          id: `website-${Date.now()}`,
          domainId,
          subdomain,
          siteUrl,
          title: businessName,
          description: businessDescription,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          status: "active",
        };

        // Store in localStorage
        localStorage.setItem("webdash_website", JSON.stringify(website));

        // Store in Firestore if user is authenticated
        if (user && user.uid) {
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

        // Complete the generation
        updateGenerationProgress(7, GenerationStep.FINALIZING, "complete", 100);

        // Call the success callback
        onSuccess();
      } catch (error: any) {
        console.error("Error generating website:", error);

        toast({
          title: "Error generating website",
          description: error.message || "Please try again later",
          variant: "destructive",
        });

        updateGenerationProgress(0, GenerationStep.CREATING_SITE, "error", 0);
      } finally {
        setIsGenerating(false);
      }
    };

    generateWebsite();
  }, [siteInfo, onSuccess, toast, user]);

  // Countdown timer for estimated time
  useEffect(() => {
    if (generationProgress.step > 0 && estimatedTime > 0) {
      const timer = setTimeout(() => {
        setEstimatedTime((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [estimatedTime, generationProgress.step]);

  // Format time from seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <Card className="w-full max-w-xl shadow-lg animate-fade-in">
        <CardContent className="p-6 space-y-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gray-100 p-2 rounded-full">
              <Loader2 className="h-5 w-5 text-gray-700 animate-spin" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                Building your website
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
        </CardContent>
      </Card>
    </div>
  );
}
