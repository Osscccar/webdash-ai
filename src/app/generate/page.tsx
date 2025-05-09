"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GenerationProgress } from "@/components/generate/generation-progress";
import { GenerationStep } from "@/types";
import { useTenWeb } from "@/hooks/use-tenweb";
import { useToast } from "@/components/ui/use-toast";

export default function GeneratePage() {
  const router = useRouter();
  const { toast } = useToast();
  const tenWeb = useTenWeb();
  const [prompt, setPrompt] = useState<string>("");

  useEffect(() => {
    // Get the prompt from localStorage
    const savedPrompt = localStorage.getItem("webdash_prompt");
    if (!savedPrompt) {
      // If no prompt exists, redirect back to homepage
      toast({
        title: "No prompt found",
        description: "Please enter a prompt on the homepage",
      });
      router.push("/");
      return;
    }

    setPrompt(savedPrompt);

    // Start generation process if not already started
    if (tenWeb.generationProgress.step === 0) {
      startGeneration(savedPrompt);
    }
  }, [router]);

  // When progress reaches 100%, redirect to editor page
  useEffect(() => {
    if (
      tenWeb.generationProgress.progress >= 99.9 &&
      tenWeb.generationProgress.status === "complete"
    ) {
      setTimeout(() => {
        router.push("/editor");
      }, 1000);
    }
  }, [tenWeb.generationProgress, router]);

  const startGeneration = async (prompt: string) => {
    try {
      // Extract business info from the prompt
      // In a real implementation, you might want to use AI to analyze the prompt
      // For now, we'll use a simple extraction
      const businessNameMatch = prompt.match(/for\s+(?:my|a)\s+([a-zA-Z\s]+)/i);
      const businessName = businessNameMatch?.[1]?.trim() || "Business Website";

      // Try to determine business type from prompt
      let businessType = "agency";
      if (
        prompt.toLowerCase().includes("restaurant") ||
        prompt.toLowerCase().includes("cafe")
      ) {
        businessType = "restaurant";
      } else if (
        prompt.toLowerCase().includes("shop") ||
        prompt.toLowerCase().includes("store")
      ) {
        businessType = "e-commerce";
      } else if (prompt.toLowerCase().includes("blog")) {
        businessType = "blog";
      }

      // Call the API to generate the website
      await tenWeb.generateWebsite(prompt, {
        businessName: businessName,
        businessType: businessType,
        businessDescription: prompt,
        websiteTitle: businessName,
      });
    } catch (error) {
      console.error("Error during generation:", error);
      toast({
        title: "Generation Error",
        description:
          "There was an error generating your website. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg text-center space-y-8"
      >
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Generating Your Website
          </h1>
          <p className="text-gray-500">
            Our AI is crafting a custom website based on your description. This
            will take just a moment.
          </p>
        </div>

        <GenerationProgress
          progress={tenWeb.generationProgress.progress}
          currentStep={tenWeb.generationProgress.currentStep}
          step={tenWeb.generationProgress.step}
          totalSteps={tenWeb.generationProgress.totalSteps}
        />

        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mt-8">
          <h3 className="font-medium text-gray-700 mb-2">Your Prompt</h3>
          <p className="text-gray-600 text-sm italic">{prompt}</p>
        </div>
      </motion.div>
    </div>
  );
}
