"use client";

import { useState, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { AlertCircle, InfoIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isBackgroundColor?: boolean;
}

export function ColorPicker({
  label,
  value,
  onChange,
  isBackgroundColor = false,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempColor, setTempColor] = useState(value);

  // Update the temp color when the value prop changes
  useEffect(() => {
    setTempColor(value);
  }, [value]);

  // Handle color change from the color picker
  const handleColorChange = (newColor: string) => {
    setTempColor(newColor);

    // Only update the parent if it's not the background color
    if (!isBackgroundColor) {
      onChange(newColor);
    }
  };

  // Toggle the color picker popup
  const togglePicker = () => {
    if (isBackgroundColor) {
      // Don't open the picker if it's background color
      return;
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="space-y-2">
      {isBackgroundColor && (
        <Alert className="bg-blue-50 border-blue-200 text-blue-800 mb-2">
          <InfoIcon className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-blue-700">Coming Soon</AlertTitle>
          <AlertDescription className="text-blue-600 text-sm">
            Editing the background color is coming soon. Currently, it&apos;s
            set to white (#FFFFFF).
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div
          className={`relative h-6 w-6 rounded-full border cursor-pointer shadow-sm ${
            isBackgroundColor ? "opacity-50 cursor-not-allowed" : ""
          }`}
          style={{ backgroundColor: tempColor }}
          onClick={togglePicker}
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-30 mt-1"
          >
            <Card className="shadow-lg border border-gray-200">
              <CardContent className="p-3">
                <HexColorPicker
                  color={tempColor}
                  onChange={handleColorChange}
                />
                <div className="flex justify-between mt-3">
                  <div className="text-xs text-gray-500">
                    {tempColor.toUpperCase()}
                  </div>
                  <button
                    className="text-xs text-[#f58327] hover:underline cursor-pointer"
                    onClick={() => setIsOpen(false)}
                  >
                    Done
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        type="text"
        value={tempColor}
        onChange={(e) => handleColorChange(e.target.value)}
        className={`w-full rounded-md border-gray-300 shadow-sm focus:border-[#f58327] focus:ring-[#f58327] text-sm ${
          isBackgroundColor ? "bg-gray-100 opacity-75 cursor-not-allowed" : ""
        }`}
        disabled={isBackgroundColor}
      />
    </div>
  );
}

export function ColorSelectorGroup({
  colors,
  onChange,
}: {
  colors: {
    primaryColor: string;
    secondaryColor: string;
    backgroundDark: string;
  };
  onChange: (colors: any) => void;
}) {
  const handleColorChange = (key: string, value: string) => {
    onChange({
      ...colors,
      [key]: value,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-md font-medium text-gray-900">Website Colors</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ColorPicker
          label="Primary Color"
          value={colors.primaryColor}
          onChange={(value) => handleColorChange("primaryColor", value)}
        />

        <ColorPicker
          label="Secondary Color"
          value={colors.secondaryColor}
          onChange={(value) => handleColorChange("secondaryColor", value)}
        />

        <ColorPicker
          label="Background Color"
          value="#FFFFFF" // Force white color
          onChange={(value) => {}} // No-op
          isBackgroundColor={true} // Indicate this is the background color
        />
      </div>
    </div>
  );
}
