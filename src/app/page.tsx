// src/app/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { GeneratePrompt } from "@/components/landing/generate-prompt";
import { Sparkles, Wand2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingRedirect, setIsCheckingRedirect] = useState(true);

  // Check if user has an existing website and should be redirected
  useEffect(() => {
    const checkForRedirect = async () => {
      // Wait for auth to load
      if (authLoading) return;

      try {
        // Check if there's an existing generated website
        const savedWebsite = localStorage.getItem("webdash_website");

        if (savedWebsite) {
          // User has already generated a website
          if (user) {
            // If signed in, redirect to dashboard
            router.push("/dashboard");
          } else {
            // If not signed in, redirect to login
            router.push("/login");
          }
          return;
        }

        // No redirect needed
        setIsCheckingRedirect(false);
      } catch (error) {
        console.error("Error checking for redirect:", error);
        setIsCheckingRedirect(false);
      }
    };

    checkForRedirect();
  }, [router, authLoading, user]);

  const handleGenerateWebsite = async () => {
    if (!prompt) return;

    try {
      setIsLoading(true);

      // Clear all localStorage items related to website generation
      const keysToRemove = [
        "webdash_prompt",
        "webdash_site_info",
        "webdash_colors_fonts",
        "webdash_subdomain",
        "webdash_website",
        "webdash_domain_id",
        "webdash_pages_meta",
        "webdash_generate_ai_content",
      ];

      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // Save prompt to local storage to pass to the editor page
      localStorage.setItem("webdash_prompt", prompt);

      // Set a flag to indicate we should run AI generation on the editor page
      localStorage.setItem("webdash_generate_ai_content", "true");

      // Redirect to the editor page
      router.push("/editor");
    } catch (error) {
      console.error("Error preparing website generation:", error);
      toast({
        title: "Error",
        description: "Something went wrong! Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // Show loading state during redirect check
  if (isCheckingRedirect) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f58327] mb-4 mx-auto"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-95" />
        <motion.div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "url('/noise.png')",
            backgroundSize: "200px 200px",
          }}
        />
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(circle at 20% 30%, rgba(245, 131, 39, 0.15) 0%, transparent 40%)",
              "radial-gradient(circle at 40% 70%, rgba(245, 131, 39, 0.15) 0%, transparent 40%)",
              "radial-gradient(circle at 60% 20%, rgba(245, 131, 39, 0.15) 0%, transparent 40%)",
              "radial-gradient(circle at 80% 50%, rgba(245, 131, 39, 0.15) 0%, transparent 40%)",
              "radial-gradient(circle at 20% 30%, rgba(245, 131, 39, 0.15) 0%, transparent 40%)",
            ],
          }}
          transition={{
            duration: 15,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />
      </div>

      {process.env.NODE_ENV === "development" && (
        <button
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          className="fixed bottom-4 right-4 bg-red-500 text-white p-2 rounded-md text-xs z-50 cursor-pointer"
        >
          Reset Storage & Reload
        </button>
      )}

      <div className="container relative z-10 px-4 py-10 mx-auto">
        <div className="flex flex-col items-center max-w-3xl mx-auto">
          {/* Main card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full"
          >
            <Card className="border-0 bg-black/30 backdrop-blur-xl shadow-2xl">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <GeneratePrompt
                    prompt={prompt}
                    setPrompt={setPrompt}
                    onGenerate={handleGenerateWebsite}
                    isLoading={isLoading}
                  />

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="flex flex-wrap justify-center gap-2 pt-2 text-xs text-gray-400"
                  >
                    <span className="px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm">
                      Business website
                    </span>
                    <span className="px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm">
                      Portfolio
                    </span>
                    <span className="px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm">
                      E-commerce
                    </span>
                    <span className="px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm">
                      Blog
                    </span>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Footer with minimal info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-12 text-xs text-center text-gray-400"
          >
            <p>© {new Date().getFullYear()} WebDash. All rights reserved.</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
