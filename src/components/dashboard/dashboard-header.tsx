"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { getUserInitials } from "@/lib/utils";
import { Bell, HelpCircle, Menu, X, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function DashboardHeader() {
  const router = useRouter();
  const { user, userData, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userInitials = getUserInitials(
    userData?.firstName && userData?.lastName
      ? `${userData.firstName} ${userData.lastName}`
      : user?.email?.split("@")[0]
  );

  const userFullName =
    userData?.firstName && userData?.lastName
      ? `${userData.firstName} ${userData.lastName}`
      : user?.email?.split("@")[0];

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <SidebarTrigger className="text-gray-500" />

            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-[#f58327] text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/settings"
                className="text-gray-500 hover:text-[#f58327] text-sm font-medium transition-colors"
              >
                Settings
              </Link>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 cursor-pointer"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 relative cursor-pointer"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full cursor-pointer"
                >
                  <Avatar className="h-8 w-8 border border-gray-200">
                    <AvatarFallback className="bg-gray-100 text-gray-800">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{userFullName}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard")}
                  className="cursor-pointer"
                >
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/settings")}
                  className="cursor-pointer"
                >
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer"
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-600 cursor-pointer"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-4">
            <Link
              href="/dashboard"
              className="block py-2 text-gray-600 hover:text-[#f58327] text-sm font-medium transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/settings"
              className="block py-2 text-gray-600 hover:text-[#f58327] text-sm font-medium transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Settings
            </Link>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center pb-2">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarFallback className="bg-gray-100 text-gray-800">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{userFullName}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-600 hover:text-[#f58327] cursor-pointer"
                onClick={() => {
                  handleSignOut();
                  setIsMobileMenuOpen(false);
                }}
              >
                Sign out
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
