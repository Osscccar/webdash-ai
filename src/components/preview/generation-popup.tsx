// src/components/preview/generation-popup.tsx

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GenerationProgress } from "@/components/generate/generation-progress";
import { GenerationStep } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/use-toast";
import FirestoreService from "@/lib/firestore-service";
import useTenWeb from "@/hooks/use-tenweb";

interface GenerationPopupProps {
  siteInfo: any;
  onSuccess: () => void;
}

export function GenerationPopup({ siteInfo, onSuccess }: GenerationPopupProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const tenWeb = useTenWeb();
  const [estimatedTime, setEstimatedTime] = useState<number>(180); // 3 minutes in seconds
  const isGeneratingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);

  // Countdown timer for estimated time
  useEffect(() => {
    if (tenWeb.generationProgress.step > 0 && estimatedTime > 0) {
      const timer = setTimeout(() => {
        setEstimatedTime((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [estimatedTime, tenWeb.generationProgress.step]);

  // Start generation when component mounts
  useEffect(() => {
    // Check for existing website in localStorage
    const existingWebsite = localStorage.getItem("webdash_website");
    if (existingWebsite) {
      try {
        const website = JSON.parse(existingWebsite);
        if (website.siteUrl) {
          console.log("Found existing website, skipping generation:", website);
          onSuccess();
          return;
        }
      } catch (e) {
        console.error("Error parsing existing website:", e);
      }
    }

    // Prevent duplicate website creation
    if (isGeneratingRef.current) {
      console.log("Website generation already in progress, skipping");
      return;
    }

    isGeneratingRef.current = true;

    const generateWebsite = async () => {
      try {
        setError(null);
        setErrorDetails(null);

        // Get the saved prompt
        const prompt = localStorage.getItem("webdash_prompt") || "";

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
        }

        // Prepare parameters
        const generationParams = {
          businessType: siteInfo?.businessType || "agency",
          businessName: siteInfo?.businessName || "Business Website",
          businessDescription:
            siteInfo?.businessDescription || prompt || "A modern website.",
          websiteTitle: siteInfo?.websiteTitle || siteInfo?.businessName,
          websiteDescription:
            siteInfo?.websiteDescription || siteInfo?.businessDescription,
          websiteKeyphrase:
            siteInfo?.websiteKeyphrase || siteInfo?.businessName?.toLowerCase(),
          colors: colorAndFontData.colors,
          fonts: colorAndFontData.fonts,
          pagesMeta: pagesMeta,
        };

        console.log(
          "Starting website generation with parameters:",
          generationParams
        );

        // Generate the website using our hook
        const website = await tenWeb.generateWebsite(prompt, generationParams);

        if (website) {
          // If user is authenticated, save to Firestore
          if (user && user.uid && website) {
            // Make sure the website has userId
            website.userId = user.uid;

            // Save to Firestore
            await FirestoreService.createWebsite(website);
          }

          onSuccess(); // Call the success callback
        } else {
          throw new Error("Website generation failed - no website returned");
        }
      } catch (error: any) {
        console.error("Error generating website:", error);
        setError(error.message || "An unexpected error occurred");

        if (error.details) {
          setErrorDetails(error.details);
        }

        toast({
          title: "Website generation error",
          description: error.message || "Please try again later",
          variant: "destructive",
        });
      } finally {
        isGeneratingRef.current = false;
      }
    };

    generateWebsite();
  }, [siteInfo, onSuccess, toast, user, tenWeb]);

  // Format time from seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Handle retry
  const handleRetry = () => {
    // Reset states
    setError(null);
    setErrorDetails(null);
    isGeneratingRef.current = false;

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
            // Normal generation state
            <>
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
                progress={tenWeb.generationProgress.progress}
                currentStep={tenWeb.generationProgress.currentStep}
                step={tenWeb.generationProgress.step}
                totalSteps={tenWeb.generationProgress.totalSteps}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
