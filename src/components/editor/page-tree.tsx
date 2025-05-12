"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  Plus,
  Edit,
  Trash,
  MoreHorizontal,
} from "lucide-react";
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
  isExpanded?: boolean;
}

interface PageTreeProps {
  initialPages: PageNode[];
  onEditPage: (page: PageNode) => void;
  onAddPage: () => void;
  onAddSection: (pageId: string) => void;
}

export function PageTree({
  initialPages,
  onEditPage,
  onAddPage,
  onAddSection,
}: PageTreeProps) {
  const [pages, setPages] = useState<PageNode[]>(initialPages);
  const [activePageId, setActivePageId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setPages((prevPages) =>
      prevPages.map((page) => {
        if (page.id === id) {
          return { ...page, isExpanded: !page.isExpanded };
        }
        if (page.children) {
          return {
            ...page,
            children: page.children.map((child) =>
              child.id === id
                ? { ...child, isExpanded: !child.isExpanded }
                : child
            ),
          };
        }
        return page;
      })
    );
  };

  const handlePageClick = (page: PageNode) => {
    setActivePageId(page.id);
    if (page.type === "page") {
      onEditPage(page);
    }
  };

  const renderPageNode = (node: PageNode, level = 0) => {
    const isPage = node.type === "page";
    const hasChildren = node.children && node.children.length > 0;
    const isActive = activePageId === node.id;

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            "flex items-center py-1 px-2 rounded-md my-1 cursor-pointer group",
            isActive ? "bg-gray-100" : "hover:bg-gray-50",
            level > 0 && "ml-4"
          )}
          onClick={() => handlePageClick(node)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
              className="mr-1 p-1 rounded-sm hover:bg-gray-200"
            >
              {node.isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <span className="w-5" />
          )}

          {isPage ? (
            <Folder className="h-4 w-4 mr-2 text-gray-500" />
          ) : (
            <File className="h-4 w-4 mr-2 text-gray-500" />
          )}

          <span className="flex-1 truncate text-sm">{node.title}</span>

          <div className="opacity-0 group-hover:opacity-100 flex items-center">
            {isPage && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddSection(node.id);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-pointer">
                  <Edit className="h-3.5 w-3.5 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-red-600">
                  <Trash className="h-3.5 w-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {node.isExpanded && node.children && (
          <div className="ml-2 pl-2 border-l border-gray-200">
            {node.children.map((child) => renderPageNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-normal">Website Structure</h3>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs bg-[#]"
          onClick={onAddPage}
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Page
        </Button>
      </div>

      <div className="space-y-1">
        {pages.map((page) => renderPageNode(page))}
      </div>
    </div>
  );
}
