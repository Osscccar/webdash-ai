"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditorNav } from "@/components/editor/editor-nav";
import { SiteInfoForm } from "@/components/editor/site-info-form";
import { PagesEditor } from "@/components/editor/pages-editor";
import { ColorsAndFonts } from "@/components/editor/colors-and-fonts";
import { AuthRequired } from "@/components/auth/auth-required";
import { useToast } from "@/components/ui/use-toast";

export default function EditorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("site-info");
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [siteInfo, setSiteInfo] = useState({
    businessType: "",
    businessName: "",
    businessDescription: "",
    websiteTitle: "",
    websiteDescription: "",
    websiteKeyphrase: "",
  });

  useEffect(() => {
    // Get the prompt from localStorage
    const savedPrompt = localStorage.getItem("webdash_prompt");
    if (!savedPrompt) {
      // If no prompt exists, redirect back to homepage
      router.push("/");
      return;
    }

    setPrompt(savedPrompt);

    // Use the prompt to suggest initial site info
    // This is a simulated AI suggestion based on the prompt
    // In a real implementation, you would make an API call to get these suggestions
    const simulatedAiSuggestion = {
      businessType: "agency",
      businessName: "Creative Solutions",
      businessDescription:
        "A cutting-edge digital agency focused on delivering innovative solutions for modern businesses.",
      websiteTitle: "Creative Solutions | Digital Agency",
      websiteDescription:
        "Creative Solutions is a premier digital agency helping businesses transform their digital presence with innovative design and development.",
      websiteKeyphrase: "digital agency creative solutions",
    };

    setSiteInfo(simulatedAiSuggestion);
  }, [router]);

  const handleContinue = () => {
    // In a real implementation, this would save the editor state to the database
    // and initiate the website generation process
    setIsLoading(true);

    // Save the configuration to localStorage temporarily
    localStorage.setItem("webdash_site_info", JSON.stringify(siteInfo));

    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Ready to preview your website!",
        description:
          "You need to sign up or log in to view your generated website.",
      });
      router.push("/auth/login?redirect=/preview");
    }, 1500);
  };

  return (
    <AuthRequired fallback={<div>Loading...</div>} redirect={false}>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <EditorNav />

        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-2 mb-8">
              <h1 className="text-3xl font-bold tracking-tight">
                Edit Your Site's Structure
              </h1>
              <p className="text-gray-500">
                Customize your website settings based on the AI-generated
                structure.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
              <div className="mb-4">
                <h2 className="text-lg font-medium">Your Prompt</h2>
                <p className="text-gray-600 italic">{prompt}</p>
              </div>
            </div>

            <Card>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="site-info">Site Info</TabsTrigger>
                  <TabsTrigger value="pages">Pages</TabsTrigger>
                  <TabsTrigger value="colors-fonts">Colors & Fonts</TabsTrigger>
                </TabsList>

                <CardContent className="p-6">
                  <TabsContent value="site-info">
                    <SiteInfoForm
                      siteInfo={siteInfo}
                      setSiteInfo={setSiteInfo}
                    />
                  </TabsContent>

                  <TabsContent value="pages">
                    <PagesEditor />
                  </TabsContent>

                  <TabsContent value="colors-fonts">
                    <ColorsAndFonts />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>

            <div className="flex justify-end mt-8">
              <Button
                variant="secondary"
                className="mr-4"
                onClick={() => router.push("/")}
              >
                Cancel
              </Button>
              <Button
                onClick={handleContinue}
                className="bg-[#f58327] hover:bg-[#f58327]/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Continue to Preview"}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </AuthRequired>
  );
}
