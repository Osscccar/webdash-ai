"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface GeneratePromptProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export function GeneratePrompt({
  prompt,
  setPrompt,
  onGenerate,
  isLoading,
}: GeneratePromptProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      onGenerate();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-1.5">
        <label
          htmlFor="hero-prompt"
          className={`text-lg font-medium transition-colors ${
            isFocused ? "text-[#f58327]" : "text-gray-900"
          }`}
        >
          Describe your dream website:
        </label>
        <Textarea
          id="hero-prompt"
          placeholder="e.g., A modern website for my coffee shop with a menu, about page, and contact form..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          className="min-h-[120px] resize-none border-gray-300 focus:ring-[#f58327] focus:border-[#f58327]"
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 mt-1">
          Press Ctrl+Enter to generate or use the button below
        </p>
      </div>

      <Button
        onClick={onGenerate}
        disabled={!prompt.trim() || isLoading}
        className="w-full bg-[#f58327] hover:bg-[#f58327]/90 text-white"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          "Generate Your Website"
        )}
      </Button>
    </div>
  );
}
