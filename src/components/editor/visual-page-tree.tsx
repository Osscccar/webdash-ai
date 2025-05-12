"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Plus, MoreHorizontal, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
}

export function VisualPageTree({
  pages,
  sections,
  onEditPage,
  onAddPage,
  onAddSection,
}: VisualPageTreeProps) {
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

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

  const homePageSections = getSectionsForPage(homePage.id);

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    if (e.target instanceof HTMLButtonElement || e.target instanceof SVGElement)
      return; // Don't drag when clicking buttons or SVG elements
    setIsDragging(true);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
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

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, startPos]);

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-gray-50 rounded-lg"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      {/* Draggable content */}
      <div
        className="absolute min-w-[800px] min-h-[600px] p-6"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
      >
        {/* Home page at the top */}
        <div className="flex flex-col items-center mb-6">
          <div
            className={cn(
              "bg-black text-white px-4 py-2 rounded-md flex items-center justify-between w-56 cursor-pointer",
              selectedPageId === homePage.id ? "ring-2 ring-[#FF7300]" : ""
            )}
            onClick={(e) => {
              e.stopPropagation();
              handlePageClick(homePage);
            }}
          >
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>{homePage.title}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white hover:bg-white/20 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onAddSection(homePage.id);
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Home page sections */}
          <div className="mt-2 grid grid-cols-3 gap-2 w-[500px]">
            {homePageSections.map((section) => (
              <div
                key={section.id}
                className={cn(
                  "bg-white border px-4 py-2 rounded-md cursor-pointer",
                  selectedPageId === section.id ? "ring-2 ring-[#FF7300]" : ""
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePageClick(section);
                }}
              >
                {section.title}
              </div>
            ))}
          </div>

          {/* Vertical line connecting to subpages */}
          <div className="h-10 w-0.5 bg-gray-300 my-2"></div>
        </div>

        {/* Add Page button */}
        <div className="flex justify-center mb-6">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onAddPage();
            }}
            className=" bg-white text-black outline-black/60 outline-1 hover:bg-neutral-100 cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Page
          </Button>
        </div>

        {/* Sub pages */}
        <div className="grid grid-cols-4 gap-8">
          {subPages.map((page) => (
            <div key={page.id} className="flex flex-col items-center">
              {/* Vertical line connecting from top */}
              <div className="h-6 w-0.5 bg-gray-300 mb-2"></div>

              {/* Page card */}
              <div
                className={cn(
                  "bg-black text-white px-4 py-2 rounded-md flex items-center justify-between w-full cursor-pointer",
                  selectedPageId === page.id ? "ring-2 ring-[#FF7300]" : ""
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePageClick(page);
                }}
              >
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
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
              </div>

              {/* Page sections - display in a grid for better spacing */}
              <div className="mt-2 grid grid-cols-1 gap-2 w-full">
                {getSectionsForPage(page.id).map((section) => (
                  <div
                    key={section.id}
                    className={cn(
                      "bg-white border px-4 py-2 rounded-md cursor-pointer",
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
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
