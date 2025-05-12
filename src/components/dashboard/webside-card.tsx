"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserWebsite } from "@/types";
import {
  MoreVertical,
  ExternalLink,
  Edit,
  Clock,
  BarChart3,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

interface WebsiteCardProps {
  website: UserWebsite;
  onWebsiteClick: (website: UserWebsite) => void;
  onOpenWPDashboard: (website: UserWebsite) => void;
  isLoading: boolean;
  activeWebsiteId: string | null;
}

export function WebsiteCard({
  website,
  onWebsiteClick,
  onOpenWPDashboard,
  isLoading,
  activeWebsiteId,
}: WebsiteCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer"
      onClick={() => onWebsiteClick(website)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-start">
        <div>
          <h3 className="font-medium text-lg truncate">
            {website.title || "My Website"}
          </h3>
          <div className="flex items-center mt-1">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2"></span>
            <span className="text-sm text-gray-500 capitalize">
              {website.status || "active"}
            </span>
          </div>
        </div>
        <div className="relative">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-8 cursor-pointer"
              >
                <MoreVertical className="h-5 w-5 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(website.siteUrl, "_blank");
                }}
                className="cursor-pointer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Website
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  router.push("/editor");
                }}
                className="cursor-pointer"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Website
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenWPDashboard(website);
                }}
                className="cursor-pointer"
              >
                <Settings className="h-4 w-4 mr-2" />
                WordPress Dashboard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Website Preview */}
      <div className="relative">
        <div className="aspect-video bg-gray-100 p-4 flex items-center justify-center">
          <div className="w-full">
            <div className="h-2 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-1 bg-gray-200 rounded mb-1 w-3/4"></div>
            <div className="h-1 bg-gray-200 rounded mb-1 w-5/6"></div>
            <div className="h-1 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>

        {/* Hover Overlay */}
        <div
          className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-white text-gray-800 hover:bg-white/90 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                window.open(website.siteUrl, "_blank");
              }}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Visit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white text-gray-800 hover:bg-white/90 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                router.push("/editor");
              }}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Website Info */}
      <div className="p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">URL</span>
          <a
            href={website.siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#f58327] hover:underline truncate max-w-[200px] flex items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {website.siteUrl?.replace(/^https?:\/\//, "") ||
              "website.webdash.site"}
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 flex items-center">
            <Clock className="h-3 w-3 mr-1 text-gray-400" />
            Created
          </span>
          <span>
            {website.createdAt
              ? new Date(website.createdAt).toLocaleDateString()
              : "N/A"}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 flex items-center">
            <BarChart3 className="h-3 w-3 mr-1 text-gray-400" />
            Analytics
          </span>
          <Badge variant="outline" className="text-xs bg-gray-50">
            0 visitors
          </Badge>
        </div>
      </div>

      {/* Card Footer */}
      <div className="p-4 border-t border-gray-100 flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            toast({
              title: "Add collaborators",
              description: "This feature is coming soon!",
            });
          }}
          className="text-gray-500 hover:text-[#f58327] text-xs cursor-pointer p-0 h-auto"
        >
          <Users className="h-4 w-4 mr-1" />
          <span>Collaborators</span>
        </Button>

        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onOpenWPDashboard(website);
          }}
          className="bg-[#f58327] hover:bg-[#f58327]/90 text-white cursor-pointer"
          disabled={isLoading && activeWebsiteId === website.id}
        >
          {isLoading && activeWebsiteId === website.id ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Opening...
            </span>
          ) : (
            <>
              <Settings className="h-4 w-4 mr-2" />
              <span>Manage</span>
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

export function WebsitesList({
  websites,
  onWebsiteClick,
  onOpenWPDashboard,
  isLoading,
  activeWebsiteId,
}: {
  websites: UserWebsite[];
  onWebsiteClick: (website: UserWebsite) => void;
  onOpenWPDashboard: (website: UserWebsite) => void;
  isLoading: boolean;
  activeWebsiteId: string | null;
}) {
  if (!websites || websites.length === 0) {
    return <EmptyWebsiteState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {websites.map((website) => (
        <WebsiteCard
          key={website.id}
          website={website}
          onWebsiteClick={onWebsiteClick}
          onOpenWPDashboard={onOpenWPDashboard}
          isLoading={isLoading}
          activeWebsiteId={activeWebsiteId}
        />
      ))}
    </div>
  );
}

export function EmptyWebsiteState() {
  const router = useRouter();

  return (
    <div className="bg-white rounded-lg border border-dashed border-gray-300 p-8 text-center">
      <div className="space-y-4">
        <h3 className="text-xl font-normal">No websites found</h3>
        <p className="text-gray-500">
          You haven't created any websites yet. Get started by creating your
          first AI-powered website.
        </p>
        <Button
          onClick={() => router.push("/")}
          className="bg-[#f58327] hover:bg-[#f58327]/90 text-white px-4 py-2 mt-2 cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Your First Website
        </Button>
      </div>
    </div>
  );
}

export function WebsiteSearchBar({
  searchQuery,
  setSearchQuery,
  onAddWebsite,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAddWebsite: () => void;
}) {
  return (
    <div className="flex items-center space-x-3 w-full md:w-auto">
      <div className="relative flex-grow md:flex-grow-0 md:w-64">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search websites..."
          className="w-full pl-9 pr-4 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f58327]/20 focus:border-[#f58327] bg-white cursor-pointer"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <Button
        onClick={onAddWebsite}
        className="bg-[#f58327] hover:bg-[#f58327]/90 text-white cursor-pointer"
      >
        <Plus className="h-4 w-4 mr-2" />
        <span>New Website</span>
      </Button>
    </div>
  );
}

function Search(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
