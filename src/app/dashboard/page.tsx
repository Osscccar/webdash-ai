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
import { WebsitesList } from "@/components/dashboard/websites-list";
import { WelcomeMessage } from "@/components/dashboard/welcome-message";
import { AuthRequired } from "@/components/auth/auth-required";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/use-toast";
import { generateRandomSubdomain } from "@/lib/utils";
import { UserWebsite } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [websites, setWebsites] = useState<UserWebsite[]>([]);

  useEffect(() => {
    // In a real implementation, websites would be loaded from Firebase
    // For demo purposes, we'll create a dummy website if one exists in localStorage

    const siteInfo = localStorage.getItem("webdash_site_info");
    const subdomain =
      localStorage.getItem("webdash_subdomain") ||
      generateRandomSubdomain("site");

    if (siteInfo) {
      try {
        const parsedInfo = JSON.parse(siteInfo);

        // Create a dummy website object
        const dummyWebsite: UserWebsite = {
          id: "website-1",
          domainId: 12345,
          subdomain: subdomain,
          siteUrl: `https://${subdomain}.10web.site`,
          title:
            parsedInfo.websiteTitle || parsedInfo.businessName || "My Website",
          description: parsedInfo.businessDescription || "AI-generated website",
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          status: "active",
        };

        setWebsites([dummyWebsite]);
      } catch (e) {
        console.error("Error parsing site info:", e);
      }
    }
  }, []);

  const handleCreateNewWebsite = () => {
    router.push("/");
  };

  const handleOpenWPDashboard = async (website: UserWebsite) => {
    setIsLoading(true);

    try {
      // In a real implementation, this would call the 10Web API to generate a single-use login token
      // For demo purposes, we'll simulate a successful API call

      toast({
        title: "WordPress Dashboard",
        description: "Opening WordPress dashboard...",
      });

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Open a new tab with a simulated WordPress dashboard URL
      window.open(`https://${website.subdomain}.10web.site/wp-admin`, "_blank");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open WordPress dashboard. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthRequired>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <DashboardHeader />

        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <WelcomeMessage
              userName={
                userData?.firstName || user?.email?.split("@")[0] || "there"
              }
            />

            <div className="mt-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Your Websites</h2>
                <Button
                  onClick={handleCreateNewWebsite}
                  className="bg-[#f58327] hover:bg-[#f58327]/90 text-white"
                >
                  Create New Website
                </Button>
              </div>

              {websites.length > 0 ? (
                <WebsitesList
                  websites={websites}
                  onOpenWPDashboard={handleOpenWPDashboard}
                  isLoading={isLoading}
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
                        onClick={handleCreateNewWebsite}
                        className="bg-[#f58327] hover:bg-[#f58327]/90 text-white mt-2"
                      >
                        Create Your First Website
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Subscription Status */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Subscription</h2>
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>
                    {userData?.webdashSubscription?.active
                      ? "10Web Pro"
                      : "Free Trial"}
                  </CardTitle>
                  <CardDescription>
                    {userData?.webdashSubscription?.active
                      ? "Your subscription is active"
                      : "Your free trial ends in 7 days"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Plan</span>
                      <span className="font-medium">
                        10Web Pro{" "}
                        {userData?.webdashSubscription?.planId?.includes(
                          "annual"
                        )
                          ? "Annual"
                          : "Monthly"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status</span>
                      <span className="font-medium">
                        {userData?.webdashSubscription?.active
                          ? "Active"
                          : "Trial"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        {userData?.webdashSubscription?.active
                          ? "Next billing date"
                          : "Trial ends on"}
                      </span>
                      <span className="font-medium">
                        {userData?.webdashSubscription?.currentPeriodEnd
                          ? new Date(
                              userData.webdashSubscription.currentPeriodEnd
                            ).toLocaleDateString()
                          : new Date(
                              Date.now() + 7 * 24 * 60 * 60 * 1000
                            ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: "Manage Subscription",
                        description:
                          "This feature is not available in the demo.",
                      });
                    }}
                  >
                    Manage Subscription
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </AuthRequired>
  );
}
