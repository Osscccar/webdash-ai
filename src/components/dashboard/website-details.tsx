"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserWebsite } from "@/types";
import {
  ArrowLeft,
  BarChart3,
  ExternalLink,
  Globe,
  HardDrive,
  Home,
  Settings,
  ShoppingCart,
  Users,
  Edit,
  Copy,
  FileText,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface WebsiteDetailsProps {
  website: UserWebsite;
  onBack: () => void;
  onOpenWPDashboard: () => void;
  isLoading: boolean;
}

export function WebsiteDetails({
  website,
  onBack,
  onOpenWPDashboard,
  isLoading,
}: WebsiteDetailsProps) {
  const [activeTab, setActiveTab] = useState("main");

  // Mock data for the website details
  const mockAnalytics = {
    pageViews: 0,
    uniqueVisitors: 0,
    storageUsed: {
      database: 864, // KB
      files: 207530, // KB
      total: 208394, // KB
    },
    performanceScore: {
      desktop: 100,
      mobile: 100,
    },
  };

  // Mock DNS records
  const mockDnsRecords = [
    { type: "A", name: "@", value: "192.168.1.1", ttl: "3600" },
    {
      type: "CNAME",
      name: "www",
      value: website.subdomain + ".webdash.site",
      ttl: "3600",
    },
    {
      type: "MX",
      name: "@",
      value: "mail.webdash.site",
      ttl: "3600",
      priority: "10",
    },
    {
      type: "TXT",
      name: "@",
      value: "v=spf1 include:_spf.webdash.site ~all",
      ttl: "3600",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader>
          <div className="p-4">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center text-gray-500 mb-4 cursor-pointer"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Websites
            </Button>
            <h2 className="font-bold text-lg truncate">{website.title}</h2>
            <div className="flex items-center mt-1">
              <Badge
                variant="outline"
                className="text-xs bg-green-50 text-green-700 border-green-200"
              >
                Active
              </Badge>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Website</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeTab === "main"}
                    onClick={() => setActiveTab("main")}
                  >
                    <Home className="h-4 w-4" />
                    <span>Main</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeTab === "analytics"}
                    onClick={() => setActiveTab("analytics")}
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Analytics</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeTab === "domain"}
                    onClick={() => setActiveTab("domain")}
                  >
                    <Globe className="h-4 w-4" />
                    <span>Domain</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <ShoppingCart className="h-4 w-4" />
                    <span>Ecommerce</span>
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Users className="h-4 w-4" />
                    <span>Collaborators</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">{website.title}</h1>
              <Badge variant="outline" className="text-xs">
                {website.subdomain}.webdash.site
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => window.open(website.siteUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Site
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => {
                  /* Add edit functionality */
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Site
              </Button>
              <Button
                className="bg-[#f58327] hover:bg-[#f58327]/90 text-white cursor-pointer"
                size="sm"
                onClick={onOpenWPDashboard}
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
            </div>
          </div>
        </header>

        <main className="p-6">
          {activeTab === "main" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Website URL
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <a
                        href={website.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#f58327] hover:underline flex items-center"
                      >
                        {website.siteUrl}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 cursor-pointer"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Created
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      <span>
                        {website.createdAt
                          ? new Date(website.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )
                          : "N/A"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Last Modified
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      <span>
                        {website.lastModified
                          ? new Date(website.lastModified).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )
                          : "N/A"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-gray-500" />
                      Analytics Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Page Views</p>
                          <p className="text-2xl font-bold">
                            {mockAnalytics.pageViews}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">
                            Unique Visitors
                          </p>
                          <p className="text-2xl font-bold">
                            {mockAnalytics.uniqueVisitors}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <div className="flex justify-between mb-1">
                          <p className="text-sm text-gray-500">
                            Performance Score
                          </p>
                          <p className="text-sm font-medium">Excellent</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Desktop</span>
                            <span>
                              {mockAnalytics.performanceScore.desktop}/100
                            </span>
                          </div>
                          <Progress
                            value={mockAnalytics.performanceScore.desktop}
                            className="h-2"
                          />

                          <div className="flex justify-between text-xs">
                            <span>Mobile</span>
                            <span>
                              {mockAnalytics.performanceScore.mobile}/100
                            </span>
                          </div>
                          <Progress
                            value={mockAnalytics.performanceScore.mobile}
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <HardDrive className="h-5 w-5 mr-2 text-gray-500" />
                      Storage Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Total Storage</p>
                          <p className="text-2xl font-bold">
                            {(mockAnalytics.storageUsed.total / 1024).toFixed(
                              2
                            )}{" "}
                            MB
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {(
                              (mockAnalytics.storageUsed.total /
                                (1024 * 1024)) *
                              100
                            ).toFixed(2)}
                            % of 1GB used
                          </p>
                        </div>
                      </div>

                      <Progress
                        value={
                          (mockAnalytics.storageUsed.total / (1024 * 1024)) *
                          100
                        }
                        className="h-2"
                      />

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <div className="h-3 w-3 rounded-sm bg-blue-500 mr-2"></div>
                            <p className="text-sm text-gray-500">Database</p>
                          </div>
                          <p className="text-sm font-medium">
                            {(
                              mockAnalytics.storageUsed.database / 1024
                            ).toFixed(2)}{" "}
                            MB
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <div className="h-3 w-3 rounded-sm bg-green-500 mr-2"></div>
                            <p className="text-sm text-gray-500">Files</p>
                          </div>
                          <p className="text-sm font-medium">
                            {(mockAnalytics.storageUsed.files / 1024).toFixed(
                              2
                            )}{" "}
                            MB
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-gray-500" />
                    Website Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Title</p>
                          <p className="font-medium">{website.title}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Description
                          </p>
                          <p>
                            {website.description || "No description available"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Subdomain
                          </p>
                          <p className="font-medium">
                            {website.subdomain}.webdash.site
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Status</p>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            Active
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Website Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BarChart3 className="h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-medium mb-2">
                      No analytics data yet
                    </h3>
                    <p className="text-gray-500 max-w-md">
                      Your website is new and hasn't received any visitors yet.
                      Check back later to see your analytics data.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "domain" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="h-5 w-5 mr-2 text-gray-500" />
                    Domain Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">
                        Current Domain
                      </h3>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border">
                        <div>
                          <p className="font-medium">
                            {website.subdomain}.webdash.site
                          </p>
                          <p className="text-sm text-gray-500">
                            Default subdomain
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="cursor-pointer"
                        >
                          Edit Subdomain
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">
                        Custom Domain
                      </h3>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-dashed">
                        <div>
                          <p className="font-medium">
                            No custom domain connected
                          </p>
                          <p className="text-sm text-gray-500">
                            Connect your own domain to this website
                          </p>
                        </div>
                        <Button className="bg-[#f58327] hover:bg-[#f58327]/90 text-white cursor-pointer">
                          Connect Domain
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">DNS Records</h3>
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Value</TableHead>
                              <TableHead>TTL</TableHead>
                              {mockDnsRecords.some(
                                (record) => record.priority
                              ) && <TableHead>Priority</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {mockDnsRecords.map((record, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  {record.type}
                                </TableCell>
                                <TableCell>{record.name}</TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {record.value}
                                </TableCell>
                                <TableCell>{record.ttl}</TableCell>
                                {mockDnsRecords.some(
                                  (record) => record.priority
                                ) && (
                                  <TableCell>
                                    {record.priority || "-"}
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
