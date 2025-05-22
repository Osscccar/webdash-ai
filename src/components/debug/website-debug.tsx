// Add this component temporarily to your dashboard for debugging
// src/components/debug/website-debug.tsx

"use client";

import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

export function WebsiteDebugPanel() {
  const { user, userData } = useAuth();
  const [showDetail, setShowDetail] = useState(false);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const localStorageData = {
    website: localStorage.getItem("webdash_website"),
    siteInfo: localStorage.getItem("webdash_site_info"),
    subdomain: localStorage.getItem("webdash_subdomain"),
    domainId: localStorage.getItem("webdash_domain_id"),
    jobId: localStorage.getItem("webdash_job_id"),
  };

  return (
    <div className="fixed bottom-4 left-4 bg-black text-white p-4 rounded-lg max-w-md text-xs z-50">
      <h4 className="font-bold mb-2">🐛 Website Debug Info</h4>

      <button
        onClick={() => setShowDetail(!showDetail)}
        className="bg-blue-500 px-2 py-1 rounded mb-2 cursor-pointer"
      >
        {showDetail ? "Hide" : "Show"} Details
      </button>

      <div className="space-y-2">
        <div>
          <strong>User ID:</strong> {user?.uid || "Not available"}
        </div>

        <div>
          <strong>Firestore Websites Count:</strong>{" "}
          {userData?.websites?.length || 0}
        </div>

        {showDetail && (
          <>
            <div>
              <strong>Firestore Websites:</strong>
              <pre className="bg-gray-800 p-2 rounded mt-1 text-xs overflow-auto max-h-32">
                {JSON.stringify(
                  userData?.websites?.map((w) => ({
                    id: w.id,
                    subdomain: w.subdomain,
                    title: w.title,
                  })),
                  null,
                  2
                )}
              </pre>
            </div>

            <div>
              <strong>LocalStorage Data:</strong>
              <pre className="bg-gray-800 p-2 rounded mt-1 text-xs overflow-auto max-h-32">
                {JSON.stringify(localStorageData, null, 2)}
              </pre>
            </div>
          </>
        )}

        <button
          onClick={() => {
            Object.keys(localStorageData).forEach((key) => {
              localStorage.removeItem(
                `webdash_${key === "website" ? "website" : key}`
              );
            });
            window.location.reload();
          }}
          className="bg-red-500 px-2 py-1 rounded cursor-pointer"
        >
          Clear LocalStorage & Reload
        </button>
      </div>
    </div>
  );
}
