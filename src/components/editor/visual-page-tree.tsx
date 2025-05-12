// src/components/editor/visual-page-tree.tsx

"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Plus, MoreHorizontal, Pencil, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

interface PageNode {
  id: string;
  title: string;
  type: "page" | "section";
  children?: PageNode[];
  parentId?: string | null;
}

interface VisualPageTreeProps {
  pages: PageNode[];
  sections: PageNode[];
  onEditPage: (page: PageNode) => void;
  onAddPage: () => void;
  onAddSection: (pageId: string) => void;
  disabled?: boolean;
}

export function VisualPageTree({
  pages,
  sections,
  onEditPage,
  onAddPage,
  onAddSection,
  disabled = false,
}: VisualPageTreeProps) {
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // New state for animations
  const [isAnimating, setIsAnimating] = useState(disabled);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(false);

  // Effect to show placeholder during initial load or when disabled
  useEffect(() => {
    if (disabled) {
      setShowPlaceholder(true);
      setIsAnimating(true);

      // Animate progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 1;
        setAnimationProgress(Math.min(progress, 100));
        if (progress >= 100) clearInterval(interval);
      }, 50);

      return () => clearInterval(interval);
    } else {
      setShowPlaceholder(false);
      setIsAnimating(false);
    }
  }, [disabled]);

  const handlePageClick = (page: PageNode) => {
    setSelectedPageId(page.id);
    onEditPage(page);
  };

  // Find the home page
  const homePage = pages.find((page) => page.id === "home") || pages[0];
  // Filter out the home page from other pages
  const subPages = pages.filter((page) => page.id !== homePage.id);

  // Get sections for a specific page
  const getSectionsForPage = (pageId: string) => {
    return sections.filter((section) => section.parentId === pageId);
  };

  const homePageSections = getSectionsForPage(homePage?.id || "");

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    if (
      e.target instanceof HTMLButtonElement ||
      e.target instanceof SVGElement ||
      (e.target as HTMLElement).closest("button")
    ) {
      return; // Don't drag when clicking buttons or SVG elements
    }

    setIsDragging(true);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });

    if (containerRef.current) {
      containerRef.current.style.cursor = "grabbing";
    }
  };

  // Handle touch start for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    if (
      e.target instanceof HTMLButtonElement ||
      e.target instanceof SVGElement ||
      (e.target as HTMLElement).closest("button")
    ) {
      return;
    }

    const touch = e.touches[0];
    setIsDragging(true);
    setStartPos({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  // Zoom functionality
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();

    // Determine zoom direction
    const delta = -e.deltaY;

    // Calculate pointer position relative to content
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Determine new scale
    const newScale = Math.max(0.5, Math.min(2, scale + delta * 0.001));

    // Calculate new position based on pointer position
    const scaleChange = newScale / scale;
    const newPosition = {
      x: x - (x - position.x) * scaleChange,
      y: y - (y - position.y) * scaleChange,
    };

    setScale(newScale);
    setPosition(newPosition);
  };

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y,
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - startPos.x,
        y: touch.clientY - startPos.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (containerRef.current) {
        containerRef.current.style.cursor = "grab";
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, startPos]);

  // Add wheel event listener for zooming
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [scale, position]);

  // Reset position and scale
  const resetView = () => {
    setPosition({ x: 0, y: 0 });
    setScale(1);
  };

  // Render a placeholder during animation or loading
  if (showPlaceholder) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-gray-50 rounded-lg p-6">
        <div className="text-center mb-8">
          <motion.div
            className="text-xl font-normal text-gray-500 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span className="bg-gradient-to-r from-[#FF7300] to-[#FFB880] text-transparent bg-clip-text">
              AI is designing your website structure
            </span>
          </motion.div>

          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mt-2">
            <motion.div
              className="h-full bg-gradient-to-r from-[#FF7300] to-[#FFB880]"
              initial={{ width: 0 }}
              animate={{ width: `${animationProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <p className="text-gray-400 text-sm mt-2">
            Creating pages and sections based on your input
          </p>
        </div>

        <div className="flex flex-col items-center">
          {/* Animated placeholder for home page */}
          <motion.div
            className="w-56 h-14 bg-gray-200 rounded-md mb-4"
            animate={{
              opacity: [0.6, 1, 0.6],
              backgroundColor: ["#e5e7eb", "#f3f4f6", "#e5e7eb"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />

          <div className="h-8 w-0.5 bg-gray-200" />

          {/* Grid of placeholder pages */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="w-40 h-12 bg-gray-200 rounded-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  backgroundColor: ["#e5e7eb", "#f3f4f6", "#e5e7eb"],
                }}
                transition={{
                  delay: i * 0.15,
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-gray-50 rounded-lg"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none", // Prevent browser handling of touch events
      }}
    >
      {/* Draggable and zoomable content */}
      <div
        ref={contentRef}
        className="absolute min-w-[800px] min-h-[600px] p-6 origin-top-left"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isDragging ? "none" : "transform 0.1s ease-out",
        }}
      >
        {/* Home page at the top */}
        <div className="flex flex-col items-center mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={homePage?.id || "home-placeholder"}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "bg-black text-white px-4 py-2 rounded-md flex items-center justify-between w-56 cursor-pointer hover:shadow-lg transition-shadow",
                selectedPageId === homePage?.id ? "ring-2 ring-[#FF7300]" : ""
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (homePage) handlePageClick(homePage);
              }}
            >
              <div className="flex items-center gap-2">
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animate={{ rotate: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </motion.svg>
                <span>{homePage?.title || "Home"}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white hover:bg-white/20 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (homePage) onAddSection(homePage.id);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </motion.div>
          </AnimatePresence>

          {/* Home page sections */}
          <AnimatePresence>
            {homePageSections.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-2 grid grid-cols-3 gap-2 w-[500px]"
              >
                {homePageSections.map((section, index) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "bg-white border px-4 py-2 rounded-md cursor-pointer hover:shadow-md transition-shadow",
                      selectedPageId === section.id
                        ? "ring-2 ring-[#FF7300]"
                        : ""
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePageClick(section);
                    }}
                  >
                    {section.title}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Vertical line connecting to subpages */}
          <motion.div
            className="h-10 w-0.5 bg-gray-300 my-2"
            initial={{ height: 0 }}
            animate={{ height: "40px" }}
            transition={{ duration: 0.3, delay: 0.2 }}
          />
        </div>

        {/* Add Page button */}
        <div className="flex justify-center mb-6">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onAddPage();
              }}
              className="bg-white text-black outline-black/60 outline-1 hover:bg-neutral-100 cursor-pointer shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Page
            </Button>
          </motion.div>
        </div>

        {/* Sub pages */}
        <div className="grid grid-cols-4 gap-8">
          {subPages.map((page, index) => (
            <motion.div
              key={page.id}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              {/* Vertical line connecting from top */}
              <motion.div
                className="h-6 w-0.5 bg-gray-300 mb-2"
                initial={{ height: 0 }}
                animate={{ height: "24px" }}
                transition={{ duration: 0.3 }}
              />

              {/* Page card */}
              <motion.div
                whileHover={{
                  y: -3,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                }}
                className={cn(
                  "bg-black text-white px-4 py-2 rounded-md flex items-center justify-between w-full cursor-pointer transition-all",
                  selectedPageId === page.id ? "ring-2 ring-[#FF7300]" : ""
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePageClick(page);
                }}
              >
                <div className="flex items-center gap-2">
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{ y: [0, 2, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.2,
                    }}
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </motion.svg>
                  <span className="truncate">{page.title}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-white hover:bg-white/20 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddSection(page.id);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Section
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditPage(page);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Page
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>

              {/* Page sections - display in a grid for better spacing */}
              <div className="mt-2 grid grid-cols-1 gap-2 w-full">
                <AnimatePresence>
                  {getSectionsForPage(page.id).map((section, sectionIndex) => (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: sectionIndex * 0.05 }}
                      className={cn(
                        "bg-white border px-4 py-2 rounded-md cursor-pointer hover:shadow-md transition-all",
                        selectedPageId === section.id
                          ? "ring-2 ring-[#FF7300]"
                          : ""
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePageClick(section);
                      }}
                    >
                      {section.title}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Zoom controls - placed in bottom right corner */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white rounded-md shadow-md p-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setScale(Math.min(2, scale + 0.1))}
          className="h-8 w-8"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setScale(Math.max(0.5, scale - 0.1))}
          className="h-8 w-8"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={resetView}
          className="h-8 w-8 text-xs"
        >
          100%
        </Button>
      </div>
    </div>
  );
}
