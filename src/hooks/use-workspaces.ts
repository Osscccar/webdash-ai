"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";
import { useToast } from "@/components/ui/use-toast";
import type { Workspace } from "@/types/workspace";

export function useWorkspaces() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load workspaces
  const loadWorkspaces = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/workspaces?userId=${user.uid}`);
      const data = await response.json();

      if (data.success) {
        setWorkspaces(data.workspaces);
        
        // Set active workspace
        if (data.workspaces.length > 0) {
          const defaultWorkspace = data.workspaces.find(
            (w: Workspace) => w.id === data.defaultWorkspaceId
          ) || data.workspaces[0];
          setActiveWorkspace(defaultWorkspace);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error("Error loading workspaces:", error);
      setError(error.message);
      toast({
        title: "Error loading workspaces",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Change active workspace
  const changeActiveWorkspace = (workspace: Workspace) => {
    setActiveWorkspace(workspace);
  };

  // Get current user's role in workspace
  const getUserRole = (workspace: Workspace) => {
    if (!user) return null;
    const collaborator = workspace.collaborators.find(c => c.userId === user.uid);
    return collaborator?.role || null;
  };

  // Check permissions
  const canManageWorkspace = (workspace: Workspace) => {
    const role = getUserRole(workspace);
    return role === "owner" || role === "admin";
  };

  const canAddCollaborators = (workspace: Workspace) => {
    return canManageWorkspace(workspace);
  };

  const canDeleteWorkspace = (workspace: Workspace) => {
    return getUserRole(workspace) === "owner";
  };

  // Load workspaces when user changes
  useEffect(() => {
    if (user) {
      loadWorkspaces();
    } else {
      setWorkspaces([]);
      setActiveWorkspace(null);
      setIsLoading(false);
    }
  }, [user]);

  return {
    workspaces,
    activeWorkspace,
    isLoading,
    error,
    loadWorkspaces,
    changeActiveWorkspace,
    getUserRole,
    canManageWorkspace,
    canAddCollaborators,
    canDeleteWorkspace,
  };
}