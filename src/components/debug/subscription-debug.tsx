// Create this debug component and temporarily add it to your dashboard
// src/components/debug/subscription-debug.tsx

"use client";

import { useAuth } from "@/hooks/use-auth";
import { ADDITIONAL_WEBSITE_PRICING } from "@/config/stripe";

export function SubscriptionDebugPanel() {
  const { user, userData } = useAuth();

  if (process.env.NODE_ENV !== "development") {
    return null; // Only show in development
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg max-w-md text-xs z-50">
      <h4 className="font-bold mb-2">🐛 Debug Info</h4>

      <div className="space-y-2">
        <div>
          <strong>User Email:</strong> {user?.email || "Not available"}
        </div>

        <div>
          <strong>Subscription Data:</strong>
          <pre className="bg-gray-800 p-2 rounded mt-1 text-xs overflow-auto max-h-32">
            {JSON.stringify(userData?.webdashSubscription, null, 2)}
          </pre>
        </div>

        <div>
          <strong>Website Limit:</strong> {userData?.websiteLimit || "Not set"}
        </div>

        <div>
          <strong>Plan Type Detection:</strong>
          <div className="ml-2">
            <div>
              planType: {userData?.webdashSubscription?.planType || "Not set"}
            </div>
            <div>
              productId: {userData?.webdashSubscription?.productId || "Not set"}
            </div>
            <div>
              planId: {userData?.webdashSubscription?.planId || "Not set"}
            </div>
          </div>
        </div>

        <div>
          <strong>Available Additional Pricing:</strong>
          <div className="ml-2">
            {Object.keys(ADDITIONAL_WEBSITE_PRICING).map((key) => (
              <div key={key}>
                {key}: $
                {
                  ADDITIONAL_WEBSITE_PRICING[
                    key as keyof typeof ADDITIONAL_WEBSITE_PRICING
                  ].amount
                }
                /month
              </div>
            ))}
          </div>
        </div>

        <div>
          <strong>Current Detection Logic:</strong>
          <div className="ml-2">
            {(() => {
              const subscription = userData?.webdashSubscription;
              if (!subscription?.active) return "No active subscription";

              let planType = subscription.planType;
              if (!planType) {
                const productId = subscription.productId || "";
                const planId = subscription.planId || "";

                if (
                  productId === "prod_SLW6KBiglhhYlh" ||
                  productId.includes("business") ||
                  planId.includes("business")
                ) {
                  planType = "business";
                } else if (
                  productId === "prod_SLW74DJP2aPaN7" ||
                  productId.includes("agency") ||
                  planId.includes("agency")
                ) {
                  planType = "agency";
                } else if (
                  productId === "prod_SLW70YpoGn9giO" ||
                  productId.includes("enterprise") ||
                  planId.includes("enterprise")
                ) {
                  planType = "enterprise";
                } else {
                  planType = "business (fallback)";
                }
              }

              return `Detected: ${planType}`;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
