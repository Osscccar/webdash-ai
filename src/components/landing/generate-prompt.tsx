"use client";
import { useState } from "react";
import type React from "react";

import { Textarea } from "@/components/ui/textarea";
import { CornerRightDown, Loader2, Sparkles } from "lucide-react";
import { PrimaryButton } from "@/components/ui/custom-button";

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
    <div className="space-y-3">
      <div className="flex flex-col space-y-1.5 ">
        <label
          htmlFor="hero-prompt"
          className={`text-lg flex flex-row font-normal transition-colors ${
            isFocused ? "text-[#f58327]" : "text-white"
          }`}
        >
          <p className="flex mr-2">Describe your dream website</p>
          <CornerRightDown width={20} height={20} className="flex mt-2" />
        </label>
        <Textarea
          id="hero-prompt"
          placeholder="Type your business name and briefly describe your business..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          className="min-h-[120px] resize-none bg-white/10 backdrop-blur-sm border-0 text-white placeholder:text-gray-400 focus-visible:ring-[#f58327]/50"
          disabled={isLoading}
        />
        <p className="text-xs text-gray-400 mt-1">
          Press Ctrl+Enter to generate or use the button below
        </p>
      </div>

      <PrimaryButton
        onClick={onGenerate}
        disabled={!prompt.trim() || isLoading}
        className="w-full h-12 text-lg"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Your Website
          </>
        )}
      </PrimaryButton>
    </div>
  );
}
