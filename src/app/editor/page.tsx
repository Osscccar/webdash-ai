// src/app/editor/page.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SiteInfoForm } from "@/components/editor/site-info-form";
import { ColorsAndFonts } from "@/components/editor/colors-and-fonts";
import { VisualPageTree } from "@/components/editor/visual-page-tree";
import { SiteInfoSummary } from "@/components/editor/site-info-summary";
import { DesignSummary } from "@/components/editor/design-summary";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Info, AlertCircle, Bot } from "lucide-react";
import { PrimaryButton } from "@/components/ui/custom-button";
import { Separator } from "@/components/ui/separator";
import { PageMeta, Section } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

// Define the stages of the wizard
type Stage = "business-info" | "design" | "pages";
type EditingSection = "none" | "business-info" | "design" | "page-details";

export default function EditorPage() {
  // ===== ALL HOOKS MUST BE CALLED AT THE TOP LEVEL =====
  console.log("EditorPage: Starting render");

  // 1. Router hook
  const router = useRouter();
  console.log("EditorPage: useRouter called");

  // 2. Toast hook
  const { toast } = useToast();
  console.log("EditorPage: useToast called");

  // 3. All useState hooks in consistent order
  const [prompt, setPrompt] = useState("");
  const [currentStage, setCurrentStage] = useState<Stage>("business-info");
  const [editingSection, setEditingSection] =
    useState<EditingSection>("business-info");
  const [completedStages, setCompletedStages] = useState<Stage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiGenerationStep, setAiGenerationStep] = useState(0);
  const [animatingField, setAnimatingField] = useState<string | null>(null);
  const [showTreeAnimation, setShowTreeAnimation] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [animatedPages, setAnimatedPages] = useState<string[]>([]);
  const [animatedSections, setAnimatedSections] = useState<string[]>([]);

  // Default site info state
  const [siteInfo, setSiteInfo] = useState({
    businessType: "",
    businessName: "",
    businessDescription: "",
    websiteTitle: "",
    websiteDescription: "",
    websiteKeyphrase: "",
  });

  // Default colors and fonts state
  const [colorAndFontData, setColorAndFontData] = useState({
    colors: {
      primaryColor: "#f58327",
      secondaryColor: "#4a5568",
      backgroundDark: "#212121",
    },
    fonts: {
      primaryFont: "Montserrat",
    },
  });

  // Initial pages for the visual page tree
  const [pages, setPages] = useState([
    {
      id: "home",
      title: "Home page",
      type: "page" as const,
    },
    {
      id: "about",
      title: "About Us",
      type: "page" as const,
    },
    {
      id: "services",
      title: "Services",
      type: "page" as const,
    },
    {
      id: "contact",
      title: "Contact",
      type: "page" as const,
    },
  ]);

  // Initial sections for the visual page tree
  const [sections, setSections] = useState([
    // Home page sections
    {
      id: "header",
      title: "Header",
      type: "section" as const,
      parentId: "home",
    },
    {
      id: "hero",
      title: "Hero",
      type: "section" as const,
      parentId: "home",
    },
    {
      id: "features",
      title: "Features",
      type: "section" as const,
      parentId: "home",
    },
    {
      id: "testimonials",
      title: "Testimonials",
      type: "section" as const,
      parentId: "home",
    },
    // About page sections
    {
      id: "about-header",
      title: "Header",
      type: "section" as const,
      parentId: "about",
    },
    {
      id: "about-intro",
      title: "Introduction",
      type: "section" as const,
      parentId: "about",
    },
    {
      id: "team",
      title: "Our Team",
      type: "section" as const,
      parentId: "about",
    },
    // Services page sections
    {
      id: "services-header",
      title: "Header",
      type: "section" as const,
      parentId: "services",
    },
    {
      id: "service-1",
      title: "Service 1",
      type: "section" as const,
      parentId: "services",
    },
    {
      id: "service-2",
      title: "Service 2",
      type: "section" as const,
      parentId: "services",
    },
    // Contact page sections
    {
      id: "contact-header",
      title: "Header",
      type: "section" as const,
      parentId: "contact",
    },
    {
      id: "contact-form",
      title: "Contact Form",
      type: "section" as const,
      parentId: "contact",
    },
    {
      id: "contact-info",
      title: "Contact Information",
      type: "section" as const,
      parentId: "contact",
    },
  ]);

  // 4. useRef hooks
  const infoFormRef = useRef<HTMLDivElement>(null);
  const colorFormRef = useRef<HTMLDivElement>(null);
  const initializeRef = useRef(false);

  console.log("EditorPage: All hooks called");

  // ===== ALL HOOKS CALLED BY THIS POINT =====

  // Function to convert AI-generated pages to our page/section format
  const convertAIPages = (aiPages: any[]) => {
    const newPages = aiPages.map((page, index) => ({
      id: `page-${index}`,
      title: page.title,
      type: "page" as const,
    }));

    const newSections: any[] = [];

    aiPages.forEach((page, pageIndex) => {
      page.sections.forEach((section: any, sectionIndex: number) => {
        newSections.push({
          id: `section-${pageIndex}-${sectionIndex}`,
          title: section.section_title,
          type: "section" as const,
          parentId: `page-${pageIndex}`,
          description: section.section_description,
        });
      });
    });

    return { pages: newPages, sections: newSections };
  };

  // AI content generation
  const generateAIContent = async (prompt: string) => {
    try {
      setIsGeneratingAI(true);
      setAiGenerationStep(1);
      setAnimatedPages([]);
      setAnimatedSections([]);
      setShowTreeAnimation(true);

      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate content");
      }

      const data = await response.json();
      const { content } = data;

      // Animated generation of content
      setAiGenerationStep(2);

      // Update business info with simulated typing effect
      if (infoFormRef.current) {
        infoFormRef.current.scrollIntoView({ behavior: "smooth" });
      }

      // Simulate typing for business name
      setAnimatingField("businessName");

      const typeBusinessName = async () => {
        for (let i = 0; i <= content.businessName.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          setSiteInfo((prev) => ({
            ...prev,
            businessName: content.businessName.substring(0, i),
          }));
        }
      };

      await typeBusinessName();
      setAiGenerationStep(3);
      setAnimatingField("businessType");

      // Simulate typing for business type
      const typeBusinessType = async () => {
        for (let i = 0; i <= content.businessType.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          setSiteInfo((prev) => ({
            ...prev,
            businessType: content.businessType.substring(0, i),
          }));
        }
      };

      await typeBusinessType();
      setAiGenerationStep(4);
      setAnimatingField("businessDescription");

      // Simulate typing for business description
      const typeBusinessDescription = async () => {
        for (let i = 0; i <= content.businessDescription.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 20));
          setSiteInfo((prev) => ({
            ...prev,
            businessDescription: content.businessDescription.substring(0, i),
          }));
        }
      };

      await typeBusinessDescription();
      setAiGenerationStep(5);
      setAnimatingField(null);

      // Update the rest of the business info
      setSiteInfo({
        businessType: content.businessType,
        businessName: content.businessName,
        businessDescription: content.businessDescription,
        websiteTitle: content.websiteTitle,
        websiteDescription: content.websiteDescription,
        websiteKeyphrase: content.websiteKeyphrase,
      });

      // Mark business info as completed
      if (!completedStages.includes("business-info")) {
        setCompletedStages((prev) => [...prev, "business-info"]);
      }

      // Update colors and fonts
      setAiGenerationStep(6);

      if (colorFormRef.current) {
        colorFormRef.current.scrollIntoView({ behavior: "smooth" });
      }

      // Simulate color updates with animation
      setAnimatingField("colors");
      setColorAndFontData((prev) => ({
        ...prev,
        colors: {
          primaryColor: content.suggestedColors.primaryColor,
          secondaryColor: content.suggestedColors.secondaryColor,
          backgroundDark: content.suggestedColors.backgroundDark,
        },
      }));

      await new Promise((resolve) => setTimeout(resolve, 500));
      setAiGenerationStep(7);
      setAnimatingField("fonts");

      // Update font
      setColorAndFontData((prev) => ({
        ...prev,
        fonts: {
          primaryFont: content.suggestedFont,
        },
      }));

      // Mark design as completed
      if (!completedStages.includes("design")) {
        setCompletedStages((prev) => [...prev, "design"]);
      }

      // Update page structure
      setAiGenerationStep(8);
      setAnimatingField(null);

      // Process pages and sections
      const { pages: aiPages, sections: aiSections } = convertAIPages(
        content.pages
      );

      // Animate page creation - add pages one by one with delays
      for (let i = 0; i < aiPages.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setAnimatedPages((prev) => [...prev, aiPages[i].id]);
      }

      // Update pages with a delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      setPages(aiPages);

      // Animate section creation - add sections one by one with delays
      for (let i = 0; i < aiSections.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setAnimatedSections((prev) => [...prev, aiSections[i].id]);
      }

      // Update sections with a delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSections(aiSections);
      setShowTreeAnimation(false);

      // Save generated data to localStorage
      localStorage.setItem(
        "webdash_site_info",
        JSON.stringify({
          businessType: content.businessType,
          businessName: content.businessName,
          businessDescription: content.businessDescription,
          websiteTitle: content.websiteTitle,
          websiteDescription: content.websiteDescription,
          websiteKeyphrase: content.websiteKeyphrase,
        })
      );

      localStorage.setItem(
        "webdash_colors_fonts",
        JSON.stringify({
          colors: {
            primaryColor: content.suggestedColors.primaryColor,
            secondaryColor: content.suggestedColors.secondaryColor,
            backgroundDark: content.suggestedColors.backgroundDark,
          },
          fonts: {
            primaryFont: content.suggestedFont,
          },
        })
      );

      // Convert pages to the format expected by the API
      const pagesMeta = content.pages.map((page: any) => ({
        title: page.title,
        description: page.description,
        sections: page.sections.map((section: any) => ({
          section_title: section.section_title,
          section_description: section.section_description,
        })),
      }));

      // Store pages meta for the API
      localStorage.setItem("webdash_pages_meta", JSON.stringify(pagesMeta));

      setAiGenerationStep(9);
      toast({
        title: "AI generation complete",
        description: "Your website details have been generated.",
      });

      // Set editing section to none after generation
      setEditingSection("none");
    } catch (error) {
      console.error("Error generating AI content:", error);
      toast({
        title: "AI generation failed",
        description:
          "An error occurred while generating content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAI(false);
      setAnimatingField(null);
      setShowTreeAnimation(false);
    }
  };

  // 5. useEffect hooks - ALWAYS called in the same order
  useEffect(() => {
    console.log("EditorPage: useEffect triggered");

    // Prevent double initialization
    if (initializeRef.current) {
      console.log("EditorPage: Already initialized, skipping");
      return;
    }
    initializeRef.current = true;

    async function initialize() {
      console.log("EditorPage: Starting initialization");

      try {
        // Check if there's an existing generated website
        const savedWebsite = localStorage.getItem("webdash_website");

        if (savedWebsite) {
          // User has already generated a website - redirect to preview
          toast({
            title: "Website Already Generated",
            description:
              "Your website has already been generated. You can view and manage it from the preview page.",
            variant: "info",
          });
          router.push("/preview");
          return;
        }

        // Get the prompt from localStorage
        const savedPrompt = localStorage.getItem("webdash_prompt");
        if (!savedPrompt) {
          // If no prompt exists, redirect back to homepage
          router.push("/");
          return;
        }

        setPrompt(savedPrompt);

        // Get the site info if it exists
        const savedSiteInfo = localStorage.getItem("webdash_site_info");
        if (savedSiteInfo) {
          try {
            const parsedSiteInfo = JSON.parse(savedSiteInfo);
            setSiteInfo(parsedSiteInfo);
            if (!completedStages.includes("business-info")) {
              setCompletedStages([...completedStages, "business-info"]);
            }
          } catch (error) {
            console.error("Error parsing site info:", error);
          }
        }

        // Get the colors and fonts if they exist
        const savedColorsAndFonts = localStorage.getItem(
          "webdash_colors_fonts"
        );
        if (savedColorsAndFonts) {
          try {
            const parsedData = JSON.parse(savedColorsAndFonts);
            setColorAndFontData(parsedData);
            if (!completedStages.includes("design")) {
              setCompletedStages([...completedStages, "design"]);
            }
          } catch (error) {
            console.error("Error parsing colors and fonts:", error);
          }
        }

        // Check if we should generate AI content
        const shouldGenerateAI = localStorage.getItem(
          "webdash_generate_ai_content"
        );
        if (shouldGenerateAI === "true" && savedPrompt) {
          // Remove the flag
          localStorage.removeItem("webdash_generate_ai_content");

          // Generate AI content after a short delay
          setTimeout(() => {
            generateAIContent(savedPrompt);
          }, 1000);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("EditorPage: Error in initialization:", error);
        setIsLoading(false);
      }
    }

    initialize();
  }, [router, toast]); // Removed completedStages from dependencies to prevent infinite loop

  // Handler functions (defined after all hooks)
  const handleSaveSiteInfo = () => {
    localStorage.setItem("webdash_site_info", JSON.stringify(siteInfo));
    if (!completedStages.includes("business-info")) {
      setCompletedStages([...completedStages, "business-info"]);
    }
    setEditingSection("none");
    toast({
      title: "Site information saved",
      description: "Your site details have been saved.",
    });
  };

  const handleSaveColorAndFonts = () => {
    localStorage.setItem(
      "webdash_colors_fonts",
      JSON.stringify(colorAndFontData)
    );
    if (!completedStages.includes("design")) {
      setCompletedStages([...completedStages, "design"]);
    }
    setEditingSection("none");
    toast({
      title: "Design preferences saved",
      description: "Your colors and fonts have been saved.",
    });
  };

  const handleEditPage = (node: any) => {
    setSelectedNode(node);
    setEditingSection("page-details");
  };

  const handleAddPage = () => {
    const newPageId = `page-${Date.now()}`;
    const newPage = {
      id: newPageId,
      title: "New Page",
      type: "page" as const,
    };

    setPages([...pages, newPage]);
    setAnimatedPages((prev) => [...prev, newPageId]);

    // Remove animation after a delay
    setTimeout(() => {
      setAnimatedPages((prev) => prev.filter((id) => id !== newPageId));
    }, 1000);

    toast({
      title: "Page Added",
      description: "New page has been added to your website.",
    });
  };

  const handleAddSection = (pageId: string) => {
    const newSectionId = `section-${Date.now()}`;
    const newSection = {
      id: newSectionId,
      title: "New Section",
      type: "section" as const,
      parentId: pageId,
    };

    setSections([...sections, newSection]);
    setAnimatedSections((prev) => [...prev, newSectionId]);

    // Remove animation after a delay
    setTimeout(() => {
      setAnimatedSections((prev) => prev.filter((id) => id !== newSectionId));
    }, 1000);

    toast({
      title: "Section Added",
      description: `New section has been added to page ID: ${pageId}`,
    });
  };

  const handleGenerateWebsite = () => {
    setIsLoading(true);

    // Save all the configuration data
    localStorage.setItem("webdash_site_info", JSON.stringify(siteInfo));
    localStorage.setItem(
      "webdash_colors_fonts",
      JSON.stringify(colorAndFontData)
    );

    // Prepare pages meta for API
    const pagesMeta = pages.map((page) => {
      const pageSections = sections.filter(
        (section) => section.parentId === page.id
      );
      return {
        title: page.title,
        description: page.title,
        sections: pageSections.map((section) => ({
          section_title: section.title,
          section_description:
            section.description || `${section.title} content`,
        })),
      };
    });

    // Save pages meta for API
    localStorage.setItem("webdash_pages_meta", JSON.stringify(pagesMeta));

    // Navigate to the preview page
    toast({
      title: "Starting website preview",
      description: "We're preparing your website preview.",
    });

    setTimeout(() => {
      router.push("/preview");
    }, 1500);
  };

  // AI Loading Step Information
  const getAIStepText = () => {
    switch (aiGenerationStep) {
      case 1:
        return "Analyzing your prompt...";
      case 2:
        return "Generating business information...";
      case 3:
        return "Determining business type...";
      case 4:
        return "Creating business description...";
      case 5:
        return "Finalizing business details...";
      case 6:
        return "Selecting color palette...";
      case 7:
        return "Choosing typography...";
      case 8:
        return "Designing page structure...";
      case 9:
        return "Completing AI generation...";
      default:
        return "Generating website content...";
    }
  };

  // Show loading if still initializing
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f58327]"></div>
      </div>
    );
  }

  console.log("EditorPage: About to render main content");

  // Sidebar content function
  const renderSidebarContent = () => {
    return (
      <div className="space-y-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-1">
            Edit your site's structure
          </h2>
          <p className="text-sm text-gray-500">
            The structure is based on your site brief
          </p>
        </div>

        {isGeneratingAI && (
          <motion.div
            className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 overflow-hidden"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center mb-2">
              <Bot className="text-blue-500 mr-2 h-5 w-5" />
              <h3 className="text-blue-700 font-normal">
                AI Generation in Progress
              </h3>
            </div>
            <p className="text-blue-600 text-sm mb-2 relative">
              <AnimatePresence mode="wait">
                <motion.span
                  key={aiGenerationStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="block"
                >
                  {getAIStepText()}
                </motion.span>
              </AnimatePresence>
              <motion.span
                className="absolute inset-0 w-full bg-gradient-to-r from-transparent via-blue-200 to-transparent"
                animate={{ x: ["0%", "100%"] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                style={{ opacity: 0.5 }}
              />
            </p>
            <div className="w-full bg-blue-200 rounded-full h-1.5">
              <motion.div
                className="bg-blue-600 h-1.5 rounded-full"
                initial={{ width: `${(aiGenerationStep / 9) * 100}%` }}
                animate={{ width: `${(aiGenerationStep / 9) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        )}

        {/* Business Info Section */}
        <div className="pb-4" ref={infoFormRef}>
          {editingSection === "business-info" ? (
            <>
              <h3 className="text-sm font-normal text-gray-500 uppercase tracking-wider mb-4">
                Site Brief
              </h3>
              <SiteInfoForm
                siteInfo={siteInfo}
                setSiteInfo={setSiteInfo}
                disabled={isGeneratingAI && aiGenerationStep <= 5}
                animatingField={animatingField}
              />
              <div className="mt-6 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 cursor-pointer"
                  onClick={() => setEditingSection("none")}
                  disabled={isGeneratingAI}
                >
                  Cancel
                </Button>
                <PrimaryButton
                  className="flex-1 cursor-pointer"
                  onClick={handleSaveSiteInfo}
                  disabled={isGeneratingAI}
                >
                  Save
                </PrimaryButton>
              </div>
            </>
          ) : (
            <SiteInfoSummary
              siteInfo={siteInfo}
              onEdit={() => setEditingSection("business-info")}
              disabled={isGeneratingAI}
            />
          )}
        </div>

        <Separator />

        {/* Design Section */}
        <div className="py-4" ref={colorFormRef}>
          {editingSection === "design" ? (
            <>
              <h3 className="text-sm font-normal text-gray-500 uppercase tracking-wider mb-4">
                Design Preferences
              </h3>
              <ColorsAndFonts
                colorAndFontData={colorAndFontData}
                setColorAndFontData={setColorAndFontData}
                disabled={
                  isGeneratingAI &&
                  aiGenerationStep >= 6 &&
                  aiGenerationStep <= 7
                }
                animatingField={animatingField}
              />
              <div className="mt-6 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 cursor-pointer"
                  onClick={() => setEditingSection("none")}
                  disabled={isGeneratingAI}
                >
                  Cancel
                </Button>
                <PrimaryButton
                  className="flex-1 cursor-pointer"
                  onClick={handleSaveColorAndFonts}
                  disabled={isGeneratingAI}
                >
                  Save
                </PrimaryButton>
              </div>
            </>
          ) : (
            <DesignSummary
              colorAndFontData={colorAndFontData}
              onEdit={() => setEditingSection("design")}
              disabled={isGeneratingAI}
            />
          )}
        </div>

        <Separator />

        {/* Page Details Section */}
        <div className="py-4">
          {editingSection === "page-details" && selectedNode ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-normal text-gray-500 uppercase tracking-wider">
                  {selectedNode.type === "page"
                    ? "Page Details"
                    : "Section Details"}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingSection("none")}
                  className="text-gray-500 cursor-pointer"
                  disabled={isGeneratingAI}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-normal text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    value={selectedNode.title}
                    onChange={(e) => {
                      if (selectedNode.type === "page") {
                        setPages(
                          pages.map((p) =>
                            p.id === selectedNode.id
                              ? { ...p, title: e.target.value }
                              : p
                          )
                        );
                      } else {
                        setSections(
                          sections.map((s) =>
                            s.id === selectedNode.id
                              ? { ...s, title: e.target.value }
                              : s
                          )
                        );
                      }
                      setSelectedNode({
                        ...selectedNode,
                        title: e.target.value,
                      });
                    }}
                    disabled={isGeneratingAI}
                  />
                </div>
                <div>
                  <label className="block text-sm font-normal text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md h-32"
                    placeholder={`Enter ${
                      selectedNode.type === "page" ? "page" : "section"
                    } content here...`}
                    value={selectedNode.description || ""}
                    onChange={(e) => {
                      const description = e.target.value;
                      if (selectedNode.type === "page") {
                        setPages(
                          pages.map((p) =>
                            p.id === selectedNode.id ? { ...p, description } : p
                          )
                        );
                      } else {
                        setSections(
                          sections.map((s) =>
                            s.id === selectedNode.id ? { ...s, description } : s
                          )
                        );
                      }
                      setSelectedNode({ ...selectedNode, description });
                    }}
                    disabled={isGeneratingAI}
                  />
                </div>
                {selectedNode.type === "section" && (
                  <div>
                    <label className="block text-sm font-normal text-gray-700 mb-1">
                      Section Type
                    </label>
                    <select
                      className="w-full px-3 py-2 border rounded-md"
                      disabled={isGeneratingAI}
                    >
                      <option value="text">Text</option>
                      <option value="image">Image</option>
                      <option value="gallery">Gallery</option>
                      <option value="form">Form</option>
                      <option value="cta">Call to Action</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="mt-6">
                <PrimaryButton className="w-full" disabled={isGeneratingAI}>
                  Save {selectedNode.type === "page" ? "Page" : "Section"}
                </PrimaryButton>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-normal text-gray-500 uppercase tracking-wider">
                  Page Structure
                </h3>
                <div className="text-xs text-gray-500">
                  Click on a page or section to edit
                </div>
              </div>

              <div className="flex items-center p-3 bg-gray-50 rounded-md border border-dashed">
                <AlertCircle className="h-4 w-4 text-gray-400 mr-2" />
                <p className="text-sm text-gray-500">
                  Select a page or section from the visual editor to customize
                  its content
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Generate Website button - only show if previous stages are completed */}
        {completedStages.includes("business-info") &&
          completedStages.includes("design") && (
            <div className="pt-4 mt-4 border-t">
              <PrimaryButton
                onClick={handleGenerateWebsite}
                disabled={isLoading || isGeneratingAI}
                className="w-full cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    Preview Website
                    <Sparkles className="h-4 w-4 ml-2" />
                  </>
                )}
              </PrimaryButton>

              <div className="flex items-center justify-center mt-3">
                <Info className="h-4 w-4 text-gray-400 mr-1" />
                <p className="text-xs text-gray-500">
                  You can customize your website after previewing
                </p>
              </div>
            </div>
          )}
      </div>
    );
  };

  // Main render - Fixed layout to match the reference image exactly
  return (
    <div className="flex min-h-screen">
      {/* Sidebar on the left */}
      <div className="w-96 border-r bg-white p-6 overflow-y-auto">
        {renderSidebarContent()}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Website Structure section */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Website Structure</h2>

            {/* Progress indicator */}
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  completedStages.includes("business-info")
                    ? "bg-[#FF7300]"
                    : "bg-gray-300"
                }`}
              ></div>
              <div
                className={`h-2 w-2 rounded-full ${
                  completedStages.includes("design")
                    ? "bg-[#FF7300]"
                    : "bg-gray-300"
                }`}
              ></div>
              <div
                className={`h-2 w-2 rounded-full ${
                  editingSection === "page-details"
                    ? "bg-[#FF7300]"
                    : "bg-gray-300"
                }`}
              ></div>
            </div>
          </div>
        </div>

        {/* Visual Page Tree Component - make sure it's visible */}
        <div className="px-6 pb-6 flex-1">
          <div className="h-[calc(100vh-250px)] w-full">
            <VisualPageTree
              pages={pages}
              sections={sections}
              onEditPage={handleEditPage}
              onAddPage={handleAddPage}
              onAddSection={handleAddSection}
              disabled={isGeneratingAI && aiGenerationStep >= 8}
              animatedPages={animatedPages}
              animatedSections={animatedSections}
              showAnimation={showTreeAnimation}
              isGeneratingAI={isGeneratingAI}
              aiGenerationStep={aiGenerationStep}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
