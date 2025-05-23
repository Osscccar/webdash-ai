"use client";

import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Check, X, Mail } from "lucide-react";
import type { Workspace, CollaboratorRole } from "@/types/workspace";
import { PLAN_LIMITS } from "@/types/workspace";

interface AddCollaboratorDialogProps {
  workspace: Workspace;
  onSuccess: () => void;
  children?: React.ReactNode;
}

interface UserSearchResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
}

export function AddCollaboratorDialog({ 
  workspace, 
  onSuccess, 
  children 
}: AddCollaboratorDialogProps) {
  const { user, userData } = useAuth();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [collaboratorRole, setCollaboratorRole] = useState<CollaboratorRole>("member");
  const [searchResults, setSearchResults] = useState<UserSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Get user's plan limits
  const getUserPlanLimits = () => {
    const planType = userData?.webdashSubscription?.planType || userData?.planType || "business";
    return PLAN_LIMITS[planType] || PLAN_LIMITS.business;
  };

  const planLimits = getUserPlanLimits();
  const currentCollaboratorCount = workspace.collaborators.filter(
    c => c.status === "active" && c.role !== "owner"
  ).length;

  const canAddMoreCollaborators = 
    planLimits.collaborators === -1 || 
    currentCollaboratorCount < planLimits.collaborators;

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
      console.error("Error searching user:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const addCollaborator = async () => {
    if (!collaboratorEmail.trim() || !searchResults) return;

    try {
      setIsAdding(true);
      const response = await fetch(`/api/workspaces/${workspace.id}/collaborators`, {
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
        toast({
          title: "Collaborator added",
          description: `${collaboratorEmail} has been added to ${workspace.name}.`,
        });
        
        // Reset form
        setCollaboratorEmail("");
        setSearchResults(null);
        setCollaboratorRole("member");
        setIsOpen(false);
        onSuccess();
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

  const handleClose = () => {
    setIsOpen(false);
    setCollaboratorEmail("");
    setSearchResults(null);
    setCollaboratorRole("member");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            disabled={!canAddMoreCollaborators}
            className="cursor-pointer"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Collaborator
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Add Collaborator to {workspace.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Plan limits info */}
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>
                {currentCollaboratorCount}/{planLimits.collaborators === -1 ? "∞" : planLimits.collaborators} collaborators used
              </span>
            </div>
          </div>

          {/* Email input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Input
                id="email"
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

          {/* Role selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={collaboratorRole} onValueChange={(value: CollaboratorRole) => setCollaboratorRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member - Can manage websites</SelectItem>
                <SelectItem value="admin">Admin - Can manage websites and collaborators</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={addCollaborator}
              disabled={!collaboratorEmail.trim() || !searchResults || isAdding}
              className="cursor-pointer"
            >
              {isAdding ? "Adding..." : "Add Collaborator"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}