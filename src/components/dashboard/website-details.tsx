"use client";

import { useState } from "react";
import { UserWebsite } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  BarChart3,
  ExternalLink,
  Globe,
  HardDrive,
  Home,
  Settings,
  Edit,
  Copy,
  FileText,
  Clock,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VisitorStatistics } from "@/components/dashboard/visitor-statistics";
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();

  // Mock data for the website details (for storage)
  const mockStorage = {
    database: 864, // KB
    files: 207530, // KB
    total: 208394, // KB
  };

  // Mock performance scores
  const mockPerformance = {
    desktop: 100,
    mobile: 100,
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

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(website.siteUrl);
    toast({
      title: "URL copied",
      description: "The website URL has been copied to clipboard.",
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center text-gray-500 cursor-pointer"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Websites
          </Button>
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
              onClick={() => (window.location.href = "/editor")}
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
          <TabsList className="bg-gray-100 p-1 h-9">
            <TabsTrigger
              value="main"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
            >
              <Home className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="domain"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
            >
              <Globe className="h-4 w-4 mr-2" />
              Domain
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 overflow-auto">
        <TabsContent value="main" className="mt-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-gray-500">
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
                    onClick={handleCopyUrl}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-gray-500">
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
                <CardTitle className="text-sm font-normal text-gray-500">
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
            {/* Visitor Statistics */}
            <VisitorStatistics domainId={website.domainId} />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <HardDrive className="h-5 w-5 mr-2 text-gray-500" />
                  Storage Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Total Storage</p>
                      <p className="text-2xl font-medium">
                        {(mockStorage.total / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {((mockStorage.total / (1024 * 1024)) * 100).toFixed(2)}
                        % of 1GB used
                      </p>
                    </div>
                  </div>

                  <Progress
                    value={(mockStorage.total / (1024 * 1024)) * 100}
                    className="h-2"
                  />

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-sm bg-blue-500 mr-2"></div>
                        <p className="text-sm text-gray-500">Database</p>
                      </div>
                      <p className="text-sm font-normal">
                        {(mockStorage.database / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-sm bg-green-500 mr-2"></div>
                        <p className="text-sm text-gray-500">Files</p>
                      </div>
                      <p className="text-sm font-normal">
                        {(mockStorage.files / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base">
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
                      <p className="font-normal">{website.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Description</p>
                      <p>{website.description || "No description available"}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Subdomain</p>
                      <p className="font-normal">
                        {website.subdomain}.webdash.site
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Status</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-0 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-medium mb-6">Website Analytics</h2>

            {/* Main analytics chart - full width */}
            <VisitorStatistics domainId={website.domainId} className="mb-6" />

            {/* Additional analytics insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Traffic Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Direct</span>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">65%</span>
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: "65%" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Google</span>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">20%</span>
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: "20%" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Social Media</span>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">10%</span>
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full"
                            style={{ width: "10%" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Other</span>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">5%</span>
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: "5%" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Device Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Desktop</span>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">45%</span>
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: "45%" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Mobile</span>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">50%</span>
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#f58327] rounded-full"
                            style={{ width: "50%" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Tablet</span>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">5%</span>
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-500 rounded-full"
                            style={{ width: "5%" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top pages */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Top Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Unique Visitors</TableHead>
                      <TableHead>Avg. Time on Page</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Homepage</TableCell>
                      <TableCell>420</TableCell>
                      <TableCell>215</TableCell>
                      <TableCell>1m 45s</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">About</TableCell>
                      <TableCell>125</TableCell>
                      <TableCell>98</TableCell>
                      <TableCell>1m 12s</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Services</TableCell>
                      <TableCell>87</TableCell>
                      <TableCell>62</TableCell>
                      <TableCell>2m 10s</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Contact</TableCell>
                      <TableCell>43</TableCell>
                      <TableCell>38</TableCell>
                      <TableCell>0m 58s</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="domain" className="mt-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <Globe className="h-5 w-5 mr-2 text-gray-500" />
                Domain Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-normal mb-2">Current Domain</h3>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border">
                    <div>
                      <p className="font-normal">
                        {website.subdomain}.webdash.site
                      </p>
                      <p className="text-sm text-gray-500">Default subdomain</p>
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
                  <h3 className="text-lg font-normal mb-2">Custom Domain</h3>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-dashed">
                    <div>
                      <p className="font-normal">No custom domain connected</p>
                      <p className="text-sm text-gray-500">
                        Connect your own domain to this website
                      </p>
                    </div>
                    <Button
                      className="bg-[#f58327] hover:bg-[#f58327]/90 text-white cursor-pointer"
                      size="sm"
                    >
                      Connect Domain
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-normal mb-4">DNS Records</h3>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>TTL</TableHead>
                          {mockDnsRecords.some((record) => record.priority) && (
                            <TableHead>Priority</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockDnsRecords.map((record, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-normal">
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
                              <TableCell>{record.priority || "-"}</TableCell>
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
        </TabsContent>
      </div>
    </div>
  );
}
