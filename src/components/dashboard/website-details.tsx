"use client";

import { useState, useEffect } from "react";
import { UserWebsite } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ExternalLink,
  HardDrive,
  Settings,
  Edit,
  Copy,
  FileText,
  Clock,
  Shield,
  BarChart3,
  Globe,
  Database,
  Zap,
  Key,
  Archive,
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
import { WordPressCredentials } from "@/components/dashboard/wordpress-credentials";
import { DomainManagement } from "@/components/dashboard/domain-management";
import { BackupManagement } from "@/components/dashboard/backup-management";
import { CacheManagement } from "@/components/dashboard/cache-management";

interface WebsiteDetailsProps {
  website: UserWebsite;
  onBack: () => void;
  onOpenWPDashboard: () => void;
  onOpenElementorEditor: () => void;
  isLoading: boolean;
  isElementorLoading?: boolean;
  activeTab: string;
  onActiveTabChange: (tab: string) => void;
}

export function WebsiteDetails({
  website,
  onBack,
  onOpenWPDashboard,
  onOpenElementorEditor,
  isLoading,
  isElementorLoading = false,
  activeTab,
  onActiveTabChange,
}: WebsiteDetailsProps) {
  const { toast } = useToast();

  // Storage data will be fetched from API
  const [storage, setStorage] = useState({
    database: 0,
    files: 0,
    total: 0,
  });

  useEffect(() => {
    const fetchStorageData = async () => {
      if (!website.domainId) return;
      
      try {
        const response = await fetch(`/api/tenweb/storage?domainId=${website.domainId}`);
        if (response.ok) {
          const data = await response.json();
          setStorage(data);
        }
      } catch (error) {
        console.error('Error fetching storage data:', error);
      }
    };

    fetchStorageData();
  }, [website.domainId]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(website.siteUrl);
    toast({
      title: "URL copied",
      description: "The website URL has been copied to clipboard.",
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case "analytics":
        return (
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
        );

      case "domain":
        return (
          <DomainManagement 
            selectedWebsite={{
              id: website.id,
              name: website.title || "My Website",
              domainId: website.domainId,
              url: website.siteUrl
            }}
          />
        );

      case "wordpress":
        return (
          <WordPressCredentials 
            selectedWebsite={{
              id: website.id,
              name: website.title || "My Website",
              domainId: website.domainId
            }}
          />
        );

      case "backups":
        return (
          <BackupManagement 
            selectedWebsite={{
              id: website.id,
              name: website.title || "My Website",
              domainId: website.domainId
            }}
          />
        );

      case "performance":
        return (
          <CacheManagement 
            selectedWebsite={{
              id: website.id,
              name: website.title || "My Website",
              domainId: website.domainId
            }}
          />
        );

      case "security":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <Shield className="h-5 w-5 mr-2 text-gray-500" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">SSL Certificate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status: Active</span>
                        <Button variant="outline" size="sm">Manage SSL</Button>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Password Protection</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status: Disabled</span>
                        <Button variant="outline" size="sm">Enable</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Security Features</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Firewall Protection</span>
                      <span className="text-sm font-medium text-green-600">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Malware Scanning</span>
                      <span className="text-sm font-medium text-green-600">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Automatic Updates</span>
                      <span className="text-sm font-medium text-green-600">Enabled</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default: // "main"
        return (
          <div className="space-y-6">
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
                          {storage.total ? (storage.total / 1024).toFixed(2) : '0'} MB
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {storage.total ? ((storage.total / (1024 * 1024)) * 100).toFixed(2) : '0'}% of 1GB used
                        </p>
                      </div>
                    </div>

                    <Progress
                      value={storage.total ? (storage.total / (1024 * 1024)) * 100 : 0}
                      className="h-2"
                    />

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-sm bg-blue-500 mr-2"></div>
                          <p className="text-sm text-gray-500">Database</p>
                        </div>
                        <p className="text-sm font-normal">
                          {storage.database ? (storage.database / 1024).toFixed(2) : '0'} MB
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-sm bg-green-500 mr-2"></div>
                          <p className="text-sm text-gray-500">Files</p>
                        </div>
                        <p className="text-sm font-normal">
                          {storage.files ? (storage.files / 1024).toFixed(2) : '0'} MB
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
          </div>
        );
    }
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
              onClick={onOpenElementorEditor}
              disabled={isElementorLoading}
            >
              {isElementorLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600"
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
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Site (Elementor)
                </>
              )}
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
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-white">
        <div className="px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => onActiveTabChange("main")}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === "main"
                  ? "border-[#f58327] text-[#f58327]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => onActiveTabChange("analytics")}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === "analytics"
                  ? "border-[#f58327] text-[#f58327]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              Analytics
            </button>
            <button
              onClick={() => onActiveTabChange("domain")}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === "domain"
                  ? "border-[#f58327] text-[#f58327]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Globe className="h-4 w-4 inline mr-2" />
              Domain
            </button>
            <button
              onClick={() => onActiveTabChange("backups")}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === "backups"
                  ? "border-[#f58327] text-[#f58327]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Archive className="h-4 w-4 inline mr-2" />
              Backup
            </button>
            <button
              onClick={() => onActiveTabChange("performance")}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === "performance"
                  ? "border-[#f58327] text-[#f58327]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Zap className="h-4 w-4 inline mr-2" />
              Cache
            </button>
            <button
              onClick={() => onActiveTabChange("wordpress")}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === "wordpress"
                  ? "border-[#f58327] text-[#f58327]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Key className="h-4 w-4 inline mr-2" />
              WordPress
            </button>
            <button
              onClick={() => onActiveTabChange("security")}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === "security"
                  ? "border-[#f58327] text-[#f58327]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Shield className="h-4 w-4 inline mr-2" />
              Security
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
}