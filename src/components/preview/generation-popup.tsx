// src/components/preview/generation-popup.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { GenerationProgress } from "@/components/generate/generation-progress";
import { GenerationStep } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/use-toast";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
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
    if (isGeneratingRef.current) return; // Prevent multiple generations
    isGeneratingRef.current = true;

    const generateWebsite = async () => {
      try {
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

        // Generate the website using our single hook
        const website = await tenWeb.generateWebsite(prompt, generationParams);

        if (website) {
          onSuccess(); // Call the success callback
        } else {
          throw new Error("Website generation failed");
        }
      } catch (error: any) {
        console.error("Error generating website:", error);

        toast({
          title: "Error generating website",
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
            progress={tenWeb.generationProgress.progress}
            currentStep={tenWeb.generationProgress.currentStep}
            step={tenWeb.generationProgress.step}
            totalSteps={tenWeb.generationProgress.totalSteps}
          />
        </CardContent>
      </Card>
    </div>
  );
}
