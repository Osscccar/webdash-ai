"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/use-toast";
import { generateRandomSubdomain } from "@/lib/utils";
import { UserWebsite } from "@/types";
import { WebsitesList } from "@/components/dashboard/websites-list";
import { WelcomeMessage } from "@/components/dashboard/welcome-message";
import useTenWeb from "@/hooks/use-tenweb";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/config/firebase";

export default function DashboardPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const tenWebHook = useTenWeb();
  const [isLoading, setIsLoading] = useState(true);
  const [isWpDashboardLoading, setIsWpDashboardLoading] = useState(false);
  const [websites, setWebsites] = useState<UserWebsite[]>([]);

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

        // Try to fetch websites from Firestore
        const websitesRef = collection(db, "websites");
        const q = query(websitesRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        const userWebsites: UserWebsite[] = [];

        querySnapshot.forEach((doc) => {
          userWebsites.push(doc.data() as UserWebsite);
        });

        // If no websites in Firestore, check localStorage
        if (userWebsites.length === 0) {
          const siteInfo = localStorage.getItem("webdash_site_info");
          const websiteData = localStorage.getItem("webdash_website");
          const subdomain = localStorage.getItem("webdash_subdomain");

          if (websiteData) {
            // We have a website created during the current session
            try {
              const parsedWebsite = JSON.parse(websiteData);
              userWebsites.push(parsedWebsite);
            } catch (error) {
              console.error("Error parsing website data:", error);
            }
          } else if (siteInfo && subdomain) {
            // We have site info but no complete website - create dummy for display
            const parsedInfo = JSON.parse(siteInfo);

            // Create a website entry
            const dummyWebsite: UserWebsite = {
              id: "website-1",
              domainId: 12345, // This will be replaced by real data
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

            userWebsites.push(dummyWebsite);
          }
        }

        setWebsites(userWebsites);
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
    }
  };

  // Simple loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f58327]"></div>
          <p className="text-lg text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const userName = userData?.firstName || user?.email?.split("@")[0] || "there";

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <DashboardHeader />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <WelcomeMessage userName={userName} />

          <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Your Websites</h2>
              <Button
                onClick={() => router.push("/")}
                className="bg-[#f58327] hover:bg-[#f58327]/90 text-white"
              >
                Create New Website
              </Button>
            </div>

            {websites.length > 0 ? (
              <WebsitesList
                websites={websites}
                onOpenWPDashboard={handleOpenWPDashboard}
                isLoading={isWpDashboardLoading}
              />
            ) : (
              <Card className="bg-white shadow-sm border-dashed border-2 border-gray-200">
                <CardContent className="p-8 text-center">
                  <div className="space-y-4">
                    <h3 className="text-xl font-medium">No websites yet</h3>
                    <p className="text-gray-500">
                      You haven't created any websites yet. Get started by
                      creating your first AI-powered website.
                    </p>
                    <Button
                      onClick={() => router.push("/")}
                      className="bg-[#f58327] hover:bg-[#f58327]/90 text-white mt-2"
                    >
                      Create Your First Website
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
