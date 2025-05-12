// src/components/preview/website-preview.tsx

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
}

export function WebsitePreview({
  deviceView,
  onElementClick,
  websiteGenerated = false,
}: WebsitePreviewProps) {
  const [siteInfo, setSiteInfo] = useState<any>(null);
  const [websiteUrl, setWebsiteUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div className="space-y-4" ref={containerRef}>
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold mr-4">Website Preview</h2>

          {/* Responsiveness Tabs */}
          <Tabs defaultValue={deviceView} className="w-auto">
            <TabsList className="grid w-auto grid-cols-2 h-9 bg-gray-100">
              <TabsTrigger
                value="desktop"
                onClick={() =>
                  deviceView !== "desktop" && setDeviceView("desktop")
                }
                className="data-[state=active]:bg-white data-[state=active]:text-black rounded-md"
              >
                Desktop
              </TabsTrigger>
              <TabsTrigger
                value="mobile"
                onClick={() =>
                  deviceView !== "mobile" && setDeviceView("mobile")
                }
                className="data-[state=active]:bg-white data-[state=active]:text-black rounded-md"
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
            className="text-gray-500 hover:text-gray-700 focus:ring-2 focus:ring-gray-300"
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
            className="text-gray-500 hover:text-gray-700 focus:ring-2 focus:ring-gray-300"
            title="Open in New Tab"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        className={`mx-auto bg-white shadow-xl overflow-hidden transition-all ${
          deviceView === "mobile" ? "max-w-sm" : "w-full"
        } ${isFullscreen ? "h-[calc(100vh-8rem)]" : ""}`}
      >
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
              className="h-6 w-6 text-gray-400"
            >
              <ArrowLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400"
            >
              <ArrowRight className="h-3 w-3" />
            </Button>
            <div className="bg-white rounded-full h-6 px-3 text-xs text-gray-500 border flex-1 max-w-md truncate">
              {websiteUrl}
            </div>
          </div>
        </div>

        <div className="w-full bg-white">
          <iframe
            ref={iframeRef}
            src={websiteUrl}
            className={`w-full border-0 ${
              isFullscreen
                ? "h-[calc(100vh-12rem)]"
                : deviceView === "mobile"
                ? "h-[600px]"
                : "h-[700px]"
            }`}
            title="Website Preview"
            sandbox="allow-same-origin allow-scripts"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
