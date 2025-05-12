// src/components/editor/design-summary.tsx

"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DesignSummaryProps {
  colorAndFontData: {
    colors: {
      primaryColor: string;
      secondaryColor: string;
      backgroundDark: string;
    };
    fonts: {
      primaryFont: string;
    };
  };
  onEdit: () => void;
  disabled?: boolean;
}

export function DesignSummary({
  colorAndFontData,
  onEdit,
  disabled = false,
}: DesignSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          Design Preferences
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="text-[#FF7300] hover:text-[#E56A00] font-medium cursor-pointer"
          disabled={disabled}
        >
          Edit
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <span className="text-gray-500 block mb-2">Primary font</span>
          <span className="font-medium">
            {colorAndFontData.fonts.primaryFont}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <span className="text-gray-500 block mb-2">Primary color</span>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full border"
                style={{
                  backgroundColor: colorAndFontData.colors.primaryColor,
                }}
              ></div>
              <span className="font-medium">
                {colorAndFontData.colors.primaryColor}
              </span>
            </div>
          </div>

          {isExpanded && (
            <>
              <div>
                <span className="text-gray-500 block mb-2">
                  Secondary color
                </span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border"
                    style={{
                      backgroundColor: colorAndFontData.colors.secondaryColor,
                    }}
                  ></div>
                  <span className="font-medium">
                    {colorAndFontData.colors.secondaryColor}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-gray-500 block mb-2">
                  Background dark
                </span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border"
                    style={{
                      backgroundColor: colorAndFontData.colors.backgroundDark,
                    }}
                  ></div>
                  <span className="font-medium">
                    {colorAndFontData.colors.backgroundDark}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-gray-700 hover:text-gray-900 px-0 font-medium cursor-pointer"
        disabled={disabled}
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
