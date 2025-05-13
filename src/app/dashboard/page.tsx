"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/use-toast";
import useTenWeb from "@/hooks/use-tenweb";
import { getUserInitials } from "@/lib/utils";
import type { UserWebsite } from "@/types";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Plus,
  Search,
  Star,
  MoreVertical,
  ExternalLink,
  Edit,
  Clock,
  BarChart3,
  Users,
  ChevronLeft,
  Globe,
  HardDrive,
  ShoppingCart,
  ArrowLeft,
  Menu,
  X,
  Bell,
  FileText,
  Copy,
  ChevronRight,
  Home,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import WebDashLogo from "../../../public/WebDash.webp";
import { VisitorStatistics } from "@/components/dashboard/visitor-statistics";
import { PrimaryButton } from "@/components/ui/custom-button";

// Mock workspaces data
const WORKSPACES = [{ id: "1", name: "WebDash's Workspace", role: "Owner" }];

export default function DashboardPage() {
  const router = useRouter();
  const { user, userData, signOut } = useAuth();
  const { toast } = useToast();
  const tenWebHook = useTenWeb();

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [isWpDashboardLoading, setIsWpDashboardLoading] = useState(false);
  const [websites, setWebsites] = useState<UserWebsite[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState(WORKSPACES[0]);
  const [selectedWebsite, setSelectedWebsite] = useState<UserWebsite | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("main");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeWebsiteId, setActiveWebsiteId] = useState<string | null>(null);

  // Mock data for analytics
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
    { type: "CNAME", name: "www", value: "example.webdash.site", ttl: "3600" },
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

  // Auth check and website loading
  useEffect(() => {
    const checkAuth = async () => {
      // Wait for auth to initialize
      if (user === undefined) return;

      // If no user after auth initialized, redirect to login
      if (!user) {
        console.log("No user found, redirecting to login");
        router.push("/auth/login?redirect=/dashboard");
        return;
      }

      // Load website data
      try {
        setIsLoading(true);
        console.log("Loading websites for user:", user.uid);

        // Get user document directly
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("User data from Firestore:", userData);

          // Check for websites in the user document
          if (
            userData.websites &&
            Array.isArray(userData.websites) &&
            userData.websites.length > 0
          ) {
            console.log("Found websites in user document:", userData.websites);
            setWebsites(userData.websites);
          } else {
            console.log(
              "No websites found in user document, checking localStorage"
            );

            // Check localStorage
            const websiteData = localStorage.getItem("webdash_website");
            const siteInfo = localStorage.getItem("webdash_site_info");
            const subdomain = localStorage.getItem("webdash_subdomain");
            const domainId = localStorage.getItem("webdash_domain_id");

            if (websiteData) {
              try {
                console.log("Found website in localStorage:", websiteData);
                const parsedWebsite = JSON.parse(websiteData);

                // Add user ID if missing
                parsedWebsite.userId = user.uid;

                // Add to user's websites array in Firestore
                await updateDoc(userRef, {
                  websites: arrayUnion(parsedWebsite),
                  updatedAt: serverTimestamp(),
                });

                console.log("Added website from localStorage to Firestore");

                setWebsites([parsedWebsite]);
              } catch (error) {
                console.error(
                  "Error parsing website data from localStorage:",
                  error
                );
              }
            } else if (siteInfo && subdomain) {
              // We have site info but no complete website - create dummy for display
              console.log("Creating website from incomplete localStorage data");

              try {
                const parsedInfo = JSON.parse(siteInfo);

                // Create a website entry
                const dummyWebsite: UserWebsite = {
                  id: `website-${Date.now()}`,
                  userId: user.uid,
                  domainId: domainId ? Number.parseInt(domainId) : Date.now(),
                  subdomain: subdomain,
                  siteUrl: `https://${subdomain}.webdash.site`,
                  title:
                    parsedInfo.websiteTitle ||
                    parsedInfo.businessName ||
                    "My Website",
                  description:
                    parsedInfo.businessDescription || "AI-generated website",
                  createdAt: new Date().toISOString(),
                  lastModified: new Date().toISOString(),
                  status: "active",
                };

                // Add to user's websites array in Firestore
                await updateDoc(userRef, {
                  websites: arrayUnion(dummyWebsite),
                  updatedAt: serverTimestamp(),
                });

                console.log("Added dummy website to Firestore");

                setWebsites([dummyWebsite]);
              } catch (error) {
                console.error("Error creating dummy website:", error);
              }
            } else {
              console.log("No website data found in localStorage");
            }
          }
        } else {
          console.error("User document not found in Firestore");
          toast({
            title: "User profile not found",
            description:
              "We couldn't find your user profile. Try signing out and back in.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error loading website data:", error);
        toast({
          title: "Error loading websites",
          description: "There was a problem loading your websites",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [user, router, toast]);

  const handleOpenWPDashboard = async (website: UserWebsite) => {
    setIsWpDashboardLoading(true);
    setActiveWebsiteId(website.id);

    try {
      // Get WP admin URL
      const wpAdminUrl = `${website.siteUrl}/wp-admin`;

      // Get autologin token
      const token = await tenWebHook.getWPAutologinToken(
        website.domainId,
        wpAdminUrl
      );

      if (!token) {
        throw new Error("Failed to get WordPress autologin token");
      }

      // Construct the autologin URL as described in the 10Web API docs
      const email = user?.email || "";
      const autologinUrl = `${wpAdminUrl}/?twb_wp_login_token=${token}&email=${encodeURIComponent(
        email
      )}`;

      // Open the WordPress admin in a new tab
      window.open(autologinUrl, "_blank");
    } catch (error: any) {
      console.error("Error accessing WordPress dashboard:", error);
      toast({
        title: "Error accessing WordPress dashboard",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsWpDashboardLoading(false);
      setActiveWebsiteId(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleWebsiteClick = (website: UserWebsite) => {
    setSelectedWebsite(website);
  };

  const handleBackToWebsites = () => {
    setSelectedWebsite(null);
    setActiveTab("main");
  };

  const filteredWebsites = websites.filter(
    (website) =>
      website.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      website.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      website.siteUrl?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get user information
  const userName = userData?.firstName || user?.email?.split("@")[0] || "there";
  const userInitials = getUserInitials(
    userData?.firstName && userData?.lastName
      ? `${userData.firstName} ${userData.lastName}`
      : user?.email?.split("@")[0]
  );
  const userFullName =
    userData?.firstName && userData?.lastName
      ? `${userData.firstName} ${userData.lastName}`
      : user?.email?.split("@")[0];

  // Get time of day for greeting
  const currentHour = new Date().getHours();
  let greeting = "Good day";
  if (currentHour < 12) {
    greeting = "Good morning";
  } else if (currentHour < 18) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#f58327] border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Main Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "-translate-x-full md:translate-x-0 md:w-20" : "",
          selectedWebsite ? "-translate-x-full md:translate-x-0" : ""
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <Image
              src={WebDashLogo}
              alt="WebDash Logo"
              width={40}
              height={40}
            />
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Workspace Selector */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-gray-100 hover:bg-neutral-100 cursor-pointer">
            <div className="flex items-center justify-between">
              <button className="">
                <div className="flex items-center space-x-2">
                  <div className="text-gray-400 hover:text-gray-600 cursor-pointer">
                    <Settings className="h-4 w-4" />
                  </div>
                  <div className="text-sm font-normal truncate">
                    Workspace Settings
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Sidebar Navigation */}
        <div className="p-2 overflow-y-auto h-[calc(100vh-8rem)]">
          {/* Workspaces */}
          {!sidebarCollapsed && (
            <div className="mb-6">
              <div className="flex items-center justify-between px-3 mb-2">
                <p className="text-xs font-normal text-gray-400">WORKSPACES</p>
                <button className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <ul className="space-y-1">
                {WORKSPACES.map((workspace) => (
                  <li key={workspace.id}>
                    <button
                      onClick={() => setActiveWorkspace(workspace)}
                      className={cn(
                        "w-full flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 font-normal hover:bg-gray-100 transition-colors text-left",
                        activeWorkspace.id === workspace.id ? "bg-gray-100" : ""
                      )}
                    >
                      <div className="h-6 w-6 rounded-md bg-gray-200 flex items-center justify-center text-xs font-normal">
                        {workspace.name.charAt(0)}
                        {workspace.name.split(" ")[1]?.charAt(0) || ""}
                      </div>
                      <span className="truncate">{workspace.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
          <button
            onClick={handleSignOut}
            className={cn(
              "flex items-center space-x-3 w-full px-3 py-2 rounded-md text-gray-700 font-normal hover:bg-gray-100 transition-colors cursor-pointer",
              sidebarCollapsed ? "justify-center" : ""
            )}
          >
            <LogOut className="h-5 w-5" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Website Detail Sidebar - Only visible when a website is selected */}
      {selectedWebsite && (
        <div className="fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 transition-all duration-300 ease-in-out md:left-20">
          {/* Website Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <button
              onClick={handleBackToWebsites}
              className="flex items-center space-x-2 text-gray-700 hover:text-[#f58327] transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-normal">Back</span>
            </button>
          </div>

          {/* Website Info */}
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-medium text-lg truncate">
              {selectedWebsite.title}
            </h2>
            <div className="flex items-center mt-1">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2"></span>
              <span className="text-sm text-gray-500 capitalize">
                {selectedWebsite.status || "active"}
              </span>
            </div>
          </div>

          {/* Website Navigation */}
          <div className="p-2">
            <p className="text-xs font-normal text-gray-400 px-3 mb-2">
              WEBSITE
            </p>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setActiveTab("main")}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 font-normal hover:bg-gray-100 transition-colors text-left",
                    activeTab === "main" ? "bg-gray-100 text-[#f58327]" : ""
                  )}
                >
                  <Home className="h-5 w-5" />
                  <span>Main</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 font-normal hover:bg-gray-100 transition-colors text-left",
                    activeTab === "analytics"
                      ? "bg-gray-100 text-[#f58327]"
                      : ""
                  )}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span>Analytics</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("domain")}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 font-normal hover:bg-gray-100 transition-colors text-left",
                    activeTab === "domain" ? "bg-gray-100 text-[#f58327]" : ""
                  )}
                >
                  <Globe className="h-5 w-5" />
                  <span>Domain</span>
                </button>
              </li>
              <li>
                <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 font-normal hover:bg-gray-100 transition-colors text-left">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Ecommerce</span>
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 overflow-auto transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "md:ml-20" : "md:ml-64",
          selectedWebsite ? "md:ml-[336px]" : ""
        )}
      >
        {/* Header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="text-gray-500 md:hidden cursor-pointer"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-4">
                <button className="text-gray-500 hover:text-gray-700 cursor-pointer">
                  <HelpCircle className="h-5 w-5" />
                </button>
                <button className="text-gray-500 hover:text-gray-700 relative cursor-pointer">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                </button>

                <div className="relative group">
                  <button className="flex items-center space-x-2 cursor-pointer">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-normal">
                      {userInitials}
                    </div>
                  </button>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="p-3 border-b border-gray-100">
                      <p className="text-sm font-normal">{userFullName}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => router.push("/dashboard")}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer"
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={() => router.push("/dashboard/settings")}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer"
                      >
                        Settings
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden text-gray-600 cursor-pointer"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-normal">
                    {userInitials}
                  </div>
                )}
              </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <div className="md:hidden mt-4 pb-4 space-y-4">
                <Link
                  href="/dashboard"
                  className="block py-2 text-gray-600 hover:text-[#f58327] text-sm font-normal transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="block py-2 text-gray-600 hover:text-[#f58327] text-sm font-normal transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Settings
                </Link>
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center pb-2">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      <span className="text-sm font-normal">
                        {userInitials}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-normal">{userFullName}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <button
                    className="w-full text-left py-2 text-gray-600 hover:text-[#f58327] cursor-pointer"
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Dashboard Content */}
        {!selectedWebsite ? (
          <main className="p-6">
            <div className="max-w-7xl mx-auto">
              {/* Welcome Message */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-100"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2 mb-4 md:mb-0">
                    <h1 className="text-2xl md:text-3xl font-medium">
                      {greeting}, {userName}!
                    </h1>
                    <p className="text-gray-500">
                      Welcome to your WebDash dashboard. Here you can manage
                      your AI-generated websites.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1.5 rounded-full">
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      <span>All systems operational</span>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* Websites Section */}
              <div className="mt-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
                  <div>
                    <p className="text-gray-500 text-sm">
                      {activeWorkspace.name} • {websites.length} websites
                    </p>
                  </div>
                  <div className="flex items-center space-x-3 w-full md:w-auto">
                    <PrimaryButton className="relative font-normal border-neutral-100 border-2 hover:bg-neutral-100 hover:shadow-none text-base bg-white text-black rounded-[16px] transition-all shadow-none">
                      <Plus className="h-4 w-4" />
                      <span>Add Collaborators</span>
                    </PrimaryButton>
                    <PrimaryButton>
                      <Plus className="h-4 w-4" />
                      <span>Add Website</span>
                    </PrimaryButton>
                  </div>
                </div>

                {/* Website Cards */}
                {filteredWebsites.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredWebsites.map((website) => (
                      <div
                        key={website.id}
                        className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer"
                        onClick={() => handleWebsiteClick(website)}
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
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Add dropdown functionality
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </button>
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
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <div className="flex space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(website.siteUrl, "_blank");
                                }}
                                className="bg-white text-gray-800 hover:bg-white/90 px-3 py-1 rounded text-sm font-normal flex items-center space-x-1 cursor-pointer"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>Visit</span>
                              </button>
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
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-dashed border-gray-300 p-8 text-center">
                    <div className="space-y-4">
                      <h3 className="text-xl font-normal">No websites found</h3>
                      {searchQuery ? (
                        <p className="text-gray-500">
                          No websites match your search criteria. Try a
                          different search term.
                        </p>
                      ) : (
                        <p className="text-gray-500">
                          You haven't created any websites yet. Get started by
                          creating your first AI-powered website.
                        </p>
                      )}
                      <button
                        onClick={() => router.push("/")}
                        className="bg-[#f58327] hover:bg-[#f58327]/90 text-white px-4 py-2 rounded-md font-normal mt-2 cursor-pointer"
                      >
                        Create Your First Website
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        ) : (
          <main className="p-6">
            {/* Website Details Content */}
            <div className="max-w-7xl mx-auto">
              {/* Website Actions */}
              <div className="flex items-center justify-between mb-6">
                <div className="md:hidden">
                  <button
                    onClick={handleBackToWebsites}
                    className="flex items-center space-x-2 text-gray-700 hover:text-[#f58327] transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="font-normal">Back</span>
                  </button>
                </div>
                <div className="flex items-center space-x-2 ml-auto">
                  <button
                    className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded text-sm font-normal flex items-center space-x-1 cursor-pointer"
                    onClick={() =>
                      window.open(selectedWebsite.siteUrl, "_blank")
                    }
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Visit Site</span>
                  </button>
                  <button
                    className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded text-sm font-normal flex items-center space-x-1 cursor-pointer"
                    onClick={() => router.push("/editor")}
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Site</span>
                  </button>
                  <PrimaryButton
                    onClick={() => handleOpenWPDashboard(selectedWebsite)}
                    disabled={isWpDashboardLoading}
                  >
                    {isWpDashboardLoading ? (
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
                        <Settings className="h-4 w-4" />
                        <span>WP Dashboard</span>
                      </>
                    )}
                  </PrimaryButton>
                </div>
              </div>

              {/* Main Tab Content */}
              {activeTab === "main" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h3 className="text-sm font-normal text-gray-500 mb-2">
                        Website URL
                      </h3>
                      <div className="flex items-center justify-between">
                        <a
                          href={selectedWebsite.siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#f58327] hover:underline flex items-center"
                        >
                          {selectedWebsite.siteUrl}
                        </a>
                        <button className="text-gray-400 hover:text-gray-600 cursor-pointer">
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h3 className="text-sm font-normal text-gray-500 mb-2">
                        Created
                      </h3>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        <span>
                          {selectedWebsite.createdAt
                            ? new Date(
                                selectedWebsite.createdAt
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h3 className="text-sm font-normal text-gray-500 mb-2">
                        Last Modified
                      </h3>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        <span>
                          {selectedWebsite.lastModified
                            ? new Date(
                                selectedWebsite.lastModified
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="p-4 border-b border-gray-100">
                        <h3 className="font-normal flex items-center">
                          <BarChart3 className="h-5 w-5 mr-2 text-gray-500" />
                          Analytics Overview
                        </h3>
                      </div>
                      <div className="p-4">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-sm text-gray-500">
                                Page Views
                              </p>
                              <p className="text-2xl font-medium">
                                {mockAnalytics.pageViews}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-500">
                                Unique Visitors
                              </p>
                              <p className="text-2xl font-medium">
                                {mockAnalytics.uniqueVisitors}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="p-4 border-b border-gray-100">
                        <h3 className="font-normal flex items-center">
                          <HardDrive className="h-5 w-5 mr-2 text-gray-500" />
                          Storage Usage
                        </h3>
                      </div>
                      <div className="p-4">
                        <div className="space-y-4">
                          <div className="flex justify-between items-end">
                            <div className="space-y-1">
                              <p className="text-sm text-gray-500">
                                Total Storage
                              </p>
                              <p className="text-2xl font-medium">
                                {(
                                  mockAnalytics.storageUsed.total / 1024
                                ).toFixed(2)}{" "}
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

                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${
                                  (mockAnalytics.storageUsed.total /
                                    (1024 * 1024)) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-normal flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-gray-500" />
                        Website Information
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">
                                Title
                              </p>
                              <p className="font-normal">
                                {selectedWebsite.title}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 mb-1">
                                Description
                              </p>
                              <p>
                                {selectedWebsite.description ||
                                  "No description available"}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">
                                Subdomain
                              </p>
                              <p className="font-normal">
                                {selectedWebsite.subdomain}.webdash.site
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 mb-1">
                                Status
                              </p>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-green-100 text-green-800">
                                Active
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Analytics Tab Content */}
              {activeTab === "analytics" && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-normal">Website Analytics</h3>
                    </div>
                    <div className="p-6">
                      <VisitorStatistics domainId={selectedWebsite.domainId} />
                    </div>
                  </div>
                </div>
              )}

              {/* Domain Tab Content */}
              {activeTab === "domain" && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-normal flex items-center">
                        <Globe className="h-5 w-5 mr-2 text-gray-500" />
                        Domain Settings
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-normal mb-2">
                            Current Domain
                          </h3>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border">
                            <div>
                              <p className="font-normal">
                                {selectedWebsite.subdomain}.webdash.site
                              </p>
                              <p className="text-sm text-gray-500">
                                Default subdomain
                              </p>
                            </div>
                            <button className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded text-sm font-normal cursor-pointer">
                              Edit Subdomain
                            </button>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-normal mb-2">
                            Custom Domain
                          </h3>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-dashed">
                            <div>
                              <p className="font-normal">
                                No custom domain connected
                              </p>
                              <p className="text-sm text-gray-500">
                                Connect your own domain to this website
                              </p>
                            </div>
                            <button className="bg-[#f58327] hover:bg-[#f58327]/90 text-white px-3 py-1.5 rounded text-sm font-normal cursor-pointer">
                              Connect Domain
                            </button>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-normal mb-4">
                            DNS Records
                          </h3>
                          <div className="border rounded-md overflow-hidden overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider"
                                  >
                                    Type
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider"
                                  >
                                    Name
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider"
                                  >
                                    Value
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider"
                                  >
                                    TTL
                                  </th>
                                  {mockDnsRecords.some(
                                    (record) => record.priority
                                  ) && (
                                    <th
                                      scope="col"
                                      className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider"
                                    >
                                      Priority
                                    </th>
                                  )}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {mockDnsRecords.map((record, index) => (
                                  <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-900">
                                      {record.type}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {record.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                                      {record.value}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {record.ttl}
                                    </td>
                                    {mockDnsRecords.some(
                                      (record) => record.priority
                                    ) && (
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {record.priority || "-"}
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
