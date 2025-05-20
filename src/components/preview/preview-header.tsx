"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui/custom-button";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Edit } from "lucide-react";
import WebDashLogo from "../../../public/WebDash.webp";

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
  const router = useRouter();

  // Handle edit click based on subscription status
  const handleEditClick = () => {
    if (hasActiveSubscription) {
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
            <PrimaryButton onClick={handleEditClick}>
              <Edit className="mr-2 h-4 w-4" />
              {hasActiveSubscription ? "Edit & Publish" : "Edit & Publish"}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </header>
  );
}
