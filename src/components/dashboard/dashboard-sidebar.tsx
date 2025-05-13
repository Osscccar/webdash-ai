"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Plus,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import Image from "next/image";
import WebDashLogo from "../../../public/WebDash.webp";

interface DashboardSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSignOut: () => void;
  activeWorkspace?: {
    id: string;
    name: string;
    role: string;
  };
  workspaces?: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  onWorkspaceChange?: (workspace: {
    id: string;
    name: string;
    role: string;
  }) => void;
}

export function DashboardSidebar({
  isCollapsed,
  onToggleCollapse,
  onSignOut,
  activeWorkspace,
  workspaces = [],
  onWorkspaceChange,
}: DashboardSidebarProps) {
  const router = useRouter();

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 transition-all duration-300 ease-in-out",
        isCollapsed ? "-translate-x-full md:translate-x-0 md:w-20" : ""
      )}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <Image src={WebDashLogo} alt="WebDash Logo" width={40} height={40} />
        </div>
        <button
          onClick={onToggleCollapse}
          className="text-gray-400 hover:text-gray-600 md:block hidden cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Workspace Selector */}
      {!isCollapsed && activeWorkspace && (
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-normal">
                {activeWorkspace.name.charAt(0)}
              </div>
              <div className="text-sm font-normal truncate">
                {activeWorkspace.name}
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-600 cursor-pointer">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <div className="p-2 overflow-y-auto h-[calc(100vh-8rem)]">
        {/* Main Navigation */}
        <div className="mb-6">
          {!isCollapsed && (
            <p className="text-xs font-normal text-gray-400 px-3 mb-2">
              NAVIGATION
            </p>
          )}
          <ul className="space-y-1">
            <li>
              <Link
                href="/dashboard"
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 font-normal hover:bg-gray-100 transition-colors",
                  "bg-gray-100 text-[#f58327]",
                  isCollapsed ? "justify-center" : ""
                )}
              >
                <LayoutDashboard className="h-5 w-5" />
                {!isCollapsed && <span>Dashboard</span>}
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/settings"
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 font-normal hover:bg-gray-100 transition-colors",
                  isCollapsed ? "justify-center" : ""
                )}
              >
                <Settings className="h-5 w-5" />
                {!isCollapsed && <span>Settings</span>}
              </Link>
            </li>
          </ul>
        </div>

        {/* Workspaces */}
        {!isCollapsed && workspaces.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-xs font-normal text-gray-400">WORKSPACES</p>
              <button className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <ul className="space-y-1">
              {workspaces.map((workspace) => (
                <li key={workspace.id}>
                  <button
                    onClick={() =>
                      onWorkspaceChange && onWorkspaceChange(workspace)
                    }
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 font-normal hover:bg-gray-100 transition-colors text-left",
                      activeWorkspace?.id === workspace.id ? "bg-gray-100" : ""
                    )}
                  >
                    <div className="h-6 w-6 rounded-md bg-gray-200 flex items-center justify-center text-xs font-normal">
                      {workspace.name.charAt(0)}
                      {workspace.name.split(" ")[1]?.charAt(0) || ""}
                    </div>
                    <span className="truncate">{workspace.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
        <button
          onClick={onSignOut}
          className={cn(
            "flex items-center space-x-3 w-full px-3 py-2 rounded-md text-gray-700 font-normal hover:bg-gray-100 transition-colors cursor-pointer",
            isCollapsed ? "justify-center" : ""
          )}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}
