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
import NotificationsDropdown from "@/components/dashboard/notifications-dropdown";
import SettingsModal from "@/components/dashboard/settings-modal";
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
  Archive,
  Zap,
  Key,
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
import { WebsiteDetails } from "@/components/dashboard/website-details";
import { BackupManagement } from "@/components/dashboard/backup-management";
import { CacheManagement } from "@/components/dashboard/cache-management";
import { WordPressCredentials } from "@/components/dashboard/wordpress-credentials";

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
  const [showSettings, setShowSettings] = useState(false);

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

  // Auto-collapse sidebar when website is selected
  useEffect(() => {
    if (selectedWebsite) {
      setSidebarCollapsed(true);
    }
  }, [selectedWebsite]);

  const handleOpenWPDashboard = async (website: UserWebsite) => {
    setIsWpDashboardLoading(true);
    setActiveWebsiteId(website.id);

    try {
      // Call the new WordPress autologin API endpoint
      const response = await fetch("/api/tenweb/autologin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domainId: website.domainId,
          siteUrl: website.siteUrl,
          email: user?.email || userData?.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to get WordPress autologin URL"
        );
      }

      const data = await response.json();

      if (!data.url) {
        throw new Error("No autologin URL received from server");
      }

      // Open the WordPress admin in a new tab
      window.open(data.url, "_blank");
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
            sidebarCollapsed ? "-translate-x-full md:translate-x-0 md:w-20" : ""
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
                className="rounded-lg"
              />
              {!sidebarCollapsed && (
                <div>
                  <h1 className="font-medium text-xl">WebDash</h1>
                </div>
              )}
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
                  Workspace
                </span>
                <button
                  onClick={() => setShowWorkspaceManager(true)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>

              <WorkspaceSwitcher
                workspaces={workspaces}
                activeWorkspace={activeWorkspace}
                onWorkspaceChange={handleWorkspaceChange}
                isLoading={workspacesLoading}
              />

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

          {/* Discord Card */}
          {!sidebarCollapsed && (
            <div className="p-4">
              <div className="bg-[#5865F2] rounded-lg p-4 text-white">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 71 55"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clipPath="url(#clip0)">
                        <path
                          d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"
                          fill="#5865F2"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0">
                          <rect width="71" height="55" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-normal text-sm">Join our Discord</h3>
                    <p className="text-xs text-blue-100">Get help & updates</p>
                  </div>
                </div>
                <a
                  href="https://discord.gg/wGAC9EZRXz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-white text-[#5865F2] text-center py-2 rounded-md font-normal text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Join Discord
                </a>
              </div>
            </div>
          )}

          {/* Sidebar Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
            <button
              onClick={signOut}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 font-normal hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <LogOut className="h-5 w-5" />
              {!sidebarCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div
          className={cn(
            "flex-1 overflow-auto transition-all duration-300 ease-in-out",
            sidebarCollapsed ? "md:ml-20" : "md:ml-64"
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
                  <NotificationsDropdown />

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
                          onClick={() => setShowSettings(true)}
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
                  <button
                    onClick={() => setShowSettings(true)}
                    className="w-full text-left text-gray-700 hover:text-gray-900 cursor-pointer"
                  >
                    Settings
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left text-gray-700 hover:text-gray-900 cursor-pointer"
                  >
                    Sign out
                  </button>
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
                        const screenshotData = websiteScreenshots[website.id];
                        const isLoadingScreenshot =
                          screenshotData?.loading ?? true;
                        const screenshotUrl = screenshotData?.url ?? null;

                        return (
                          <div
                            key={website.id}
                            onClick={() => setSelectedWebsite(website)}
                            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                          >
                            <div className="aspect-video bg-gray-50 relative">
                              {screenshotUrl && !isLoadingScreenshot ? (
                                <div className="relative group">
                                  <img
                                    src={screenshotUrl}
                                    alt={`${website.title} screenshot`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        refreshWebsiteScreenshot(
                                          website.id,
                                          website.siteUrl
                                        );
                                      }}
                                      className="bg-white rounded-full p-1 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                      title="Refresh screenshot"
                                    >
                                      <RefreshCw className="h-3 w-3" />
                                    </button>
                                  </div>
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
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-normal truncate pr-2">
                                  {website.title}
                                </h3>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(website.siteUrl, "_blank");
                                    }}
                                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </button>
                                  <button className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-sm text-gray-500 mb-3">
                                {website.subdomain}.webdash.site
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">
                                  {website.createdAt
                                    ? new Date(
                                        website.createdAt
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenWPDashboard(website);
                                  }}
                                  className="text-xs text-[#f58327] hover:underline cursor-pointer"
                                >
                                  Manage →
                                </button>
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
            <WebsiteDetails
              website={selectedWebsite}
              onBack={handleBackToWebsites}
              onOpenWPDashboard={() => handleOpenWPDashboard(selectedWebsite)}
              onOpenElementorEditor={() => router.push("/editor")}
              isLoading={isWpDashboardLoading}
              activeTab={activeTab}
              onActiveTabChange={setActiveTab}
            />
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

        {/* Settings Modal */}
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      </div>
    </div>
  );
}
