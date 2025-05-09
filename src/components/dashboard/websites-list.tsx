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
} from "lucide-react";

interface WebsitesListProps {
  websites: UserWebsite[];
  onOpenWPDashboard: (website: UserWebsite) => void;
  isLoading: boolean;
}

export function WebsitesList({
  websites,
  onOpenWPDashboard,
  isLoading,
}: WebsitesListProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {websites.map((website) => (
        <Card
          key={website.id}
          className="bg-white shadow-sm border hover:shadow-md transition-shadow"
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl truncate">
                  {website.title}
                </CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${getStatusColor(
                      website.status
                    )}`}
                  ></span>
                  <span className="text-sm text-gray-500 capitalize">
                    {website.status}
                  </span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => window.open(website.siteUrl, "_blank")}
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Visit Website
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOpenWPDashboard(website)}>
                    <Settings className="mr-2 h-4 w-4" />
                    WordPress Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/editor")}>
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
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">URL</span>
                  <a
                    href={website.siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#f58327] hover:underline truncate max-w-[200px] flex items-center"
                  >
                    {website.siteUrl.replace(/^https?:\/\//, "")}
                    <ArrowUpRight className="h-3 w-3 ml-1" />
                  </a>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Created</span>
                  <span>
                    {new Date(website.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last updated</span>
                  <span>
                    {new Date(website.lastModified).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/editor")}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              size="sm"
              className="bg-[#f58327] hover:bg-[#f58327]/90 text-white"
              onClick={() => onOpenWPDashboard(website)}
              disabled={isLoading}
            >
              {isLoading ? (
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
                  WP Dashboard
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
