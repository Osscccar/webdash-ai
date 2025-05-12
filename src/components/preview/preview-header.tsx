// src/components/preview/preview-header.tsx

"use client";

import Link from "next/link";
import { PrimaryButton } from "@/components/ui/custom-button";
import { Button } from "@/components/ui/button";

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
            <PrimaryButton onClick={onEditClick}>
              {hasActiveSubscription
                ? "Edit Website"
                : "Try WebDash Pro Free for 7 Days"}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </header>
  );
}
