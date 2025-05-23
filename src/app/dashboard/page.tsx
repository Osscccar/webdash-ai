"use client";

import { useState, useEffect, useRef } from "react";
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
  RefreshCw,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import WebDashLogo from "../../../public/WebDash.webp";
import { VisitorStatistics } from "@/components/dashboard/visitor-statistics";
import { PrimaryButton } from "@/components/ui/custom-button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { PaymentForm } from "@/components/payment/payment-form";
import {
  PLANS,
  ADDITIONAL_WEBSITE_PRICING,
  getPlanTypeFromSubscription,
  getAdditionalWebsitePricing,
  validateAdditionalWebsitePricing,
} from "@/config/stripe";
import { WebsiteDebugPanel } from "@/components/debug/website-debug";
import { WorkspaceSwitcher } from "@/components/workspaces/workspace-switcher";
import { WorkspaceManagementModal } from "@/components/workspaces/workspace-management-modal";
import { useWorkspaces } from "@/hooks/use-workspaces";
import type { Workspace } from "@/types/workspace";
import { ROLE_PERMISSIONS } from "@/types/workspace";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// This will be replaced by dynamic workspace data

// Plan configurations with website limits and additional website pricing
const PLAN_CONFIGS = {
  business: {
    includedWebsites: 1,
    additionalWebsitePrice: ADDITIONAL_WEBSITE_PRICING.business.amount,
    canUpgrade: true,
    upgradeToPlans: ["agency", "enterprise"],
  },
  agency: {
    includedWebsites: 3,
    additionalWebsitePrice: ADDITIONAL_WEBSITE_PRICING.agency.amount,
    canUpgrade: true,
    upgradeToPlans: ["enterprise"],
  },
  enterprise: {
    includedWebsites: 5,
    additionalWebsitePrice: ADDITIONAL_WEBSITE_PRICING.enterprise.amount,
    canUpgrade: false,
    upgradeToPlans: [],
  },
};

// Additional website price IDs for Stripe
const ADDITIONAL_WEBSITE_PRICE_IDS = {
  business: "price_additional_business_website", // Replace with actual Stripe price ID
  agency: "price_additional_agency_website", // Replace with actual Stripe price ID
  enterprise: "price_additional_enterprise_website", // Replace with actual Stripe price ID
};

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  websiteLimit: number;
  currentWebsiteCount: number;
  onUpgrade: () => void;
  onBuyAdditional: () => void;
}

function UpgradeModal({
  isOpen,
  onClose,
  currentPlan,
  websiteLimit,
  currentWebsiteCount,
  onUpgrade,
  onBuyAdditional,
}: UpgradeModalProps) {
  const planConfig = PLAN_CONFIGS[currentPlan as keyof typeof PLAN_CONFIGS];

  if (!planConfig) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 mb-4">
            <ShoppingCart className="h-6 w-6 text-orange-600" />
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Website Limit Reached
          </h3>

          <p className="text-sm text-gray-500 mb-6">
            You've reached your limit of {websiteLimit} website
            {websiteLimit > 1 ? "s" : ""} on the{" "}
            {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} plan.
          </p>

          <div className="space-y-3">
            {planConfig.canUpgrade && (
              <PrimaryButton onClick={onUpgrade} className="w-full">
                Upgrade Plan
              </PrimaryButton>
            )}

            <button
              onClick={onBuyAdditional}
              className="text-sm text-[#f58327] hover:underline cursor-pointer"
            >
              Buy an additional website (+${planConfig.additionalWebsitePrice}
              /month)
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AdditionalWebsitePaymentProps {
  isOpen: boolean;
  onClose: () => void;
  planType: string;
  onSuccess: () => void;
}

function AdditionalWebsitePayment({
  isOpen,
  onClose,
  planType,
  onSuccess,
}: AdditionalWebsitePaymentProps) {
  const { user, userData } = useAuth();

  console.log("AdditionalWebsitePayment - planType:", planType);

  // Validate plan type first
  if (!validateAdditionalWebsitePricing(planType)) {
    console.error(`Invalid plan type for additional website: ${planType}`);
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="p-6 text-center">
            <h3 className="text-lg font-medium text-red-600 mb-4">
              Invalid Plan Type
            </h3>
            <p className="text-gray-600 mb-4">
              The plan type "<strong>{planType}</strong>" is not valid for
              additional website purchase.
            </p>
            <div className="text-sm text-gray-500 mb-4">
              <p>Valid plan types:</p>
              <ul className="list-disc list-inside">
                {Object.keys(ADDITIONAL_WEBSITE_PRICING).map((key) => (
                  <li key={key}>{key}</li>
                ))}
              </ul>
            </div>
            <Button onClick={onClose} className="mt-4 cursor-pointer">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Get the additional website pricing (with fallback)
  const additionalPricing = getAdditionalWebsitePricing(planType);

  console.log("Using additional pricing:", additionalPricing);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <Elements stripe={stripePromise}>
          <div className="p-6">
            <PaymentForm
              productId={additionalPricing.priceId}
              interval="monthly"
              customerData={{
                email: userData?.email || user?.email || "",
                name: `${userData?.firstName || ""} ${
                  userData?.lastName || ""
                }`.trim(),
              }}
              onSuccess={onSuccess}
              isAdditionalWebsite={true}
              planType={planType}
            />
          </div>
        </Elements>
      </DialogContent>
    </Dialog>
  );
}
// Function will be defined inside component where userData is available

export default function DashboardPage() {
  const router = useRouter();
  const { user, userData, signOut } = useAuth();
  const { toast } = useToast();
  const tenWebHook = useTenWeb();
  const { loading: authLoading } = useAuth();
  const {
    workspaces,
    activeWorkspace: hookActiveWorkspace,
    isLoading: workspacesLoading,
    changeActiveWorkspace,
    getUserRole,
    canManageWorkspace,
    canAddCollaborators,
    loadWorkspaces,
  } = useWorkspaces();

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [isWpDashboardLoading, setIsWpDashboardLoading] = useState(false);
  const [websites, setWebsites] = useState<UserWebsite[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState<UserWebsite | null>(
    null
  );

  // Use the workspace from the hook
  const activeWorkspace = hookActiveWorkspace;
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [websiteScreenshots, setWebsiteScreenshots] = useState<{
    [websiteId: string]: {
      url: string | null;
      loading: boolean;
      key: number;
    };
  }>({});
  const [isLoadingScreenshot, setIsLoadingScreenshot] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("main");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeWebsiteId, setActiveWebsiteId] = useState<string | null>(null);

  // New state for website limits and modals
  const [websiteLimit, setWebsiteLimit] = useState(1);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState("business");
  const [showWorkspaceManager, setShowWorkspaceManager] = useState(false);

  // Remove unused ref since we're using modal now

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

  // Function to get user's plan type and website limit
  const getUserPlanInfo = () => {
    const subscription = userData?.webdashSubscription;
    if (!subscription?.active) return { plan: "business", limit: 1 };

    // Determine plan based on productId or priceId
    const productId = subscription.productId || subscription.planId;
    if (!productId) return { plan: "business", limit: 1 };

    if (productId.includes("business")) {
      return { plan: "business", limit: userData?.websiteLimit || 1 };
    } else if (productId.includes("agency")) {
      return { plan: "agency", limit: userData?.websiteLimit || 3 };
    } else if (productId.includes("enterprise")) {
      return { plan: "enterprise", limit: userData?.websiteLimit || 5 };
    }

    return { plan: "business", limit: userData?.websiteLimit || 1 };
  };

  const refreshWebsiteScreenshot = (websiteId: string, siteUrl: string) => {
    const newKey = Date.now() + Math.random();
    const apiUrl = `/api/screenshot?url=${encodeURIComponent(
      siteUrl
    )}&key=${newKey}&refresh=true`;

    setWebsiteScreenshots((prev) => ({
      ...prev,
      [websiteId]: {
        url: apiUrl,
        loading: true,
        key: newKey,
      },
    }));
  };

  // Filter websites based on workspace and user role permissions
  const getVisibleWebsites = () => {
    console.log("=== getVisibleWebsites Debug ===");
    console.log("activeWorkspace:", activeWorkspace);
    console.log("user:", user?.uid);
    console.log("workspaces loaded:", workspaces?.length);

    if (!activeWorkspace || !user) {
      console.log("No active workspace or user, returning empty array");
      return [];
    }

    const userCollaborator = activeWorkspace.collaborators.find(
      (c) => c.userId === user.uid
    );
    console.log("userCollaborator found:", userCollaborator);

    if (!userCollaborator) {
      console.log(
        "User not found in workspace collaborators, returning empty array"
      );
      console.log("Workspace collaborators:", activeWorkspace.collaborators);
      return [];
    }

    // First filter by workspace - only show websites that belong to current workspace
    const workspaceWebsites = websites.filter(
      (website) => website.workspaceId === activeWorkspace.id
    );

    console.log(
      `Filtering ${websites.length} total websites for workspace ${activeWorkspace.id} (${activeWorkspace.name}):`
    );
    console.log(
      `Found ${workspaceWebsites.length} websites in current workspace`
    );
    console.log(
      "All websites:",
      websites.map((w) => ({
        id: w.id,
        title: w.title,
        workspaceId: w.workspaceId,
        userId: w.userId,
      }))
    );
    console.log(
      "Workspace websites:",
      workspaceWebsites.map((w) => ({
        id: w.id,
        title: w.title,
        workspaceId: w.workspaceId,
        userId: w.userId,
      }))
    );

    // If user is client, only show allowed websites within this workspace
    if (
      userCollaborator.role === "client" &&
      userCollaborator.allowedWebsites
    ) {
      const clientWebsites = workspaceWebsites.filter((website) =>
        userCollaborator.allowedWebsites?.includes(website.id)
      );
      console.log(
        `User is client, showing ${clientWebsites.length} allowed websites`
      );
      return clientWebsites;
    }

    // For other roles, show all websites in the current workspace
    console.log(
      `User role: ${userCollaborator.role}, showing all ${workspaceWebsites.length} workspace websites`
    );
    console.log("=== End Debug ===");
    return workspaceWebsites;
  };

  // Handle workspace change
  const handleWorkspaceChange = (workspace: Workspace) => {
    changeActiveWorkspace(workspace);
    console.log("Active workspace changed to:", workspace.name);

    // Clear selected website since it might not be available in new workspace
    setSelectedWebsite(null);

    // Close workspace manager modal if open
    setShowWorkspaceManager(false);
  };

  // Handle workspace management modal close with potential data refresh
  const handleWorkspaceManagerClose = () => {
    setShowWorkspaceManager(false);
    // Reload workspaces in case changes were made
    loadWorkspaces();
  };

  // Modal handles click outside automatically

  const handleScreenshotLoad = (websiteId: string) => {
    setWebsiteScreenshots((prev) => ({
      ...prev,
      [websiteId]: {
        ...prev[websiteId],
        loading: false,
      },
    }));
  };

  useEffect(() => {
    // Check for authentication and subscription status
    const checkAccess = async () => {
      // Wait for auth to load
      if (authLoading) return;

      // If not authenticated, redirect to login
      if (!user) {
        router.push(`/login?redirect=${encodeURIComponent("/dashboard")}`);
        return;
      }

      // Check if the user has an active subscription OR is a collaborator in any workspace
      const hasSubscription = userData?.webdashSubscription?.active || false;
      const hasWorkspaceAccess =
        userData?.workspaces && userData.workspaces.length > 0;

      if (!hasSubscription && !hasWorkspaceAccess) {
        // Check if user has generated a website
        const savedWebsite = localStorage.getItem("webdash_website");

        if (savedWebsite) {
          // User has generated a website but hasn't paid - redirect to preview
          router.push("/preview");
          return;
        } else {
          // Only redirect to root if they're not already there
          if (window.location.pathname !== "/") {
            router.push("/");
          }
          return;
        }
      }

      // Get user plan info and set website limit
      const planInfo = getUserPlanInfo();
      console.log("Setting current plan from planInfo:", planInfo);
      setCurrentPlan(planInfo.plan);
      setWebsiteLimit(planInfo.limit);

      // User is authenticated and has subscription - allow access
      setIsLoading(false);
    };

    checkAccess();
  }, [router, user, userData, authLoading]);

  useEffect(() => {
    const handleAutoReload = () => {
      const hasNewWebsite = localStorage.getItem("webdash_website");
      const justGenerated = sessionStorage.getItem("webdash_just_generated");
      const justPurchased = sessionStorage.getItem("webdash_just_purchased");
      const justPurchasedAdditional = sessionStorage.getItem(
        "webdash_just_purchased_additional"
      );

      // Scenario 1: User just generated a website
      if (hasNewWebsite && justGenerated) {
        console.log("🔄 Auto-reload: User just generated a website");
        sessionStorage.removeItem("webdash_just_generated");

        setTimeout(() => {
          window.location.reload();
        }, 500);
        return;
      }

      // Scenario 2: User just purchased a subscription
      if (justPurchased) {
        console.log("🔄 Auto-reload: User just purchased subscription");
        sessionStorage.removeItem("webdash_just_purchased");

        setTimeout(() => {
          window.location.reload();
        }, 1000);
        return;
      }

      // Scenario 3: User just purchased additional website
      if (justPurchasedAdditional) {
        console.log("🔄 Auto-reload: User just purchased additional website");
        sessionStorage.removeItem("webdash_just_purchased_additional");

        setTimeout(() => {
          window.location.reload();
        }, 1000);
        return;
      }
    };

    // Check immediately on mount
    handleAutoReload();

    // Also check when page becomes visible (tab switching)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleAutoReload();
      }
    };

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "webdash_website" && e.newValue) {
        console.log("🔄 Auto-reload: New website detected via storage event");
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // ✅ NEW: Clear any stale session flags on unmount
  useEffect(() => {
    return () => {
      // Clean up any stale flags when component unmounts
      sessionStorage.removeItem("webdash_just_generated");
      sessionStorage.removeItem("webdash_just_purchased");
      sessionStorage.removeItem("webdash_just_purchased_additional");
    };
  }, []);

  useEffect(() => {
    // Check if user just purchased a subscription
    const checkForNewSubscription = () => {
      const justPurchased = sessionStorage.getItem("webdash_just_purchased");

      if (justPurchased) {
        console.log("User just purchased subscription, reloading dashboard...");

        // Clear the flag
        sessionStorage.removeItem("webdash_just_purchased");

        // Reload after short delay
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };

    checkForNewSubscription();
  }, []);

  useEffect(() => {
    // Generate screenshot URLs for all websites
    websites.forEach((website) => {
      if (website.siteUrl && !websiteScreenshots[website.id]) {
        const key = Date.now() + Math.random(); // Unique key for each website
        const apiUrl = `/api/screenshot?url=${encodeURIComponent(
          website.siteUrl
        )}&key=${key}`;

        setWebsiteScreenshots((prev) => ({
          ...prev,
          [website.id]: {
            url: apiUrl,
            loading: true,
            key: key,
          },
        }));
      }
    });
  }, [websites]); // Depend on websites array

  // Auth check and website loading
  // src/app/dashboard/page.tsx - Fixed useEffect section (around line 680)

  useEffect(() => {
    const checkAuth = async () => {
      // Wait for auth to initialize
      if (user === undefined) return;

      // If no user after auth initialized, redirect to login
      if (!user) {
        console.log("No user found, redirecting to login");
        router.push("/login");
        return;
      }

      // Wait for workspaces to finish loading
      if (workspacesLoading) {
        console.log("Waiting for workspaces to load...");
        return;
      }

      // Load website data
      try {
        setIsLoading(true);
        console.log("Loading websites for user:", user.uid);
        console.log("Available workspaces:", workspaces?.length || 0);

        // ✅ SECURE: Use API endpoint to load workspace websites
        console.log("Loading workspace websites via secure API...");

        let existingWebsites: UserWebsite[] = [];

        try {
          // Get user's Firebase ID token for API authentication
          console.log("Getting Firebase ID token...");
          const idToken = await user.getIdToken();
          console.log("ID token obtained, calling API...");

          // Call secure API endpoint to load workspace websites
          const response = await fetch("/api/workspaces/websites", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "application/json",
            },
          });

          console.log(`API response status: ${response.status}`);

          if (response.ok) {
            const data = await response.json();
            console.log("API response data:", data);
            console.log("API response websites array:", data.websites);
            existingWebsites = data.websites || [];
            console.log(`Loaded ${existingWebsites.length} websites via API`);
          } else {
            const errorText = await response.text();
            console.error(
              "Failed to load websites via API:",
              response.status,
              errorText
            );
            // Fallback: try to load from user's own document
            const userRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
              const userData = userDoc.data();
              existingWebsites = userData.websites || [];
              console.log(
                `Fallback: loaded ${existingWebsites.length} websites from user document`
              );
            }
          }
        } catch (error) {
          console.error("Error loading websites via API:", error);
          // Fallback: try to load from user's own document
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            existingWebsites = userData.websites || [];
            console.log(
              `Fallback: loaded ${existingWebsites.length} websites from user document`
            );
          }
        }

        // Check localStorage for NEW website data
        const websiteData = localStorage.getItem("webdash_website");
        const siteInfo = localStorage.getItem("webdash_site_info");
        const subdomain = localStorage.getItem("webdash_subdomain");
        const domainId = localStorage.getItem("webdash_domain_id");
        const storedWorkspaceId = localStorage.getItem(
          "webdash_current_workspace"
        );

        if (websiteData) {
          try {
            console.log("Found NEW website in localStorage:", websiteData);
            const parsedWebsite = JSON.parse(websiteData);

            // Add user ID and workspace ID if missing
            parsedWebsite.userId = user.uid;

            // ✅ Handle pending workspace assignment for new users
            if (parsedWebsite.workspaceId === "pending-workspace-assignment") {
              // Assign to user's default workspace
              parsedWebsite.workspaceId =
                activeWorkspace?.id || `workspace-${user.uid}-default`;
              console.log(
                `Assigning pending website to default workspace: ${parsedWebsite.workspaceId}`
              );
            } else {
              parsedWebsite.workspaceId =
                storedWorkspaceId || activeWorkspace?.id || "default-workspace";
            }

            // ✅ FIXED: Check if this website already exists
            const websiteExists = existingWebsites.some(
              (w) =>
                w.id === parsedWebsite.id ||
                w.subdomain === parsedWebsite.subdomain
            );

            if (!websiteExists) {
              console.log("Adding new website to existing collection");

              // Add to existing websites array for UI
              const updatedWebsites = [...existingWebsites, parsedWebsite];

              // ✅ SECURE: Use API to save website to appropriate workspace owner
              try {
                const idToken = await user.getIdToken();
                const response = await fetch("/api/workspaces/websites", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${idToken}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    website: parsedWebsite,
                    workspaceId: parsedWebsite.workspaceId,
                  }),
                });

                if (response.ok) {
                  console.log("Successfully saved website via API");
                  setWebsites(updatedWebsites);
                } else {
                  console.error("Failed to save website via API");
                  setWebsites(existingWebsites);
                }
              } catch (error) {
                console.error("Error saving website via API:", error);
                setWebsites(existingWebsites);
              }

              // ✅ FIXED: Clear localStorage after successful addition
              localStorage.removeItem("webdash_website");
              localStorage.removeItem("webdash_site_info");
              localStorage.removeItem("webdash_subdomain");
              localStorage.removeItem("webdash_domain_id");
              localStorage.removeItem("webdash_current_workspace");
            } else {
              console.log("Website already exists, using existing websites");
              setWebsites(existingWebsites);
            }
          } catch (error) {
            console.error(
              "Error parsing website data from localStorage:",
              error
            );
            setWebsites(existingWebsites);
          }
        } else {
          console.log("No new website data, using existing websites");
          setWebsites(existingWebsites);
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
  }, [user, router, toast, workspacesLoading, workspaces]);

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
    // Automatically collapse sidebar when viewing website details
    setSidebarCollapsed(true);
  };

  const handleBackToWebsites = () => {
    setSelectedWebsite(null);
    setActiveTab("main");
    // Automatically expand sidebar when going back to websites list
    setSidebarCollapsed(false);
  };

  // Check if user can create websites based on role
  const canCreateWebsites = () => {
    if (!activeWorkspace || !user) return false;

    const role = safeGetUserRole(activeWorkspace);
    if (!role) return false;

    const permissions = ROLE_PERMISSIONS[role];
    return permissions.canCreateWebsites;
  };

  // Function to handle adding a new website
  const handleAddWebsite = () => {
    // Check role permissions first
    if (!canCreateWebsites()) {
      toast({
        title: "Permission denied",
        description:
          "Only workspace owners and admins can create new websites.",
        variant: "destructive",
      });
      return;
    }

    const currentWebsiteCount = websites.length;

    console.log("handleAddWebsite - Current count:", currentWebsiteCount);
    console.log("handleAddWebsite - Website limit:", websiteLimit);
    console.log(
      "handleAddWebsite - Can create more?",
      currentWebsiteCount < websiteLimit
    );

    if (currentWebsiteCount >= websiteLimit) {
      console.log("Reached website limit, showing upgrade modal");
      // User has reached their limit
      setShowUpgradeModal(true);
    } else {
      console.log("User can create more websites, redirecting to root");

      // Clear the existing website data from localStorage so user can create a new one
      localStorage.removeItem("webdash_website");
      localStorage.removeItem("webdash_site_info");
      localStorage.removeItem("webdash_colors_fonts");
      localStorage.removeItem("webdash_subdomain");
      localStorage.removeItem("webdash_domain_id");
      localStorage.removeItem("webdash_pages_meta");
      localStorage.removeItem("webdash_prompt");
      localStorage.removeItem("webdash_job_id");

      // Add a flag to indicate this is a new website creation
      localStorage.setItem("webdash_creating_new", "true");

      // Store the current workspace ID so the new website gets assigned to it
      if (activeWorkspace) {
        localStorage.setItem("webdash_current_workspace", activeWorkspace.id);
      }

      // User can add more websites
      router.push("/?new=true");
    }
  };

  // Function to handle upgrade
  const handleUpgrade = () => {
    setShowUpgradeModal(false);

    // Store the current plan info in sessionStorage so the pricing page knows what to show
    sessionStorage.setItem("upgrade_from_plan", currentPlan);
    sessionStorage.setItem("upgrade_from_limit", websiteLimit.toString());

    // Redirect to pricing page with upgrade parameter
    router.push("/pricing?upgrade=true");
  };

  // Function to handle buying additional website
  const handleBuyAdditional = () => {
    setShowUpgradeModal(false);
    setShowPaymentModal(true);
  };

  // Function to handle successful additional website purchase
  const handleAdditionalWebsiteSuccess = async () => {
    try {
      console.log("Processing additional website purchase success");

      // ✅ Set flag for auto-reload after additional website purchase
      sessionStorage.setItem("webdash_just_purchased_additional", "true");

      // Call the API to update the website limit
      const response = await fetch("/api/user/update-website-limit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user!.uid,
          increment: 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update website limit");
      }

      const result = await response.json();
      console.log("Website limit update result:", result);

      setShowPaymentModal(false);

      toast({
        title: "Additional website purchased",
        description: `You can now create ${result.newLimit} websites total!`,
      });

      // ✅ UPDATED: Reload page after additional website purchase
      setTimeout(() => {
        window.location.reload();
      }, 1500);

      // Then redirect to create new website
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      console.error("Error updating website limit:", error);
      toast({
        title: "Error",
        description:
          "Payment succeeded but failed to update your website limit. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const visibleWebsites = getVisibleWebsites();
  const filteredWebsites = visibleWebsites.filter(
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

  // Safe getUserRole function that handles null workspace
  const safeGetUserRole = (workspace: Workspace | null) => {
    if (!workspace || !user) return null;
    return getUserRole(workspace);
  };

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
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Beta Notification Bar */}
      <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white px-4 py-2 text-center text-sm">
        <div className="flex items-center justify-center space-x-1">
          <span>Found a bug or have feedback?</span>
          <a
            href="https://discord.gg/wGAC9EZRXz"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-orange-200 transition-colors cursor-pointer font-medium"
          >
            Join our Discord
          </a>
          <span>to report it.</span>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Sidebar */}
        <div
          className={cn(
            "fixed top-10 bottom-0 left-0 z-50 w-64 bg-white border-r border-gray-100 transition-all duration-300 ease-in-out",
            sidebarCollapsed
              ? "-translate-x-full md:translate-x-0 md:w-20"
              : "",
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
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-normal text-gray-400 uppercase tracking-wider">
                  WORKSPACE
                </span>
                <button
                  onClick={() => setShowWorkspaceManager(!showWorkspaceManager)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>

              {activeWorkspace && (
                <div className="flex items-center space-x-2 p-2 rounded-md bg-gray-50">
                  <div className="h-6 w-6 rounded bg-gray-200 flex items-center justify-center text-xs font-medium">
                    {activeWorkspace.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {activeWorkspace.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {safeGetUserRole(activeWorkspace)} •{" "}
                      {activeWorkspace?.collaborators?.length || 0} member
                      {(activeWorkspace?.collaborators?.length || 0) !== 1
                        ? "s"
                        : ""}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Workspace Info */}
              <div className="mt-4 text-xs text-gray-500">
                {workspaces.length > 1 ? (
                  <span>{workspaces.length} workspaces available</span>
                ) : (
                  <span>Click settings to manage workspaces</span>
                )}
              </div>
            </div>
          )}

          {/* Sidebar Navigation */}
          <div className="p-2 overflow-y-auto h-[calc(100vh-8rem)]">
            {/* Workspaces List */}
            {!sidebarCollapsed && (
              <div className="mb-6">
                <div className="flex items-center justify-between px-3 mb-2">
                  <p className="text-xs font-normal text-gray-400 uppercase tracking-wider">
                    WORKSPACES
                  </p>
                  <button
                    onClick={() => setShowWorkspaceManager(true)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Show loading state while workspaces load */}
                {workspacesLoading ? (
                  <div className="px-3 py-2">
                    <div className="animate-pulse space-y-2">
                      <div className="h-8 bg-gray-200 rounded"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {workspaces.map((workspace) => (
                      <li key={workspace.id}>
                        <button
                          onClick={() => handleWorkspaceChange(workspace)}
                          className={cn(
                            "w-full flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 font-normal hover:bg-gray-100 transition-colors text-left cursor-pointer",
                            activeWorkspace?.id === workspace.id
                              ? "bg-gray-100"
                              : ""
                          )}
                        >
                          <div className="h-6 w-6 rounded-md bg-gray-200 flex items-center justify-center text-xs font-normal">
                            {workspace.name.charAt(0)}
                            {workspace.name.split(" ")[1]?.charAt(0) || ""}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="truncate">{workspace.name}</span>
                              {safeGetUserRole(workspace) === "owner" && (
                                <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {safeGetUserRole(workspace)} •{" "}
                              {workspace.collaborators?.length || 0} members
                            </span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Collapsed state - show current workspace or cycle through */}
            {sidebarCollapsed && !workspacesLoading && (
              <div className="mb-4">
                {workspaces.length > 1 ? (
                  <div className="space-y-2">
                    {workspaces.map((workspace) => (
                      <div
                        key={workspace.id}
                        className={cn(
                          "h-8 w-8 rounded-md flex items-center justify-center text-xs font-normal mx-auto cursor-pointer transition-colors",
                          activeWorkspace?.id === workspace.id
                            ? "bg-gray-300 ring-2 ring-blue-500"
                            : "bg-gray-200 hover:bg-gray-300"
                        )}
                        onClick={() => handleWorkspaceChange(workspace)}
                        title={`${workspace.name} (${safeGetUserRole(
                          workspace
                        )})`}
                      >
                        {workspace.name.charAt(0)}
                      </div>
                    ))}
                  </div>
                ) : activeWorkspace ? (
                  <div
                    className="h-8 w-8 rounded-md bg-gray-200 flex items-center justify-center text-xs font-normal mx-auto cursor-pointer hover:bg-gray-300 transition-colors"
                    onClick={() => setSidebarCollapsed(false)}
                    title={activeWorkspace.name}
                  >
                    {activeWorkspace.name.charAt(0)}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Discord Card */}
          {!sidebarCollapsed && (
            <div className="absolute bottom-20 left-0 right-0 p-4">
              <div className="bg-[#5865F2] rounded-lg p-4 text-white">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 127.14 96.36"
                      className="h-5 w-5"
                    >
                      <path
                        fill="#5865F2"
                        d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Join our Discord</div>
                    <div className="text-xs text-blue-100">
                      Get help & updates
                    </div>
                  </div>
                </div>
                <a
                  href="https://discord.gg/wGAC9EZRXz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-white text-[#5865F2] text-center py-2 px-3 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Join Discord
                </a>
              </div>
            </div>
          )}

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
          <div className="fixed top-10 bottom-0 left-0 z-40 w-64 bg-white border-r border-gray-100 transition-all duration-300 ease-in-out md:left-20">
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
                    <Link href="https://help.webdash.io">
                      <HelpCircle className="h-5 w-5 cursor-pointer" />
                    </Link>
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
                        {activeWorkspace?.name || "Loading..."} •{" "}
                        {visibleWebsites.length} website
                        {visibleWebsites.length !== 1 ? "s" : ""}
                        {/* Only show limits for workspace owners, not collaborators */}
                        {activeWorkspace &&
                          safeGetUserRole(activeWorkspace) === "owner" &&
                          websiteLimit && (
                            <span>
                              {" "}
                              • {websites.length}/{websiteLimit} total limit
                            </span>
                          )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3 w-full md:w-auto">
                      <PrimaryButton
                        onClick={() => setShowWorkspaceManager(true)}
                        className="relative font-normal border-neutral-100 border-2 hover:bg-neutral-100 hover:shadow-none text-base bg-white text-black rounded-[16px] transition-all shadow-none"
                      >
                        <Users className="h-4 w-4" />
                        <span>Manage Workspace</span>
                      </PrimaryButton>
                      <PrimaryButton
                        onClick={handleAddWebsite}
                        disabled={!canCreateWebsites()}
                        className={
                          !canCreateWebsites()
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Website</span>
                      </PrimaryButton>
                    </div>
                  </div>

                  {/* Website Cards */}
                  {filteredWebsites.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredWebsites.map((website) => {
                        // ✅ Get individual screenshot data for this website
                        const screenshotData = websiteScreenshots[website.id];
                        const isLoadingScreenshot =
                          screenshotData?.loading ?? true;
                        const screenshotUrl = screenshotData?.url ?? null;

                        return (
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

                            {/* Website Preview - ✅ UPDATED to use individual screenshots */}
                            <div className="relative w-full max-w-md h-32 overflow-hidden rounded-lg">
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center relative">
                                {isLoadingScreenshot ? (
                                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#f58327]"></div>
                                  </div>
                                ) : screenshotUrl ? (
                                  <div className="relative w-full h-full">
                                    <img
                                      src={screenshotUrl}
                                      alt={`Preview of ${website.title}`}
                                      className="w-full h-full object-cover object-top rounded-sm"
                                      onLoad={() =>
                                        handleScreenshotLoad(website.id)
                                      }
                                      onError={(e) => {
                                        console.error(
                                          "Error loading screenshot for",
                                          website.id,
                                          e
                                        );
                                        handleScreenshotLoad(website.id);
                                      }}
                                    />
                                    {/* ✅ ADD: Refresh screenshot button */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        refreshWebsiteScreenshot(
                                          website.id,
                                          website.siteUrl
                                        );
                                      }}
                                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                      title="Refresh screenshot"
                                    >
                                      <RefreshCw className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  // Fallback when no URL is available
                                  <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 text-xs text-center p-3 rounded-lg">
                                    <div>
                                      <p className="mb-2">Website preview</p>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          refreshWebsiteScreenshot(
                                            website.id,
                                            website.siteUrl
                                          );
                                        }}
                                        className="text-[#f58327] hover:underline cursor-pointer"
                                      >
                                        Generate screenshot
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Hover Overlay */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-lg">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(website.siteUrl, "_blank");
                                    }}
                                    className="bg-white text-gray-800 hover:bg-white/90 px-2 py-1 rounded text-xs font-normal flex items-center space-x-1 cursor-pointer transition-colors duration-200"
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
                                  {website.siteUrl?.replace(
                                    /^https?:\/\//,
                                    ""
                                  ) || "website.webdash.site"}
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border border-dashed border-gray-300 p-8 text-center">
                      <div className="space-y-4">
                        <h3 className="text-xl font-normal">
                          No websites found
                        </h3>
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
                          onClick={handleAddWebsite}
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
                        <VisitorStatistics
                          domainId={selectedWebsite.domainId}
                        />
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

        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentPlan={currentPlan}
          websiteLimit={websiteLimit}
          currentWebsiteCount={websites.length}
          onUpgrade={handleUpgrade}
          onBuyAdditional={handleBuyAdditional}
        />

        {/* Additional Website Payment Modal */}
        <AdditionalWebsitePayment
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          planType={currentPlan}
          onSuccess={handleAdditionalWebsiteSuccess}
        />

        {/* Workspace Management Modal */}
        <WorkspaceManagementModal
          isOpen={showWorkspaceManager}
          onClose={handleWorkspaceManagerClose}
          onWorkspaceChange={handleWorkspaceChange}
          websites={websites}
        />

        {process.env.NODE_ENV === "development" && (
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="fixed bottom-4 right-4 bg-red-500 text-white p-2 rounded-md text-xs z-50 cursor-pointer"
          >
            Reset Storage & Reload
          </button>
        )}

        {process.env.NODE_ENV === "development" && (
          <div className="fixed bottom-20 right-4 bg-yellow-500 text-black p-4 rounded-lg z-50">
            <h4 className="font-bold mb-2">🔧 Fix Website Limit</h4>
            <p className="text-sm mb-2">
              Your limit should be{" "}
              {currentPlan === "agency"
                ? "4"
                : currentPlan === "enterprise"
                ? "6"
                : "2"}
              but is {websiteLimit}
            </p>
            <button
              onClick={async () => {
                try {
                  const response = await fetch("/api/fix-website-limit", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      userId: user?.uid,
                    }),
                  });

                  const result = await response.json();

                  if (result.success) {
                    toast({
                      title: "Website limit fixed!",
                      description: `Your limit has been updated from ${result.oldLimit} to ${result.newLimit}`,
                    });

                    // Reload the page to see the changes
                    setTimeout(() => {
                      window.location.reload();
                    }, 1500);
                  } else {
                    throw new Error(result.error);
                  }
                } catch (error: any) {
                  toast({
                    title: "Error fixing limit",
                    description: error.message || "Failed to fix website limit",
                    variant: "destructive",
                  });
                }
              }}
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 cursor-pointer"
            >
              Fix My Website Limit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
