"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getStatusColor } from "@/lib/utils";
import { UserWebsite } from "@/types";
import {
  ArrowUpRight,
  MoreVertical,
  Edit,
  Globe,
  Settings,
  Users,
  ExternalLink,
  BarChart3,
  Clock,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface WebsitesListProps {
  websites: UserWebsite[];
  onOpenWPDashboard?: (website: UserWebsite) => void;
  isLoading: boolean;
  onWebsiteClick?: (website: UserWebsite) => void;
}

export function WebsitesList({
  websites,
  onOpenWPDashboard,
  isLoading: parentIsLoading,
  onWebsiteClick,
}: WebsitesListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeWebsiteId, setActiveWebsiteId] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleOpenWPDashboard = async (website: UserWebsite) => {
    setIsLoading(true);
    setActiveWebsiteId(website.id);

    try {
      // If parent component provided a handler, use that
      if (onOpenWPDashboard) {
        onOpenWPDashboard(website);
        return;
      }
    } catch (error: any) {
      console.error("Error accessing WordPress admin:", error);
      toast({
        title: "WordPress access error",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setActiveWebsiteId(null);
    }
  };

  // Add debugging to check what's being rendered
  console.log("Rendering WebsitesList with websites:", websites);

  if (!websites || websites.length === 0) {
    return (
      <div className="text-center p-8">
        <p>No websites found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {websites.map((website, index) => (
        <Card
          key={website.id || `website-${index}`}
          className="bg-white shadow-sm border hover:shadow-md transition-all duration-200 relative overflow-hidden group"
          onMouseEnter={() => setHoveredCard(website.id)}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={() => onWebsiteClick && onWebsiteClick(website)}
        >
          {/* Status indicator */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#f58327] to-[#f58327]/70"></div>

          <CardHeader className="pb-2 relative">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl truncate">
                  {website.title || "My Website"}
                </CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${getStatusColor(
                      website.status || "active"
                    )}`}
                  ></span>
                  <span className="text-sm text-gray-500 capitalize">
                    {website.status || "active"}
                  </span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="cursor-pointer"
                  >
                    <MoreVertical className="h-4 w-4" />
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
                    <Globe className="mr-2 h-4 w-4" />
                    Visit Website
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenWPDashboard(website);
                    }}
                    className="cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    WordPress Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push("/editor");
                    }}
                    className="cursor-pointer"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Website
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div className="aspect-video bg-gray-100 rounded-md overflow-hidden relative">
                {/* Website thumbnail/preview */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full p-4">
                    <div className="h-2 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-1 bg-gray-200 rounded mb-1 w-3/4"></div>
                    <div className="h-1 bg-gray-200 rounded mb-1 w-5/6"></div>
                    <div className="h-1 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>

                {/* Quick actions overlay on hover */}
                <div
                  className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-200 ${
                    hoveredCard === website.id ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
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
                      size="sm"
                      variant="outline"
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

              <div className="space-y-2">
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
                    <ArrowUpRight className="h-3 w-3 ml-1" />
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
            </div>
          </CardContent>

          <CardFooter className="flex justify-between pt-2 border-t">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-[#f58327] hover:bg-transparent p-0 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  // Add collaborator functionality
                  toast({
                    title: "Add collaborators",
                    description: "This feature is coming soon!",
                  });
                }}
              >
                <Users className="h-4 w-4 mr-1" />
                <span className="text-xs">Collaborators</span>
              </Button>
            </div>

            <Button
              size="sm"
              className="bg-[#f58327] hover:bg-[#f58327]/90 text-white cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenWPDashboard(website);
              }}
              disabled={
                (isLoading && activeWebsiteId === website.id) || parentIsLoading
              }
            >
              {(isLoading && activeWebsiteId === website.id) ||
              parentIsLoading ? (
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
                  Manage
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
