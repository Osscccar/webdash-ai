"use client";

import Link from "next/link";
import { PrimaryButton } from "@/components/ui/custom-button";
import { Button } from "@/components/ui/button";
// Fix the import statement
import WebDashLogo from "../../../public/WebDash.webp";
import Image from "next/image";
import { Edit } from "lucide-react";

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
            {/* Use the Next.js Image component correctly */}
            <Image src={WebDashLogo} alt="WebDash lgo" width={40} height={40} />
          </Link>

          <div className="flex items-center space-x-4">
            <PrimaryButton onClick={onEditClick}>
              <Edit />
              {hasActiveSubscription ? "Edit & Publish" : "Open Dashboard"}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </header>
  );
}
