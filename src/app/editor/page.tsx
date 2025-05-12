"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SiteInfoForm } from "@/components/editor/site-info-form";
import { ColorsAndFonts } from "@/components/editor/colors-and-fonts";
import { VisualPageTree } from "@/components/editor/visual-page-tree";
import { SiteInfoSummary } from "@/components/editor/site-info-summary";
import { DesignSummary } from "@/components/editor/design-summary";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Info, AlertCircle } from "lucide-react";
import { PrimaryButton } from "@/components/ui/custom-button";
import { Separator } from "@/components/ui/separator";

// Define the stages of the wizard
type Stage = "business-info" | "design" | "pages";
type EditingSection = "none" | "business-info" | "design" | "page-details";

export default function EditorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [currentStage, setCurrentStage] = useState<Stage>("business-info");
  const [editingSection, setEditingSection] =
    useState<EditingSection>("business-info");
  const [completedStages, setCompletedStages] = useState<Stage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [siteInfo, setSiteInfo] = useState({
    businessType: "",
    businessName: "",
    businessDescription: "",
    websiteTitle: "",
    websiteDescription: "",
    websiteKeyphrase: "",
  });

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
  const initialPages = [
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
      id: "blog",
      title: "Blog",
      type: "page" as const,
    },
  ];

  // Initial sections for the visual page tree
  const initialSections = [
    {
      id: "header",
      title: "Header",
      type: "section" as const,
      parentId: "home",
    },
    { id: "hero", title: "Hero", type: "section" as const, parentId: "home" },
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
    {
      id: "cta",
      title: "Call to Action",
      type: "section" as const,
      parentId: "home",
    },
    {
      id: "footer",
      title: "Footer",
      type: "section" as const,
      parentId: "home",
    },

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
    {
      id: "mission",
      title: "Our Mission",
      type: "section" as const,
      parentId: "about",
    },

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
    {
      id: "service-3",
      title: "Service 3",
      type: "section" as const,
      parentId: "services",
    },

    {
      id: "blog-header",
      title: "Header",
      type: "section" as const,
      parentId: "blog",
    },
    {
      id: "blog-posts",
      title: "Blog Posts",
      type: "section" as const,
      parentId: "blog",
    },
    {
      id: "categories",
      title: "Categories",
      type: "section" as const,
      parentId: "blog",
    },
  ];

  const [pages, setPages] = useState(initialPages);
  const [sections, setSections] = useState(initialSections);
  const [selectedNode, setSelectedNode] = useState<any>(initialPages[0]);

  useEffect(() => {
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
    } else {
      // Use the prompt to suggest initial site info
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
    }

    // Get the colors and fonts if they exist
    const savedColorsAndFonts = localStorage.getItem("webdash_colors_fonts");
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
  }, [router, completedStages]);

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

    // Navigate to the generation page
    toast({
      title: "Starting website generation",
      description: "We're preparing to generate your custom website.",
    });

    setTimeout(() => {
      router.push("/generate");
    }, 1000);
  };

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

        {/* Business Info Section */}
        <div className="pb-4">
          {editingSection === "business-info" ? (
            <>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                Site Brief
              </h3>
              <SiteInfoForm siteInfo={siteInfo} setSiteInfo={setSiteInfo} />
              <div className="mt-6 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 cursor-pointer"
                  onClick={() => setEditingSection("none")}
                >
                  Cancel
                </Button>
                <PrimaryButton
                  className="flex-1 cursor-pointer"
                  onClick={handleSaveSiteInfo}
                >
                  Save
                </PrimaryButton>
              </div>
            </>
          ) : (
            <SiteInfoSummary
              siteInfo={siteInfo}
              onEdit={() => setEditingSection("business-info")}
            />
          )}
        </div>

        <Separator />

        {/* Design Section */}
        <div className="py-4">
          {editingSection === "design" ? (
            <>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                Design Preferences
              </h3>
              <ColorsAndFonts
                colorAndFontData={colorAndFontData}
                setColorAndFontData={setColorAndFontData}
              />
              <div className="mt-6 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 cursor-pointer"
                  onClick={() => setEditingSection("none")}
                >
                  Cancel
                </Button>
                <PrimaryButton
                  className="flex-1 cursor-pointer"
                  onClick={handleSaveColorAndFonts}
                >
                  Save
                </PrimaryButton>
              </div>
            </>
          ) : (
            <DesignSummary
              colorAndFontData={colorAndFontData}
              onEdit={() => setEditingSection("design")}
            />
          )}
        </div>

        <Separator />

        {/* Page Details Section */}
        <div className="py-4">
          {editingSection === "page-details" && selectedNode ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  {selectedNode.type === "page"
                    ? "Page Details"
                    : "Section Details"}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingSection("none")}
                  className="text-gray-500 cursor-pointer"
                >
                  Close
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md h-32"
                    placeholder={`Enter ${
                      selectedNode.type === "page" ? "page" : "section"
                    } content here...`}
                  />
                </div>
                {selectedNode.type === "section" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Section Type
                    </label>
                    <select className="w-full px-3 py-2 border rounded-md">
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
                <PrimaryButton className="w-full">
                  Save {selectedNode.type === "page" ? "Page" : "Section"}
                </PrimaryButton>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
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
                disabled={isLoading}
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
                    Generate Website
                    <Sparkles className="h-4 w-4 ml-2" />
                  </>
                )}
              </PrimaryButton>

              <div className="flex items-center justify-center mt-3">
                <Info className="h-4 w-4 text-gray-400 mr-1" />
                <p className="text-xs text-gray-500">
                  You can always customize it later
                </p>
              </div>
            </div>
          )}
      </div>
    );
  };

  // Fixed layout to match the reference image exactly
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
