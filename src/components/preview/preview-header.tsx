"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui/custom-button";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Edit,
  ChevronRight,
  Sparkles,
  DiscordLogo,
  LayoutDashboard,
  HomeIcon,
} from "lucide-react";
import WebDashLogo from "../../../public/WebDash.webp";

interface PreviewHeaderProps {
  deviceView: "desktop" | "mobile";
  setDeviceView: (view: "desktop" | "mobile") => void;
  onEditClick: () => void;
  hasActiveSubscription: boolean;
  isGenerating?: boolean; // New prop to indicate if website is being generated
}

export function PreviewHeader({
  deviceView,
  setDeviceView,
  onEditClick,
  hasActiveSubscription,
  isGenerating = false, // Default to false if not provided
}: PreviewHeaderProps) {
  const router = useRouter();

  const handleEditClick = () => {
    if (hasActiveSubscription) {
      // ✅ Set flag that user just generated a website and is going to dashboard
      const hasWebsite = localStorage.getItem("webdash_website");
      if (hasWebsite) {
        sessionStorage.setItem("webdash_just_generated", "true");
      }

      // If user has an active subscription, redirect directly to dashboard
      router.push("/dashboard");
    } else {
      // Otherwise, call the original onEditClick which will open payment card
      onEditClick();
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src={WebDashLogo}
              alt="WebDash logo"
              width={40}
              height={40}
            />
          </Link>

          <div className="flex items-center space-x-4">
            {/* Show Discord component ONLY during generation */}
            {isGenerating && (
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-2 bg-gray-50 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mr-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 127.14 96.36"
                    className="h-8 w-8"
                  >
                    <path
                      fill="#5865F2"
                      d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"
                    />
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Join Discord</span>
                    <span className="text-xs text-gray-500">
                      Get support & updates
                    </span>
                  </div>
                </div>
                <a
                  href="https://discord.gg/wGAC9EZRXz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors"
                >
                  Join
                </a>
              </div>
            )}

            {/* Show Edit & Publish button ONLY when NOT generating */}
            {!isGenerating && (
              <PrimaryButton
                onClick={handleEditClick}
                className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer"
              >
                {hasActiveSubscription ? (
                  <>
                    <HomeIcon className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center">
                      <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                      <span>Edit & Publish</span>
                      <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                    <span className="absolute inset-0 -z-10 bg-gradient-to-r from-orange-500/20 to-orange-600/20 opacity-0 blur-md transition-opacity group-hover:opacity-100"></span>
                  </>
                )}
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
