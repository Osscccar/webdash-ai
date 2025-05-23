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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
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
  Shield,
  User,
  Eye,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Workspace,
  WorkspaceCollaborator,
  CollaboratorRole,
} from "@/types/workspace";
import type { UserWebsite } from "@/types";
import { PLAN_LIMITS } from "@/types/workspace";

interface WorkspaceManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkspaceChange?: (workspace: Workspace) => void;
  websites?: UserWebsite[];
}

interface UserSearchResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
}

export function WorkspaceManagementModal({ 
  isOpen, 
  onClose, 
  onWorkspaceChange,
  websites = []
}: WorkspaceManagementModalProps) {
  const { user, userData } = useAuth();
  const { toast } = useToast();

  // State
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  
  // Add Collaborator State
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [collaboratorRole, setCollaboratorRole] = useState<CollaboratorRole>("member");
  const [searchResults, setSearchResults] = useState<UserSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedWebsites, setSelectedWebsites] = useState<string[]>([]);

  // Create Workspace State
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Get user's plan limits
  const getUserPlanLimits = () => {
    const planType = userData?.webdashSubscription?.planType || userData?.planType || "business";
    return PLAN_LIMITS[planType] || PLAN_LIMITS.business;
  };

  const planLimits = getUserPlanLimits();

  // Load workspaces
  useEffect(() => {
    if (user && isOpen) {
      loadWorkspaces();
    }
  }, [user, isOpen]);

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
        setWorkspaces(prev => [...prev, data.workspace]);
        setNewWorkspaceName("");
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
      }
    } catch (error: any) {
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  };

  const addCollaborator = async () => {
    if (!activeWorkspace || !collaboratorEmail.trim()) return;

    try {
      setIsAdding(true);
      const response = await fetch(`/api/workspaces/${activeWorkspace.id}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user!.uid,
          collaboratorEmail: collaboratorEmail.trim(),
          role: collaboratorRole,
          allowedWebsites: collaboratorRole === "client" ? selectedWebsites : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadWorkspaces();
        setCollaboratorEmail("");
        setSearchResults(null);
        setSelectedWebsites([]);
        setCollaboratorRole("member");
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
    } finally {
      setIsAdding(false);
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

  const getCurrentCollaboratorCount = (workspace: Workspace) => {
    return workspace.collaborators.filter(c => c.status === "active" && c.role !== "owner").length;
  };

  const canAddMoreCollaborators = activeWorkspace ? 
    planLimits.collaborators === -1 || 
    getCurrentCollaboratorCount(activeWorkspace) < planLimits.collaborators : false;

  const canCreateWorkspace = planLimits.workspaces === -1 || workspaces.length < planLimits.workspaces;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[85vh] p-0 overflow-hidden">
        <div className="flex h-full overflow-hidden">
          {/* Left Sidebar - Workspace List */}
          <div className="w-80 border-r bg-gray-50 p-6 overflow-y-auto">
            <DialogHeader className="mb-6">
              <DialogTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Workspace Settings</span>
              </DialogTitle>
            </DialogHeader>

            {/* Create Workspace */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">Workspaces</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setNewWorkspaceName("")}
                  disabled={!canCreateWorkspace}
                  className="cursor-pointer h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {newWorkspaceName !== null && (
                <div className="space-y-2 mb-4 p-3 border rounded-lg bg-white">
                  <Input
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="Workspace name"
                    maxLength={50}
                  />
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={createWorkspace}
                      disabled={!newWorkspaceName.trim() || isCreating}
                      className="cursor-pointer flex-1"
                    >
                      {isCreating ? "Creating..." : "Create"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNewWorkspaceName("")}
                      className="cursor-pointer"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Plan Limits */}
              <div className="text-xs text-gray-500 mb-4">
                {planLimits.workspaces === -1 ? (
                  "Unlimited workspaces"
                ) : (
                  `${workspaces.length}/${planLimits.workspaces} workspaces used`
                )}
              </div>
            </div>

            {/* Workspace List */}
            <div className="space-y-2">
              {workspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className={cn(
                    "p-3 border rounded-lg cursor-pointer hover:bg-white transition-colors",
                    activeWorkspace?.id === workspace.id ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
                  )}
                  onClick={() => setActiveWorkspace(workspace)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center text-sm font-medium">
                        {workspace.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">{workspace.name}</span>
                          {getUserRole(workspace) === "owner" && (
                            <Crown className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {workspace.collaborators.length} members • {getUserRole(workspace)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeWorkspace ? (
              <Tabs defaultValue="collaborators" className="flex-1 flex flex-col overflow-hidden">
                <div className="border-b px-6 py-4 shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      {isEditingName ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="font-medium text-lg"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                updateWorkspaceName(activeWorkspace.id, editedName);
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
                              updateWorkspaceName(activeWorkspace.id, editedName);
                              setIsEditingName(false);
                            }}
                            className="cursor-pointer"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsEditingName(false)}
                            className="cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <h2 className="font-medium text-lg">{activeWorkspace.name}</h2>
                          {canManageWorkspace(activeWorkspace) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditedName(activeWorkspace.name);
                                setIsEditingName(true);
                              }}
                              className="cursor-pointer h-8 w-8 p-0"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                      <p className="text-sm text-gray-500">
                        Manage collaborators and workspace settings
                      </p>
                    </div>
                    
                    {getUserRole(activeWorkspace) === "owner" && workspaces.length > 1 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Workspace
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{activeWorkspace.name}"? This action cannot be undone.
                              All collaborators will lose access to this workspace.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteWorkspace(activeWorkspace.id)}
                              className="bg-red-600 hover:bg-red-700 cursor-pointer"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>

                  <TabsList className="mt-4">
                    <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <TabsContent value="collaborators" className="p-6 space-y-6">
                    {/* Add Collaborator Section */}
                    {canManageWorkspace(activeWorkspace) && (
                      <div className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Add Collaborator</h3>
                          <div className="text-sm text-gray-500">
                            {getCurrentCollaboratorCount(activeWorkspace)}/{planLimits.collaborators === -1 ? "∞" : planLimits.collaborators} collaborators
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Email Address</Label>
                            <div className="relative">
                              <Input
                                type="email"
                                value={collaboratorEmail}
                                onChange={(e) => {
                                  setCollaboratorEmail(e.target.value);
                                  searchUser(e.target.value);
                                }}
                                placeholder="Enter email address"
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
                              <div className="p-3 border rounded-lg bg-green-50 border-green-200">
                                <div className="flex items-center space-x-2">
                                  <Check className="h-4 w-4 text-green-600" />
                                  <span className="text-sm text-green-800">
                                    User found: {searchResults.displayName}
                                  </span>
                                </div>
                              </div>
                            )}

                            {collaboratorEmail && !searchResults && !isSearching && (
                              <div className="p-3 border rounded-lg bg-red-50 border-red-200">
                                <div className="flex items-center space-x-2">
                                  <X className="h-4 w-4 text-red-600" />
                                  <span className="text-sm text-red-800">
                                    No user found. They must have a WebDash account first.
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Role</Label>
                            <Select 
                              value={collaboratorRole} 
                              onValueChange={(value: CollaboratorRole) => {
                                setCollaboratorRole(value);
                                if (value !== "client") {
                                  setSelectedWebsites([]);
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin - Full management access</SelectItem>
                                <SelectItem value="member">Member - Can manage websites</SelectItem>
                                <SelectItem value="client">Client - Limited website access</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Website Selection for Client Role */}
                        {collaboratorRole === "client" && (
                          <div className="space-y-2">
                            <Label>Allowed Websites</Label>
                            <div className="border rounded-lg p-3 max-h-32 overflow-y-auto">
                              {(() => {
                                // Only show websites that belong to the current workspace
                                const workspaceWebsites = websites.filter(website => 
                                  website.workspaceId === activeWorkspace?.id
                                );
                                
                                if (workspaceWebsites.length === 0) {
                                  return (
                                    <div className="text-sm text-gray-500 py-2">
                                      No websites in this workspace yet.
                                    </div>
                                  );
                                }
                                
                                return workspaceWebsites.map((website) => (
                                  <div key={website.id} className="flex items-center space-x-2 py-1">
                                    <Checkbox
                                      id={website.id}
                                      checked={selectedWebsites.includes(website.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedWebsites(prev => [...prev, website.id]);
                                        } else {
                                          setSelectedWebsites(prev => prev.filter(id => id !== website.id));
                                        }
                                      }}
                                    />
                                    <Label htmlFor={website.id} className="text-sm cursor-pointer">
                                      {website.title || website.subdomain || 'Untitled Website'}
                                    </Label>
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>
                        )}

                        <Button
                          onClick={addCollaborator}
                          disabled={!collaboratorEmail.trim() || !searchResults || isAdding || !canAddMoreCollaborators}
                          className="cursor-pointer w-full"
                        >
                          {isAdding ? "Adding..." : "Add Collaborator"}
                        </Button>
                      </div>
                    )}

                    {/* Collaborators List */}
                    <div className="space-y-3">
                      <h3 className="font-medium">Current Collaborators</h3>
                      {activeWorkspace.collaborators.map((collaborator) => (
                        <div
                          key={collaborator.userId}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              {collaborator.role === "owner" ? (
                                <Crown className="h-5 w-5 text-yellow-500" />
                              ) : collaborator.role === "admin" ? (
                                <Shield className="h-5 w-5 text-blue-500" />
                              ) : collaborator.role === "client" ? (
                                <Eye className="h-5 w-5 text-purple-500" />
                              ) : (
                                <User className="h-5 w-5 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">
                                {collaborator.firstName && collaborator.lastName
                                  ? `${collaborator.firstName} ${collaborator.lastName}`
                                  : collaborator.email}
                              </div>
                              <div className="text-sm text-gray-500">{collaborator.email}</div>
                              {collaborator.role === "client" && collaborator.allowedWebsites && (
                                <div className="text-xs text-gray-400">
                                  {(() => {
                                    const allowedWebsiteNames = collaborator.allowedWebsites
                                      .map(websiteId => {
                                        const website = websites.find(w => w.id === websiteId);
                                        return website?.title || website?.subdomain || 'Unknown Website';
                                      })
                                      .filter(Boolean);
                                    
                                    if (allowedWebsiteNames.length === 0) {
                                      return "No websites assigned";
                                    }
                                    
                                    if (allowedWebsiteNames.length <= 2) {
                                      return `Access to: ${allowedWebsiteNames.join(', ')}`;
                                    }
                                    
                                    return `Access to: ${allowedWebsiteNames.slice(0, 2).join(', ')} and ${allowedWebsiteNames.length - 2} more`;
                                  })()}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-xs font-medium",
                              collaborator.role === "owner" 
                                ? "bg-yellow-100 text-yellow-800"
                                : collaborator.role === "admin"
                                ? "bg-blue-100 text-blue-800"
                                : collaborator.role === "client"
                                ? "bg-purple-100 text-purple-800"
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
                  </TabsContent>

                  <TabsContent value="settings" className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium mb-4">Workspace Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-gray-500">Workspace ID</Label>
                            <p className="font-mono text-sm">{activeWorkspace.id}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-500">Created</Label>
                            <p className="text-sm">
                              {new Date(activeWorkspace.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-500">Total Members</Label>
                            <p className="text-sm">{activeWorkspace.collaborators.length}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-500">Websites</Label>
                            <p className="text-sm">{activeWorkspace.websites?.length || 0}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium mb-4">Plan Limits</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-gray-500">Workspaces</Label>
                            <p className="text-sm">
                              {planLimits.workspaces === -1 ? "Unlimited" : `${workspaces.length}/${planLimits.workspaces}`}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-500">Collaborators per workspace</Label>
                            <p className="text-sm">
                              {planLimits.collaborators === -1 ? "Unlimited" : planLimits.collaborators}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">No workspace selected</h3>
                  <p className="text-gray-500">Select a workspace from the sidebar to manage it.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}