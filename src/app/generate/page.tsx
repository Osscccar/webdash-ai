"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { GenerationProgress } from "@/components/generate/generation-progress";
import { useTenWeb } from "@/hooks/use-tenweb";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { ArrowLeft, Bug, Code, Loader2 } from "lucide-react";

// Helper function to directly call the API for debugging
const testApiCall = async (endpoint: string, data: any) => {
  try {
    const response = await axios.post(`/api/tenweb/${endpoint}`, data);
    console.log(`API test success (${endpoint}):`, response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`API test failed (${endpoint}):`, error);
    return { success: false, error };
  }
};

export default function GeneratePage() {
  const router = useRouter();
  const { toast } = useToast();
  const tenWeb = useTenWeb();
  const [prompt, setPrompt] = useState<string>("");
  const [siteInfo, setSiteInfo] = useState<any>(null);
  const [colorAndFontData, setColorAndFontData] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<any>(null);
  const [estimatedTime, setEstimatedTime] = useState<number>(120); // 2 minutes in seconds

  // Additional state to track which API failed
  const [failedApiStep, setFailedApiStep] = useState<string | null>(null);

  // Countdown timer for estimated time
  useEffect(() => {
    if (isReady && tenWeb.generationProgress.step > 0 && estimatedTime > 0) {
      const timer = setTimeout(() => {
        setEstimatedTime((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isReady, estimatedTime, tenWeb.generationProgress.step]);

  useEffect(() => {
    // Load required data from localStorage
    const savedPrompt = localStorage.getItem("webdash_prompt");
    const savedSiteInfo = localStorage.getItem("webdash_site_info");
    const savedColorAndFontData = localStorage.getItem("webdash_colors_fonts");

    if (!savedPrompt || !savedSiteInfo) {
      // If required data is missing, redirect back to editor
      toast({
        title: "Missing website information",
        description: "Please complete the website editor steps first.",
        variant: "destructive",
      });
      router.push("/editor");
      return;
    }

    // Set the data states
    setPrompt(savedPrompt);

    try {
      setSiteInfo(JSON.parse(savedSiteInfo));

      if (savedColorAndFontData) {
        setColorAndFontData(JSON.parse(savedColorAndFontData));
      } else {
        // Use default colors and fonts if not set
        setColorAndFontData({
          colors: {
            primaryColor: "#f58327",
            secondaryColor: "#4a5568",
            backgroundDark: "#212121",
          },
          fonts: {
            primaryFont: "Montserrat",
          },
        });
      }

      setIsReady(true);
    } catch (error) {
      console.error("Error parsing saved data:", error);
      toast({
        title: "Error loading website data",
        description: "There was a problem with your website configuration.",
        variant: "destructive",
      });
      router.push("/editor");
    }
  }, [router, toast]);

  // Start generation once all data is loaded and ready
  useEffect(() => {
    if (isReady && tenWeb.generationProgress.step === 0 && !debugMode) {
      startGeneration();
    }
  }, [isReady, tenWeb.generationProgress.step, debugMode]);

  // When progress reaches 100%, redirect to preview page
  useEffect(() => {
    if (
      tenWeb.generationProgress.progress >= 99.9 &&
      tenWeb.generationProgress.status === "complete"
    ) {
      setTimeout(() => {
        router.push("/preview");
      }, 1000);
    }
  }, [tenWeb.generationProgress, router]);

  const startGeneration = async () => {
    try {
      if (!siteInfo || !colorAndFontData) {
        throw new Error("Missing required website information");
      }

      // Prepare the generation parameters
      const generationParams = {
        prompt: prompt,
        businessType: siteInfo.businessType,
        businessName: siteInfo.businessName,
        businessDescription: siteInfo.businessDescription,
        websiteTitle: siteInfo.websiteTitle,
        websiteDescription: siteInfo.websiteDescription,
        websiteKeyphrase: siteInfo.websiteKeyphrase,
        colors: {
          primaryColor: colorAndFontData.colors.primaryColor,
          secondaryColor: colorAndFontData.colors.secondaryColor,
          backgroundDark: colorAndFontData.colors.backgroundDark,
        },
        fonts: {
          primaryFont: colorAndFontData.fonts.primaryFont,
        },
      };

      console.log("Starting website generation with params:", generationParams);

      // Call the API to generate the website
      await tenWeb.generateWebsite(prompt, generationParams);
    } catch (error) {
      console.error("Error during generation:", error);
      toast({
        title: "Generation Error",
        description:
          "There was an error generating your website. Please try again.",
        variant: "destructive",
      });

      // Redirect back to editor on error
      setTimeout(() => {
        router.push("/editor");
      }, 2000);
    }
  };

  // Debug functions
  const testCreateWebsite = async () => {
    const subdomain = `test-${Date.now().toString().slice(-8)}`;
    const result = await testApiCall("hosting/website", {
      subdomain,
      region: "us-central1-c",
      site_title: "Test Website",
      admin_username: `admin_${subdomain}`,
      admin_password: "Password1Ab",
    });

    setApiTestResult(result);
    setFailedApiStep(result.success ? null : "create_website");
  };

  const testGenerateAISite = async () => {
    // You need a valid domain_id from a previous createWebsite call
    const domainId = apiTestResult?.data?.data?.domain_id;

    if (!domainId) {
      toast({
        title: "Missing domain ID",
        description: "Please run the Create Website test first",
        variant: "destructive",
      });
      return;
    }

    const result = await testApiCall("ai/generate_site", {
      domain_id: domainId,
      business_type: "agency",
      business_name: "Test Business",
      business_description: "This is a test business website.",
      // Simplified params to narrow down the issue
    });

    setApiTestResult(result);
    setFailedApiStep(result.success ? null : "generate_ai_site");
  };

  // Format time from seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex flex-1 p-6 bg-gray-50">
        <div className="w-full max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {!debugMode ? (
              <>
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
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
                </div>
              </>
            ) : (
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-6 space-y-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Bug className="h-4 w-4 text-gray-500" />
                      <h3 className="font-normal text-gray-700">Debug Mode</h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Use the buttons below to test specific API endpoints and
                      diagnose issues.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={testCreateWebsite}
                      className="w-full cursor-pointer"
                      variant="outline"
                    >
                      <Code className="h-4 w-4 mr-2" />
                      Test Create Website API
                    </Button>

                    <Button
                      onClick={testGenerateAISite}
                      className="w-full cursor-pointer"
                      variant="outline"
                      disabled={!apiTestResult?.data?.data?.domain_id}
                    >
                      <Code className="h-4 w-4 mr-2" />
                      Test Generate AI Site API
                    </Button>
                  </div>

                  {apiTestResult && (
                    <div
                      className={`p-5 rounded-lg text-left text-sm ${
                        apiTestResult.success
                          ? "bg-green-50 border border-green-100"
                          : "bg-red-50 border border-red-100"
                      }`}
                    >
                      <h3 className="font-normal mb-3">
                        {apiTestResult.success
                          ? "API Test Succeeded"
                          : "API Test Failed"}
                      </h3>
                      <pre className="bg-gray-900 text-white p-4 rounded-md overflow-auto max-h-60 text-xs">
                        {JSON.stringify(apiTestResult, null, 2)}
                      </pre>
                    </div>
                  )}

                  {failedApiStep === "generate_ai_site" && (
                    <div className="bg-yellow-50 p-5 rounded-lg text-left text-sm border border-yellow-100">
                      <h3 className="font-normal mb-2">Possible Solution:</h3>
                      <p className="mb-3">
                        The AI generate site API is failing. Try with these
                        simpler parameters:
                      </p>
                      <Button
                        onClick={async () => {
                          const domainId = apiTestResult?.data?.data?.domain_id;
                          if (!domainId) return;

                          const result = await testApiCall("ai/generate_site", {
                            domain_id: domainId,
                            business_type: "agency",
                            business_name: "Test Business",
                            business_description: "This is a test business.",
                            // Minimal required parameters only
                          });

                          setApiTestResult(result);
                          setFailedApiStep(
                            result.success ? null : "generate_ai_site_minimal"
                          );
                        }}
                        variant="outline"
                        className="cursor-pointer"
                      >
                        Try Minimal Parameters
                      </Button>
                    </div>
                  )}

                  <Button
                    onClick={() => {
                      setDebugMode(false);
                      setApiTestResult(null);
                      setFailedApiStep(null);
                    }}
                    className="w-full cursor-pointer"
                  >
                    Return to Generation
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
