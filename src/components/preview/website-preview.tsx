"use client";

import { useState, useEffect, useRef } from "react";
import {
  ExternalLink,
  Maximize,
  Minimize,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrimaryButton } from "@/components/ui/custom-button";

interface WebsitePreviewProps {
  deviceView: "desktop" | "mobile";
  onElementClick: () => void;
  websiteGenerated?: boolean;
  onDeviceViewChange?: (view: "desktop" | "mobile") => void;
}

export function WebsitePreview({
  deviceView,
  onElementClick,
  websiteGenerated = false,
  onDeviceViewChange,
}: WebsitePreviewProps) {
  const [siteInfo, setSiteInfo] = useState<any>(null);
  const [websiteUrl, setWebsiteUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentDeviceView, setCurrentDeviceView] = useState<
    "desktop" | "mobile"
  >(deviceView);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update local state when prop changes
  useEffect(() => {
    setCurrentDeviceView(deviceView);
    // Reset iframe loading state when view changes
    setIframeLoading(true);
  }, [deviceView]);

  useEffect(() => {
    // Get the site info and website data from localStorage
    const savedInfo = localStorage.getItem("webdash_site_info");
    const savedWebsite = localStorage.getItem("webdash_website");
    const savedSubdomain = localStorage.getItem("webdash_subdomain");

    setIsLoading(true);

    if (savedInfo) {
      try {
        setSiteInfo(JSON.parse(savedInfo));
      } catch (e) {
        console.error("Error parsing site info:", e);
      }
    }

    // Try to get the website URL from various sources
    if (savedWebsite) {
      try {
        const websiteData = JSON.parse(savedWebsite);
        setWebsiteUrl(websiteData.siteUrl);
        setIsLoading(false);
      } catch (e) {
        console.error("Error parsing website data:", e);
      }
    } else if (savedSubdomain) {
      // Construct URL from subdomain if website object not available
      // Using correct webdash.site domain
      setWebsiteUrl(`https://${savedSubdomain}.webdash.site`);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [websiteGenerated]);

  // Toggle fullscreen mode for the preview
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      setIsFullscreen(true);
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      setIsFullscreen(false);
      document.exitFullscreen();
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const openInNewTab = () => {
    if (websiteUrl) {
      window.open(websiteUrl, "_blank");
    }
  };

  // Handle iframe load event
  const handleIframeLoad = () => {
    setIframeLoading(false);
  };

  // Function to handle device view change
  const handleDeviceViewChange = (view: "desktop" | "mobile") => {
    if (view === currentDeviceView) return;
    setCurrentDeviceView(view);
    setIframeLoading(true); // Reset iframe loading on view change
    if (onDeviceViewChange) {
      onDeviceViewChange(view);
    }
  };

  // Function to create iframe source URL with parameters
  const getIframeUrl = () => {
    if (!websiteUrl) return "";

    // Add parameters to prevent caching
    const url = new URL(websiteUrl);
    url.searchParams.set("preview", "true");
    url.searchParams.set("t", Date.now().toString());

    return url.toString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f58327] mb-4"></div>
          <h2 className="text-2xl font-medium mb-2">Loading Preview...</h2>
          <p className="text-gray-500">
            Your website preview is being prepared.
          </p>
        </div>
      </div>
    );
  }

  if (!websiteUrl) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-medium mb-2">No Website Found</h2>
          <p className="text-gray-500">
            Please wait for your website to be generated.
          </p>
        </div>
      </div>
    );
  }

  if (!websiteGenerated) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center opacity-50">
          <h2 className="text-2xl font-medium mb-2">Website Preview</h2>
          <p className="text-gray-500">
            Please sign in to view your website preview.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-4 -mx-4 md:-mx-6 lg:-mx-8 xl:-mx-12"
      ref={containerRef}
    >
      <div className="flex justify-between items-center px-4 md:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold mr-4">Website Preview</h2>

          {/* Responsiveness Tabs */}
          <Tabs value={currentDeviceView} className="w-auto">
            <TabsList className="grid w-auto grid-cols-2 h-9 bg-gray-100">
              <TabsTrigger
                value="desktop"
                onClick={() => handleDeviceViewChange("desktop")}
                className="data-[state=active]:bg-white data-[state=active]:text-black rounded-md cursor-pointer"
              >
                Desktop
              </TabsTrigger>
              <TabsTrigger
                value="mobile"
                onClick={() => handleDeviceViewChange("mobile")}
                className="data-[state=active]:bg-white data-[state=active]:text-black rounded-md cursor-pointer"
              >
                Mobile
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex space-x-2">
          {/* Fullscreen Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            className="text-gray-500 hover:text-gray-700 focus:ring-2 focus:ring-gray-300 cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>

          {/* Open in New Tab Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={openInNewTab}
            className="text-gray-500 hover:text-gray-700 focus:ring-2 focus:ring-gray-300 cursor-pointer"
            title="Open in New Tab"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {currentDeviceView === "mobile" ? (
        // Mobile (iPhone) view
        <div
          className={`mx-auto transition-all duration-300 px-4 md:px-6 lg:px-8 xl:px-12 ${
            isFullscreen ? "h-[calc(100vh-8rem)]" : ""
          }`}
        >
          <div className="relative mx-auto w-[375px] h-[750px] rounded-[55px] bg-black overflow-hidden shadow-xl">
            {/* iPhone notch */}
            <div className="absolute top-0 left-0 right-0 z-10 flex justify-center">
              <div className="bg-black w-[180px] h-[30px] rounded-b-[14px]"></div>
            </div>
            {/* Power button */}
            <div className="absolute right-[-4px] top-[120px] h-[64px] w-[4px] bg-gray-600 rounded-l-sm"></div>
            {/* Volume buttons */}
            <div className="absolute left-[-4px] top-[120px] h-[32px] w-[4px] bg-gray-600 rounded-r-sm"></div>
            <div className="absolute left-[-4px] top-[170px] h-[64px] w-[4px] bg-gray-600 rounded-r-sm"></div>

            {/* iPhone frame inner */}
            <div className="absolute top-[12px] left-[12px] right-[12px] bottom-[12px] bg-black rounded-[44px] overflow-hidden">
              {/* Status bar */}
              <div className="h-[48px] bg-black w-full flex justify-between items-center px-6 pt-2">
                <div className="text-white text-xs">9:41</div>
                <div className="flex items-center space-x-1">
                  <div className="h-3 w-3 rounded-full border border-white"></div>
                  <div className="h-3 w-4 flex items-end justify-end space-x-px">
                    <div className="h-1.5 w-0.5 bg-white"></div>
                    <div className="h-2 w-0.5 bg-white"></div>
                    <div className="h-2.5 w-0.5 bg-white"></div>
                    <div className="h-3 w-0.5 bg-white"></div>
                  </div>
                  <div className="text-white text-xs">100%</div>
                </div>
              </div>

              {/* Website content with loading indicator */}
              <div className="w-full h-[calc(100%-48px)] bg-white relative">
                {/* Loading spinner that disappears when iframe loads */}
                {iframeLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f58327]"></div>
                  </div>
                )}

                <iframe
                  ref={iframeRef}
                  src={getIframeUrl()}
                  className="w-full h-full border-0 transition-opacity duration-300"
                  style={{
                    opacity: iframeLoading ? 0.3 : 1,
                    width: "100%",
                    height: "100%",
                  }}
                  title="Mobile Website Preview"
                  sandbox="allow-same-origin allow-scripts"
                  loading="lazy"
                  onLoad={handleIframeLoad}
                />
              </div>
            </div>

            {/* Home indicator */}
            <div className="absolute bottom-[8px] left-[50%] transform translate-x-[-50%] w-[140px] h-[5px] bg-white rounded-full"></div>
          </div>
        </div>
      ) : (
        // Desktop view - FULL EDGE-TO-EDGE with NO PADDING
        <div className="w-full overflow-hidden bg-white shadow-xl">
          <div className="w-full h-10 bg-gray-100 flex items-center px-4 border-b">
            <div className="flex items-center space-x-1.5">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center space-x-2 mx-auto">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-400 cursor-pointer"
              >
                <ArrowLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-400 cursor-pointer"
              >
                <ArrowRight className="h-3 w-3" />
              </Button>
              <div className="bg-white items-center justify-items-center justify-center rounded-full h-fit p-1 px-3 text-xs text-gray-500 border flex-1 max-w-md truncate">
                <p className="">{websiteUrl}</p>
              </div>
            </div>
          </div>

          {/* ABSOLUTELY NO PADDING OR MARGIN CONTAINER */}
          <div className="w-full bg-white relative p-0 m-0">
            {/* Loading spinner that disappears when iframe loads */}
            {iframeLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f58327]"></div>
              </div>
            )}

            {/* FULL EDGE-TO-EDGE IFRAME */}
            <iframe
              ref={iframeRef}
              src={getIframeUrl()}
              className="border-0 transition-opacity duration-300 w-full"
              style={{
                opacity: iframeLoading ? 0.3 : 1,
                height: isFullscreen ? "calc(100vh - 12rem)" : "700px",
                display: "block",
                padding: 0,
                margin: 0,
                border: 0,
              }}
              title="Website Preview"
              sandbox="allow-same-origin allow-scripts"
              loading="lazy"
              onLoad={handleIframeLoad}
            />
          </div>
        </div>
      )}
    </div>
  );
}
