// src/app/api/workspaces/[workspaceId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/config/firebase-admin";
import { AdminAuthService } from "@/lib/admin-auth-service";
import type { Workspace } from "@/types/workspace";

// GET /api/workspaces/[workspaceId] - Get specific workspace
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { workspaceId } = params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get workspace
    const workspaceRef = adminDb.collection("workspaces").doc(workspaceId);
    const workspaceDoc = await workspaceRef.get();

    if (!workspaceDoc.exists) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const workspace = {
      id: workspaceDoc.id,
      ...workspaceDoc.data(),
    } as Workspace;

    // Check if user has access to this workspace
    const userHasAccess = workspace.collaborators.some(
      (collaborator) =>
        collaborator.userId === userId && collaborator.status === "active"
    );

    if (!userHasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      workspace,
    });
  } catch (error: any) {
    console.error("Error fetching workspace:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch workspace" },
      { status: 500 }
    );
  }
}

// PUT /api/workspaces/[workspaceId] - Update workspace (name, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { workspaceId } = params;
    const { userId, name } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get workspace
    const workspaceRef = adminDb.collection("workspaces").doc(workspaceId);
    const workspaceDoc = await workspaceRef.get();

    if (!workspaceDoc.exists) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const workspace = {
      id: workspaceDoc.id,
      ...workspaceDoc.data(),
    } as Workspace;

    // Check if user is owner or admin
    const userCollaborator = workspace.collaborators.find(
      (collaborator) =>
        collaborator.userId === userId && collaborator.status === "active"
    );

    if (
      !userCollaborator ||
      (userCollaborator.role !== "owner" && userCollaborator.role !== "admin")
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions to update workspace" },
        { status: 403 }
      );
    }

    // Update workspace
    const updates: Partial<Workspace> = {
      updatedAt: new Date().toISOString(),
    };

    if (name && name.trim()) {
      updates.name = name.trim();
    }

    await workspaceRef.update(updates);

    const updatedWorkspace = { ...workspace, ...updates };

    return NextResponse.json({
      success: true,
      workspace: updatedWorkspace,
    });
  } catch (error: any) {
    console.error("Error updating workspace:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update workspace" },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[workspaceId] - Delete workspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { workspaceId } = params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get workspace
    const workspaceRef = adminDb.collection("workspaces").doc(workspaceId);
    const workspaceDoc = await workspaceRef.get();

    if (!workspaceDoc.exists) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const workspace = {
      id: workspaceDoc.id,
      ...workspaceDoc.data(),
    } as Workspace;

    // Only owner can delete workspace
    if (workspace.ownerId !== userId) {
      return NextResponse.json(
        { error: "Only workspace owner can delete the workspace" },
        { status: 403 }
      );
    }

    // Don't allow deletion if it's the user's only workspace
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    const userWorkspaces = userData?.workspaces || [];

    if (userWorkspaces.length <= 1) {
      return NextResponse.json(
        { error: "Cannot delete your only workspace" },
        { status: 400 }
      );
    }

    // Remove workspace from all collaborators' workspace lists
    const batch = adminDb.batch();

    for (const collaborator of workspace.collaborators) {
      if (collaborator.userId !== userId) {
        const collaboratorRef = adminDb
          .collection("users")
          .doc(collaborator.userId);
        const collaboratorDoc = await collaboratorRef.get();

        if (collaboratorDoc.exists) {
          const collaboratorData = collaboratorDoc.data();
          const collaboratorWorkspaces = (
            collaboratorData?.workspaces || []
          ).filter((id: string) => id !== workspaceId);

          batch.update(collaboratorRef, {
            workspaces: collaboratorWorkspaces,
            // If this was their default workspace, clear it
            ...(collaboratorData?.defaultWorkspaceId === workspaceId && {
              defaultWorkspaceId: collaboratorWorkspaces[0] || null,
            }),
            updatedAt: new Date(),
          });
        }
      }
    }

    // Remove workspace from owner's list
    const ownerWorkspaces = userWorkspaces.filter(
      (id: string) => id !== workspaceId
    );
    batch.update(userRef, {
      workspaces: ownerWorkspaces,
      // If this was their default workspace, set a new one
      ...(userData?.defaultWorkspaceId === workspaceId && {
        defaultWorkspaceId: ownerWorkspaces[0] || null,
      }),
      updatedAt: new Date(),
    });

    // Delete the workspace
    batch.delete(workspaceRef);

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: "Workspace deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting workspace:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete workspace" },
      { status: 500 }
    );
  }
}
