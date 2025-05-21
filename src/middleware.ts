// src/middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const pathname = request.nextUrl.pathname;

  // Check if the user is accessing the dashboard
  if (pathname.startsWith("/dashboard")) {
    // Check if the user has a subscription by looking at the cookie
    const hasSubscription =
      request.cookies.get("webdash_has_subscription")?.value === "true";

    // If they don't have a subscription, we'll let the dashboard component handle the redirect
    // since middleware can't access localStorage

    // Continue for all paths
    return NextResponse.next();
  }

  // Continue for all other paths
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: "/dashboard/:path*",
};
