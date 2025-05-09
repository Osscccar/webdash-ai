"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AVAILABLE_FONTS } from "@/config/tenweb";
import { Label } from "@/components/ui/label";
import { HexColorPicker } from "react-colorful";
import { useToast } from "@/components/ui/use-toast";

export function ColorsAndFonts() {
  const { toast } = useToast();
  const [primaryColor, setPrimaryColor] = useState("#ff69b4");
  const [secondaryColor, setSecondaryColor] = useState("#ffd700");
  const [backgroundDark, setBackgroundDark] = useState("#212121");
  const [primaryFont, setPrimaryFont] = useState("Montserrat");
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);

    // In a real implementation, this would save to the database or API
    // For now, we'll just simulate the save
    const colorAndFontData = {
      colors: {
        primaryColor,
        secondaryColor,
        backgroundDark,
      },
      fonts: {
        primaryFont,
      },
    };

    // Save to localStorage for demo purposes
    localStorage.setItem(
      "webdash_colors_fonts",
      JSON.stringify(colorAndFontData)
    );

    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Color and font preferences saved",
        description: "Your customizations have been applied to your website.",
      });
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Primary Color */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Primary Color</Label>
              <div
                className="h-10 w-10 rounded-full cursor-pointer border border-gray-200"
                style={{ backgroundColor: primaryColor }}
                onClick={() =>
                  setActiveColorPicker(
                    activeColorPicker === "primary" ? null : "primary"
                  )
                }
              />
            </div>
            {activeColorPicker === "primary" && (
              <div className="relative z-10">
                <div
                  className="fixed inset-0"
                  onClick={() => setActiveColorPicker(null)}
                />
                <div className="absolute right-0 top-0">
                  <HexColorPicker
                    color={primaryColor}
                    onChange={setPrimaryColor}
                  />
                  <div className="bg-white p-2 mt-2 text-center border rounded shadow">
                    <span className="text-sm font-mono">{primaryColor}</span>
                  </div>
                </div>
              </div>
            )}
            <div
              className="p-4 rounded-md"
              style={{ backgroundColor: primaryColor }}
            >
              <p className="text-white text-center font-medium">
                Primary Color
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Used for buttons, links, and important UI elements.
            </p>
          </div>

          {/* Secondary Color */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Secondary Color</Label>
              <div
                className="h-10 w-10 rounded-full cursor-pointer border border-gray-200"
                style={{ backgroundColor: secondaryColor }}
                onClick={() =>
                  setActiveColorPicker(
                    activeColorPicker === "secondary" ? null : "secondary"
                  )
                }
              />
            </div>
            {activeColorPicker === "secondary" && (
              <div className="relative z-10">
                <div
                  className="fixed inset-0"
                  onClick={() => setActiveColorPicker(null)}
                />
                <div className="absolute right-0 top-0">
                  <HexColorPicker
                    color={secondaryColor}
                    onChange={setSecondaryColor}
                  />
                  <div className="bg-white p-2 mt-2 text-center border rounded shadow">
                    <span className="text-sm font-mono">{secondaryColor}</span>
                  </div>
                </div>
              </div>
            )}
            <div
              className="p-4 rounded-md"
              style={{ backgroundColor: secondaryColor }}
            >
              <p className="text-gray-800 text-center font-medium">
                Secondary Color
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Used for accents, highlights, and secondary elements.
            </p>
          </div>

          {/* Background Dark */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Background Dark</Label>
              <div
                className="h-10 w-10 rounded-full cursor-pointer border border-gray-200"
                style={{ backgroundColor: backgroundDark }}
                onClick={() =>
                  setActiveColorPicker(
                    activeColorPicker === "background" ? null : "background"
                  )
                }
              />
            </div>
            {activeColorPicker === "background" && (
              <div className="relative z-10">
                <div
                  className="fixed inset-0"
                  onClick={() => setActiveColorPicker(null)}
                />
                <div className="absolute right-0 top-0">
                  <HexColorPicker
                    color={backgroundDark}
                    onChange={setBackgroundDark}
                  />
                  <div className="bg-white p-2 mt-2 text-center border rounded shadow">
                    <span className="text-sm font-mono">{backgroundDark}</span>
                  </div>
                </div>
              </div>
            )}
            <div
              className="p-4 rounded-md"
              style={{ backgroundColor: backgroundDark }}
            >
              <p className="text-white text-center font-medium">
                Background Dark
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Used for footers, dark sections, and contrast areas.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Typography</h2>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="primary-font">Primary Font</Label>
            <Select value={primaryFont} onValueChange={setPrimaryFont}>
              <SelectTrigger id="primary-font" className="w-full">
                <SelectValue placeholder="Select a font" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_FONTS.map((font) => (
                  <SelectItem key={font} value={font}>
                    <span style={{ fontFamily: font }}>{font}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              The main font used throughout your website.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <h3
              className="text-lg font-medium mb-2"
              style={{ fontFamily: primaryFont }}
            >
              Font Preview: {primaryFont}
            </h3>
            <p style={{ fontFamily: primaryFont }} className="mb-2">
              This is how your body text will look using the {primaryFont} font.
            </p>
            <h4
              style={{ fontFamily: primaryFont }}
              className="text-xl font-bold mb-2"
            >
              Heading Example
            </h4>
            <p style={{ fontFamily: primaryFont }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="bg-[#f58327] hover:bg-[#f58327]/90 text-white"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Colors & Fonts"}
        </Button>
      </div>
    </div>
  );
}
