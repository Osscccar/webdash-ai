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

export default function DashboardPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [websites, setWebsites] = useState<UserWebsite[]>([]);

  // Simple auth check and website loading
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
        // In a real app, fetch from Firebase or your backend
        // For demo, use localStorage
        const siteInfo = localStorage.getItem("webdash_site_info");
        const subdomain =
          localStorage.getItem("webdash_subdomain") ||
          generateRandomSubdomain("site");

        if (siteInfo) {
          const parsedInfo = JSON.parse(siteInfo);

          // Create a dummy website
          const dummyWebsite: UserWebsite = {
            id: "website-1",
            domainId: 12345,
            subdomain: subdomain,
            siteUrl: `https://${subdomain}.10web.site`,
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

          setWebsites([dummyWebsite]);
        }
      } catch (error) {
        console.error("Error loading website data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [user, router]);

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

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <DashboardHeader />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-100 mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Welcome to your Dashboard!
            </h1>
            <p className="text-gray-500">
              Here you can manage your AI-generated websites.
            </p>
          </div>

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {websites.map((website) => (
                  <Card
                    key={website.id}
                    className="bg-white shadow-sm border hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl">{website.title}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                        <span className="text-sm text-gray-500 capitalize">
                          {website.status}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="aspect-video bg-gray-100 rounded-md overflow-hidden relative">
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
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="ml-1"
                              >
                                <path d="M7 17L17 7"></path>
                                <path d="M7 7h10v10"></path>
                              </svg>
                            </a>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Created</span>
                            <span>
                              {new Date(website.createdAt).toLocaleDateString()}
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
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        className="bg-[#f58327] hover:bg-[#f58327]/90 text-white"
                        onClick={() => {
                          window.open(
                            `https://${website.subdomain}.10web.site/wp-admin`,
                            "_blank"
                          );
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2"
                        >
                          <path d="M12 20h9"></path>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                        WP Dashboard
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
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
