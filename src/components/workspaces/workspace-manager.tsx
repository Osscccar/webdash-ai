"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/use-toast";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Settings,
  Users,
  Trash2,
  Edit3,
  Check,
  X,
  Crown,
  UserPlus,
  Mail,
  Search,
  MoreVertical,
  Shield,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Workspace,
  WorkspaceCollaborator,
  PLAN_LIMITS,
  CollaboratorRole,
} from "@/types/workspace";
import { PLAN_LIMITS as WORKSPACE_LIMITS } from "@/types/workspace";

interface WorkspaceManagerProps {
  onWorkspaceChange?: (workspace: Workspace) => void;
}

interface UserSearchResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
}

export function WorkspaceManager({ onWorkspaceChange }: WorkspaceManagerProps) {
  const { user, userData } = useAuth();
  const { toast } = useToast();

  // State
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
  const [showAddCollaboratorModal, setShowAddCollaboratorModal] = useState(false);
  
  // Forms
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [collaboratorRole, setCollaboratorRole] = useState<CollaboratorRole>("member");
  const [searchResults, setSearchResults] = useState<UserSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState<WorkspaceCollaborator | null>(null);

  // Get user's plan limits
  const getUserPlanLimits = () => {
    const planType = userData?.webdashSubscription?.planType || userData?.planType || "business";
    return WORKSPACE_LIMITS[planType] || WORKSPACE_LIMITS.business;
  };

  // Load workspaces
  useEffect(() => {
    if (user) {
      loadWorkspaces();
    }
  }, [user]);

  const loadWorkspaces = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/workspaces?userId=${user!.uid}`);
      const data = await response.json();

      if (data.success) {
        setWorkspaces(data.workspaces);
        if (data.workspaces.length > 0) {
          const defaultWorkspace = data.workspaces.find(
            (w: Workspace) => w.id === data.defaultWorkspaceId
          ) || data.workspaces[0];
          setActiveWorkspace(defaultWorkspace);
          onWorkspaceChange?.(defaultWorkspace);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error("Error loading workspaces:", error);
      toast({
        title: "Error loading workspaces",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;

    try {
      setIsCreatingWorkspace(true);
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
        setWorkspaces(prev => [...prev, data.workspace]);
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
      setIsCreatingWorkspace(false);
    }
  };

  const updateWorkspaceName = async (workspaceId: string, newName: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user!.uid,
          name: newName.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setWorkspaces(prev =>
          prev.map(w => w.id === workspaceId ? data.workspace : w)
        );
        if (activeWorkspace?.id === workspaceId) {
          setActiveWorkspace(data.workspace);
          onWorkspaceChange?.(data.workspace);
        }
        toast({
          title: "Workspace updated",
          description: "Workspace name has been updated successfully.",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Error updating workspace",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteWorkspace = async (workspaceId: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}?userId=${user!.uid}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));
        if (activeWorkspace?.id === workspaceId) {
          const remainingWorkspaces = workspaces.filter(w => w.id !== workspaceId);
          if (remainingWorkspaces.length > 0) {
            setActiveWorkspace(remainingWorkspaces[0]);
            onWorkspaceChange?.(remainingWorkspaces[0]);
          }
        }
        toast({
          title: "Workspace deleted",
          description: "Workspace has been deleted successfully.",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Error deleting workspace",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const searchUser = async (email: string) => {
    if (!email.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      setIsSearching(true);
      const response = await fetch(`/api/users/search?email=${encodeURIComponent(email)}&userId=${user!.uid}`);
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.user);
      } else {
        setSearchResults(null);
        if (data.error !== "No user found with this email address") {
          toast({
            title: "Search error",
            description: data.error,
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      setSearchResults(null);
      toast({
        title: "Error searching user",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const addCollaborator = async () => {
    if (!activeWorkspace || !collaboratorEmail.trim()) return;

    try {
      const response = await fetch(`/api/workspaces/${activeWorkspace.id}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user!.uid,
          collaboratorEmail: collaboratorEmail.trim(),
          role: collaboratorRole,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Reload workspace data
        await loadWorkspaces();
        setCollaboratorEmail("");
        setSearchResults(null);
        setShowAddCollaboratorModal(false);
        toast({
          title: "Collaborator added",
          description: `${collaboratorEmail} has been added to the workspace.`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Error adding collaborator",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const removeCollaborator = async (collaboratorId: string) => {
    if (!activeWorkspace) return;

    try {
      const response = await fetch(
        `/api/workspaces/${activeWorkspace.id}/collaborators?userId=${user!.uid}&collaboratorId=${collaboratorId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (data.success) {
        await loadWorkspaces();
        toast({
          title: "Collaborator removed",
          description: "Collaborator has been removed from the workspace.",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Error removing collaborator",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getUserRole = (workspace: Workspace) => {
    const collaborator = workspace.collaborators.find(c => c.userId === user!.uid);
    return collaborator?.role || "member";
  };

  const canManageWorkspace = (workspace: Workspace) => {
    const role = getUserRole(workspace);
    return role === "owner" || role === "admin";
  };

  const canAddCollaborators = (workspace: Workspace) => {
    return canManageWorkspace(workspace);
  };

  const getCurrentCollaboratorCount = (workspace: Workspace) => {
    return workspace.collaborators.filter(c => c.status === "active" && c.role !== "owner").length;
  };

  const planLimits = getUserPlanLimits();

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Workspace Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-700">Active Workspace</Label>
          <div className="flex space-x-2">
            {/* Create Workspace Button */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={
                    planLimits.workspaces !== -1 && workspaces.length >= planLimits.workspaces
                  }
                  className="cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
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
                      disabled={!newWorkspaceName.trim() || isCreatingWorkspace}
                      className="cursor-pointer"
                    >
                      {isCreatingWorkspace ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Manage Collaborators Button */}
            {activeWorkspace && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCollaboratorsModal(true)}
                className="cursor-pointer"
              >
                <Users className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Workspace List */}
        <div className="space-y-2">
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              className={cn(
                "flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50",
                activeWorkspace?.id === workspace.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
              )}
              onClick={() => {
                setActiveWorkspace(workspace);
                onWorkspaceChange?.(workspace);
              }}
            >
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center text-sm font-medium">
                  {workspace.name.charAt(0)}
                </div>
                <div>
                  {isEditingName && activeWorkspace?.id === workspace.id ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="h-6 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            updateWorkspaceName(workspace.id, editedName);
                            setIsEditingName(false);
                          } else if (e.key === "Escape") {
                            setIsEditingName(false);
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          updateWorkspaceName(workspace.id, editedName);
                          setIsEditingName(false);
                        }}
                        className="h-6 w-6 p-0 cursor-pointer"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingName(false)}
                        className="h-6 w-6 p-0 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{workspace.name}</span>
                      {getUserRole(workspace) === "owner" && (
                        <Crown className="h-3 w-3 text-yellow-500" />
                      )}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    {workspace.collaborators.length} member{workspace.collaborators.length !== 1 ? "s" : ""}
                    {" • "}
                    {getUserRole(workspace)}
                  </div>
                </div>
              </div>

              {canManageWorkspace(workspace) && (
                <div className="flex items-center space-x-1">
                  {!isEditingName && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditedName(workspace.name);
                        setIsEditingName(true);
                        setActiveWorkspace(workspace);
                      }}
                      className="h-6 w-6 p-0 cursor-pointer"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  )}
                  
                  {getUserRole(workspace) === "owner" && workspaces.length > 1 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => e.stopPropagation()}
                          className="h-6 w-6 p-0 cursor-pointer text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{workspace.name}"? This action cannot be undone.
                            All collaborators will lose access to this workspace.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteWorkspace(workspace.id)}
                            className="bg-red-600 hover:bg-red-700 cursor-pointer"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Plan Limits Info */}
        <div className="text-xs text-gray-500">
          {planLimits.workspaces === -1 ? (
            "Unlimited workspaces"
          ) : (
            `${workspaces.length}/${planLimits.workspaces} workspaces used`
          )}
        </div>
      </div>

      {/* Collaborators Modal */}
      <Dialog open={showCollaboratorsModal} onOpenChange={setShowCollaboratorsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Manage Collaborators - {activeWorkspace?.name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add Collaborator Button */}
            {activeWorkspace && canAddCollaborators(activeWorkspace) && (
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {getCurrentCollaboratorCount(activeWorkspace)}/{planLimits.collaborators === -1 ? "" : planLimits.collaborators} collaborators
                </div>
                <Button
                  onClick={() => setShowAddCollaboratorModal(true)}
                  disabled={
                    planLimits.collaborators !== -1 &&
                    getCurrentCollaboratorCount(activeWorkspace) >= planLimits.collaborators
                  }
                  className="cursor-pointer"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Collaborator
                </Button>
              </div>
            )}

            {/* Collaborators List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {activeWorkspace?.collaborators.map((collaborator) => (
                <div
                  key={collaborator.userId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      {collaborator.role === "owner" ? (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      ) : collaborator.role === "admin" ? (
                        <Shield className="h-4 w-4 text-blue-500" />
                      ) : (
                        <User className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        {collaborator.firstName && collaborator.lastName
                          ? `${collaborator.firstName} ${collaborator.lastName}`
                          : collaborator.email}
                      </div>
                      <div className="text-sm text-gray-500">{collaborator.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      collaborator.role === "owner" 
                        ? "bg-yellow-100 text-yellow-800"
                        : collaborator.role === "admin"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    )}>
                      {collaborator.role}
                    </span>

                    {canManageWorkspace(activeWorkspace) && 
                     collaborator.role !== "owner" && 
                     collaborator.userId !== user!.uid && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Collaborator</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove {collaborator.email} from this workspace?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeCollaborator(collaborator.userId)}
                              className="bg-red-600 hover:bg-red-700 cursor-pointer"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Collaborator Modal */}
      <Dialog open={showAddCollaboratorModal} onOpenChange={setShowAddCollaboratorModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Collaborator</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Email Address</Label>
              <div className="relative">
                <Input
                  type="email"
                  value={collaboratorEmail}
                  onChange={(e) => {
                    setCollaboratorEmail(e.target.value);
                    searchUser(e.target.value);
                  }}
                  placeholder="Enter collaborator's email"
                  className="pr-10"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults && (
                <div className="mt-2 p-3 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">
                      User found: {searchResults.displayName}
                    </span>
                  </div>
                </div>
              )}

              {collaboratorEmail && !searchResults && !isSearching && (
                <div className="mt-2 p-3 border rounded-lg bg-red-50 border-red-200">
                  <div className="flex items-center space-x-2">
                    <X className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-800">
                      No user found with this email. They must have a WebDash account first.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label>Role</Label>
              <select
                value={collaboratorRole}
                onChange={(e) => setCollaboratorRole(e.target.value as CollaboratorRole)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="member">Member - Can manage websites</option>
                <option value="admin">Admin - Can manage websites and collaborators</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddCollaboratorModal(false);
                  setCollaboratorEmail("");
                  setSearchResults(null);
                }}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={addCollaborator}
                disabled={!collaboratorEmail.trim() || !searchResults}
                className="cursor-pointer"
              >
                Add Collaborator
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}