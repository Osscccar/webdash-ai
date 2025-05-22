// src/components/preview/generation-popup.tsx

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

// Helper function to generate unique job ID
const generateJobId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `job_${timestamp}_${randomStr}`;
};

interface GenerationPopupProps {
  siteInfo: any;
  onSuccess: (jobId: string) => void;
}

export function GenerationPopup({ siteInfo, onSuccess }: GenerationPopupProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isStarting, setIsStarting] = useState(false);
  const hasStartedRef = useRef(false);

  // Start job once when component mounts
  useEffect(() => {
    if (hasStartedRef.current || isStarting) return;

    const startJob = async () => {
      try {
        // Check for existing website
        const existingWebsite = localStorage.getItem("webdash_website");
        if (existingWebsite) {
          try {
            const website = JSON.parse(existingWebsite);
            if (website.siteUrl) {
              console.log(
                "Found existing website, skipping generation:",
                website
              );
              onSuccess(website.jobId || "existing");
              return;
            }
          } catch (e) {
            console.error("Error parsing existing website:", e);
          }
        }

        setIsStarting(true);
        hasStartedRef.current = true;

        // Prepare generation parameters
        const prompt = localStorage.getItem("webdash_prompt") || "";
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

        // Generate unique job ID
        const jobId = generateJobId();
        localStorage.setItem("webdash_job_id", jobId);

        // Prepare parameters
        const generationParams = {
          jobId,
          prompt,
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

        // Store website generation information in localStorage
        localStorage.setItem("webdash_prompt", prompt);
        localStorage.setItem(
          "webdash_site_info",
          JSON.stringify({
            businessType: generationParams.businessType,
            businessName: generationParams.businessName,
            businessDescription: generationParams.businessDescription,
            websiteTitle: generationParams.websiteTitle,
            websiteDescription: generationParams.websiteDescription,
            websiteKeyphrase: generationParams.websiteKeyphrase,
            colors: generationParams.colors,
            fonts: generationParams.fonts,
          })
        );

        // Start the job
        console.log("Starting new job with params:", generationParams);
        const response = await fetch("/api/start-job", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(generationParams),
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

        console.log("Job started successfully:", data);

        // Quick delay for smooth transition
        setTimeout(() => {
          // Job started successfully, hand control to parent component for polling
          onSuccess(jobId);
        }, 500);
      } catch (error: any) {
        console.error("Error generating website:", error);
        toast({
          title: "Website generation error",
          description: error.message || "Please try again later",
          variant: "destructive",
        });

        // Clear job ID on error
        localStorage.removeItem("webdash_job_id");

        // Reset the started flag so we can try again
        hasStartedRef.current = false;
        setIsStarting(false);
      }
    };

    startJob();
  }, [siteInfo, onSuccess, toast]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center space-y-4 py-6">
              <div className="relative">
                <Loader2 className="h-10 w-10 text-[#f58327] animate-spin" />
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    boxShadow: [
                      "0 0 0 0px rgba(245, 131, 39, 0.2)",
                      "0 0 0 10px rgba(245, 131, 39, 0)",
                    ],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                  }}
                />
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">
                  Creating Your Website
                </h2>
                <p className="text-gray-500">
                  We're setting up your beautiful website right now!
                </p>
              </div>

              <div className="flex pt-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Sparkles className="text-[#f58327] mx-2 h-5 w-5" />
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
