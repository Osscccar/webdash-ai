"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SiteInfoSummaryProps {
  siteInfo: {
    businessType: string;
    businessName: string;
    businessDescription: string;
    websiteTitle: string;
    websiteDescription: string;
    websiteKeyphrase: string;
  };
  onEdit: () => void;
}

export function SiteInfoSummary({ siteInfo, onEdit }: SiteInfoSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          Site Brief
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="text-[#FF7300] hover:text-[#E56A00] font-medium cursor-pointer"
        >
          Edit
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-500">Business name</span>
          <span className="font-medium">
            {siteInfo.businessName || "Not set"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Business type</span>
          <span className="font-medium">
            {siteInfo.businessType || "Not set"}
          </span>
        </div>

        {isExpanded && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-500">Website title</span>
              <span className="font-medium">
                {siteInfo.websiteTitle || "Not set"}
              </span>
            </div>

            <div className="pt-2">
              <span className="text-gray-500 block mb-1">
                Business description
              </span>
              <p className="text-sm">
                {siteInfo.businessDescription || "No description provided."}
              </p>
            </div>

            <div className="pt-2">
              <span className="text-gray-500 block mb-1">
                Website description
              </span>
              <p className="text-sm">
                {siteInfo.websiteDescription || "No description provided."}
              </p>
            </div>
          </>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-gray-700 hover:text-gray-900 px-0 font-medium cursor-pointer"
      >
        {isExpanded ? (
          <>
            Show Less <ChevronUp className="ml-1 h-4 w-4" />
          </>
        ) : (
          <>
            Show More <ChevronDown className="ml-1 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}
