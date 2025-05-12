"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function EditorNav() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 md:px-6 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-medium text-xl tracking-tight">
              <span className="text-[#f58327]">Web</span>
              <span className="text-black">Dash</span>
            </span>
          </Link>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              className="text-gray-600 hover:text-[#f58327]"
              onClick={() => router.push("/")}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#f58327] hover:bg-[#f58327]/90 text-white"
              onClick={() => router.push("/preview")}
            >
              Preview Website
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
