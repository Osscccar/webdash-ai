// src/types/workspace.ts

export interface Workspace {
  id: string;
  name: string;
  ownerId: string; // The user who created/owns the workspace
  createdAt: string;
  updatedAt: string;
  collaborators: WorkspaceCollaborator[];
  websites: string[]; // Array of website IDs associated with this workspace
}

export interface WorkspaceCollaborator {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: CollaboratorRole;
  addedAt: string;
  addedBy: string; // User ID of who added this collaborator
  status: CollaboratorStatus;
}

export type CollaboratorRole = "owner" | "admin" | "member";
export type CollaboratorStatus = "pending" | "active" | "inactive";

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  workspaceName: string;
  inviterEmail: string;
  inviterName: string;
  inviteeEmail: string;
  role: CollaboratorRole;
  status: "pending" | "accepted" | "declined" | "expired";
  createdAt: string;
  expiresAt: string;
}

// Plan limits for workspaces and collaborators
export interface PlanLimits {
  workspaces: number; // -1 means unlimited
  collaborators: number; // -1 means unlimited
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  business: {
    workspaces: 1,
    collaborators: 1,
  },
  agency: {
    workspaces: 5,
    collaborators: 3,
  },
  enterprise: {
    workspaces: -1, // unlimited
    collaborators: -1, // unlimited
  },
};

// Permissions for different roles
export interface WorkspacePermissions {
  canEditWorkspace: boolean;
  canDeleteWorkspace: boolean;
  canAddCollaborators: boolean;
  canRemoveCollaborators: boolean;
  canManageWebsites: boolean;
  canViewAnalytics: boolean;
}

export const ROLE_PERMISSIONS: Record<CollaboratorRole, WorkspacePermissions> =
  {
    owner: {
      canEditWorkspace: true,
      canDeleteWorkspace: true,
      canAddCollaborators: true,
      canRemoveCollaborators: true,
      canManageWebsites: true,
      canViewAnalytics: true,
    },
    admin: {
      canEditWorkspace: true,
      canDeleteWorkspace: false,
      canAddCollaborators: true,
      canRemoveCollaborators: true,
      canManageWebsites: true,
      canViewAnalytics: true,
    },
    member: {
      canEditWorkspace: false,
      canDeleteWorkspace: false,
      canAddCollaborators: false,
      canRemoveCollaborators: false,
      canManageWebsites: true,
      canViewAnalytics: true,
    },
  };
