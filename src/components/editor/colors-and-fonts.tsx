// src/components/editor/colors-and-fonts.tsx

"use client";

import type React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ColorsAndFontsProps {
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
  setColorAndFontData: React.Dispatch<
    React.SetStateAction<{
      colors: {
        primaryColor: string;
        secondaryColor: string;
        backgroundDark: string;
      };
      fonts: {
        primaryFont: string;
      };
    }>
  >;
  disabled?: boolean;
}

export function ColorsAndFonts({
  colorAndFontData,
  setColorAndFontData,
  disabled = false,
}: ColorsAndFontsProps) {
  const fontOptions = [
    "Montserrat",
    "Roboto",
    "Open Sans",
    "Lato",
    "Poppins",
    "Raleway",
    "Oswald",
    "Playfair Display",
    "Merriweather",
  ];

  const handleColorChange = (
    colorType: "primaryColor" | "secondaryColor" | "backgroundDark",
    value: string
  ) => {
    setColorAndFontData({
      ...colorAndFontData,
      colors: {
        ...colorAndFontData.colors,
        [colorType]: value,
      },
    });
  };

  const handleFontChange = (value: string) => {
    setColorAndFontData({
      ...colorAndFontData,
      fonts: {
        ...colorAndFontData.fonts,
        primaryFont: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium mb-4">Brand Colors</h3>
        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full border ${
                  disabled ? "animate-pulse" : ""
                }`}
                style={{
                  backgroundColor: colorAndFontData.colors.primaryColor,
                }}
              ></div>
              <Input
                id="primaryColor"
                type="text"
                value={colorAndFontData.colors.primaryColor}
                onChange={(e) =>
                  handleColorChange("primaryColor", e.target.value)
                }
                className={`w-full ${
                  disabled ? "bg-gray-50 animate-pulse" : ""
                }`}
                disabled={disabled}
              />
            </div>
            <div className="text-sm text-gray-500">
              Used for buttons, links, and important UI elements.
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full border ${
                  disabled ? "animate-pulse" : ""
                }`}
                style={{
                  backgroundColor: colorAndFontData.colors.secondaryColor,
                }}
              ></div>
              <Input
                id="secondaryColor"
                type="text"
                value={colorAndFontData.colors.secondaryColor}
                onChange={(e) =>
                  handleColorChange("secondaryColor", e.target.value)
                }
                className={`w-full ${
                  disabled ? "bg-gray-50 animate-pulse" : ""
                }`}
                disabled={disabled}
              />
            </div>
            <div className="text-sm text-gray-500">
              Used for accents, highlights, and secondary elements.
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="backgroundDark">Background Dark</Label>
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full border ${
                  disabled ? "animate-pulse" : ""
                }`}
                style={{
                  backgroundColor: colorAndFontData.colors.backgroundDark,
                }}
              ></div>
              <Input
                id="backgroundDark"
                type="text"
                value={colorAndFontData.colors.backgroundDark}
                onChange={(e) =>
                  handleColorChange("backgroundDark", e.target.value)
                }
                className={`w-full ${
                  disabled ? "bg-gray-50 animate-pulse" : ""
                }`}
                disabled={disabled}
              />
            </div>
            <div className="text-sm text-gray-500">
              Used for footers, dark sections, and contrast areas.
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base font-medium mb-4">Typography</h3>
        <div className="space-y-3">
          <Label htmlFor="primaryFont">Primary Font</Label>
          <Select
            value={colorAndFontData.fonts.primaryFont}
            onValueChange={handleFontChange}
            disabled={disabled}
          >
            <SelectTrigger
              id="primaryFont"
              className={`w-full ${disabled ? "bg-gray-50 animate-pulse" : ""}`}
            >
              <SelectValue placeholder="Select a font" />
            </SelectTrigger>
            <SelectContent>
              {fontOptions.map((font) => (
                <SelectItem key={font} value={font}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-sm text-gray-500">
            Used for all text on your website.
          </div>
        </div>
      </div>
    </div>
  );
}
