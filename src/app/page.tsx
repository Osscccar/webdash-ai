"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GeneratePrompt } from "@/components/landing/generate-prompt";
import { HeaderNav } from "@/components/landing/header-nav";
import { FooterSection } from "@/components/landing/footer-section";
import { generateRandomSubdomain } from "@/lib/utils";

export default function LandingPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateWebsite = async () => {
    if (!prompt) return;

    try {
      setIsLoading(true);

      // Generate a random subdomain to track this generation
      const subdomain = generateRandomSubdomain("site");

      // Save prompt to local storage for now (will be saved to database after authentication)
      localStorage.setItem("webdash_prompt", prompt);
      localStorage.setItem("webdash_subdomain", subdomain);

      // Redirect to the generation page
      router.push("/generate");
    } catch (error) {
      console.error("Error generating website:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <HeaderNav />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-12 md:py-24 lg:py-32 bg-gradient-to-b from-gray-50 to-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  <span className="text-black">
                    Create Stunning Websites with{" "}
                  </span>
                  <span className="text-[#f58327]">AI</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                  Describe your dream website and our AI will generate it
                  instantly. No coding required.
                </p>
              </div>

              <Card className="w-full max-w-2xl border-0 shadow-lg">
                <CardContent className="p-6">
                  <GeneratePrompt
                    prompt={prompt}
                    setPrompt={setPrompt}
                    onGenerate={handleGenerateWebsite}
                    isLoading={isLoading}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-24 bg-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Create Websites in Minutes
                </h2>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                  Our AI-powered platform makes web design accessible to
                  everyone.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    className="flex flex-col items-center p-6 bg-white rounded-lg shadow hover:shadow-md"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="w-12 h-12 rounded-full bg-[#f58327]/10 flex items-center justify-center mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold">{feature.title}</h3>
                    <p className="text-gray-500 text-center mt-2">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-24 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Ready to Create Your Website?
                </h2>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                  Get started in seconds with our AI-powered website builder.
                </p>
              </div>

              <Button
                size="lg"
                className="bg-[#f58327] hover:bg-[#f58327]/90 text-white mt-4"
                onClick={() => document.getElementById("hero-prompt")?.focus()}
              >
                Start Building Now
              </Button>
            </div>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}

// Features data
const features = [
  {
    title: "AI-Powered Design",
    description:
      "Our AI analyzes your description and generates a custom website tailored to your needs.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[#f58327]"
      >
        <path d="M12 2a4 4 0 0 0-4 4v1H3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-1h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-5V6a4 4 0 0 0-4-4z" />
      </svg>
    ),
  },
  {
    title: "No Coding Required",
    description:
      "Create a professional website without writing a single line of code.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[#f58327]"
      >
        <path d="m18 16 4-4-4-4" />
        <path d="m6 8-4 4 4 4" />
        <path d="m14.5 4-5 16" />
      </svg>
    ),
  },
  {
    title: "Fully Customizable",
    description:
      "Easily modify colors, fonts, and content to match your brand identity.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[#f58327]"
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
];
