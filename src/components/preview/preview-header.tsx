"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Laptop, Smartphone } from "lucide-react";

interface PreviewHeaderProps {
  deviceView: "desktop" | "mobile";
  setDeviceView: (view: "desktop" | "mobile") => void;
  onEditClick: () => void;
  hasActiveSubscription: boolean;
}

export function PreviewHeader({
  deviceView,
  setDeviceView,
  onEditClick,
  hasActiveSubscription,
}: PreviewHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl tracking-tight">
              <span className="text-[#f58327]">Web</span>
              <span className="text-black">Dash</span>
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center bg-gray-100 rounded-md p-1">
              <Button
                variant={deviceView === "desktop" ? "default" : "ghost"}
                size="sm"
                className={deviceView === "desktop" ? "bg-white" : ""}
                onClick={() => setDeviceView("desktop")}
              >
                <Laptop className="h-4 w-4 mr-2" />
                Desktop
              </Button>
              <Button
                variant={deviceView === "mobile" ? "default" : "ghost"}
                size="sm"
                className={deviceView === "mobile" ? "bg-white" : ""}
                onClick={() => setDeviceView("mobile")}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Mobile
              </Button>
            </div>

            <Button
              className="bg-[#f58327] hover:bg-[#f58327]/90 text-white"
              onClick={onEditClick}
            >
              {hasActiveSubscription
                ? "Edit Website"
                : "Try 10Web Pro Free for 7 Days"}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
