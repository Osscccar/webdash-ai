"use client";

import { useState } from "react";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  ChevronDown, 
  Plus, 
  Settings, 
  Crown, 
  Users,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AddCollaboratorDialog } from "./add-collaborator-dialog";
import type { Workspace } from "@/types/workspace";
import { PLAN_LIMITS } from "@/types/workspace";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/use-toast";

interface WorkspaceSwitcherProps {
  onWorkspaceChange?: (workspace: Workspace) => void;
}

export function WorkspaceSwitcher({ onWorkspaceChange }: WorkspaceSwitcherProps) {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const {
    workspaces,
    activeWorkspace,
    isLoading,
    loadWorkspaces,
    changeActiveWorkspace,
    getUserRole,
    canManageWorkspace,
  } = useWorkspaces();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Get user's plan limits
  const getUserPlanLimits = () => {
    const planType = userData?.webdashSubscription?.planType || userData?.planType || "business";
    return PLAN_LIMITS[planType] || PLAN_LIMITS.business;
  };

  const planLimits = getUserPlanLimits();
  const canCreateWorkspace = planLimits.workspaces === -1 || workspaces.length < planLimits.workspaces;

  const createWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;

    try {
      setIsCreating(true);
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user!.uid,
          name: newWorkspaceName.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadWorkspaces();
        setNewWorkspaceName("");
        setShowCreateModal(false);
        toast({
          title: "Workspace created",
          description: `${data.workspace.name} has been created successfully.`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Error creating workspace",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const switchWorkspace = (workspace: Workspace) => {
    changeActiveWorkspace(workspace);
    onWorkspaceChange?.(workspace);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
      </div>
    );
  }

  if (!activeWorkspace) {
    return (
      <div className="text-sm text-gray-500">
        No workspace available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Workspace Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 rounded bg-gray-200 flex items-center justify-center text-xs font-medium">
                {activeWorkspace.name.charAt(0)}
              </div>
              <div className="text-left">
                <div className="font-medium">{activeWorkspace.name}</div>
                <div className="text-xs text-gray-500">
                  {getUserRole(activeWorkspace)} • {activeWorkspace.collaborators.length} members
                </div>
              </div>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-64" align="start">
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => switchWorkspace(workspace)}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <div className="h-6 w-6 rounded bg-gray-200 flex items-center justify-center text-xs font-medium">
                {workspace.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-1">
                  <span className="font-medium">{workspace.name}</span>
                  {getUserRole(workspace) === "owner" && (
                    <Crown className="h-3 w-3 text-yellow-500" />
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {workspace.collaborators.length} members
                </div>
              </div>
              {workspace.id === activeWorkspace.id && (
                <Check className="h-4 w-4 text-green-600" />
              )}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setShowCreateModal(true)}
            disabled={!canCreateWorkspace}
            className="cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Quick Actions */}
      <div className="flex space-x-2">
        {canManageWorkspace(activeWorkspace) && (
          <AddCollaboratorDialog 
            workspace={activeWorkspace} 
            onSuccess={loadWorkspaces}
          >
            <Button size="sm" variant="outline" className="cursor-pointer">
              <Users className="h-4 w-4 mr-1" />
              Add Collaborator
            </Button>
          </AddCollaboratorDialog>
        )}
      </div>

      {/* Plan Limits */}
      <div className="text-xs text-gray-500">
        {planLimits.workspaces === -1 ? (
          "Unlimited workspaces"
        ) : (
          `${workspaces.length}/${planLimits.workspaces} workspaces`
        )}
      </div>

      {/* Create Workspace Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Workspace Name</Label>
              <Input
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="Enter workspace name"
                maxLength={50}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={createWorkspace}
                disabled={!newWorkspaceName.trim() || isCreating}
                className="cursor-pointer"
              >
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}