// src/app/api/workspaces/[workspaceId]/collaborators/route.ts

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/config/firebase-admin";
import { AdminAuthService } from "@/lib/admin-auth-service";
import { PLAN_LIMITS } from "@/types/workspace";
import type { Workspace, WorkspaceCollaborator } from "@/types/workspace";

// GET /api/workspaces/[workspaceId]/collaborators - Get workspace collaborators
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
      collaborators: workspace.collaborators,
    });
  } catch (error: any) {
    console.error("Error fetching collaborators:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch collaborators" },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[workspaceId]/collaborators - Add collaborator to workspace
export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { workspaceId } = params;
    const { userId, collaboratorEmail, role = "member" } = await request.json();

    if (!userId || !collaboratorEmail) {
      return NextResponse.json(
        { error: "User ID and collaborator email are required" },
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

    // Check if user can add collaborators (owner or admin)
    const userCollaborator = workspace.collaborators.find(
      (collaborator) =>
        collaborator.userId === userId && collaborator.status === "active"
    );

    if (
      !userCollaborator ||
      (userCollaborator.role !== "owner" && userCollaborator.role !== "admin")
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions to add collaborators" },
        { status: 403 }
      );
    }

    // Check collaborator limits based on workspace owner's plan
    const ownerRef = adminDb.collection("users").doc(workspace.ownerId);
    const ownerDoc = await ownerRef.get();
    const ownerData = ownerDoc.data();
    const planType =
      ownerData?.webdashSubscription?.planType ||
      ownerData?.planType ||
      "business";
    const planLimits = PLAN_LIMITS[planType];

    const currentCollaboratorCount = workspace.collaborators.filter(
      (c) => c.status === "active" && c.role !== "owner"
    ).length;

    if (
      planLimits.collaborators !== -1 &&
      currentCollaboratorCount >= planLimits.collaborators
    ) {
      return NextResponse.json(
        {
          error: `Workspace has reached the maximum number of collaborators for the ${planType} plan (${planLimits.collaborators})`,
          planType,
          limit: planLimits.collaborators,
          current: currentCollaboratorCount,
        },
        { status: 403 }
      );
    }

    // Check if collaborator user exists
    const collaboratorUserRecord = await AdminAuthService.getUserByEmail(
      collaboratorEmail
    );
    if (!collaboratorUserRecord) {
      return NextResponse.json(
        { error: "User with this email does not have a WebDash account" },
        { status: 404 }
      );
    }

    // Check if user is already a collaborator
    const existingCollaborator = workspace.collaborators.find(
      (collaborator) => collaborator.userId === collaboratorUserRecord.uid
    );

    if (existingCollaborator) {
      if (existingCollaborator.status === "active") {
        return NextResponse.json(
          { error: "User is already a collaborator in this workspace" },
          { status: 400 }
        );
      } else {
        // Reactivate existing collaborator
        const updatedCollaborators = workspace.collaborators.map(
          (collaborator) =>
            collaborator.userId === collaboratorUserRecord.uid
              ? {
                  ...collaborator,
                  status: "active" as const,
                  role: role as any,
                  addedAt: new Date().toISOString(),
                  addedBy: userId,
                }
              : collaborator
        );

        await workspaceRef.update({
          collaborators: updatedCollaborators,
          updatedAt: new Date().toISOString(),
        });

        // Add workspace to collaborator's workspace list
        const collaboratorRef = adminDb
          .collection("users")
          .doc(collaboratorUserRecord.uid);
        const collaboratorDoc = await collaboratorRef.get();
        const collaboratorData = collaboratorDoc.data();
        const collaboratorWorkspaces = collaboratorData?.workspaces || [];

        if (!collaboratorWorkspaces.includes(workspaceId)) {
          await collaboratorRef.update({
            workspaces: [...collaboratorWorkspaces, workspaceId],
            updatedAt: new Date(),
          });
        }

        return NextResponse.json({
          success: true,
          message: "Collaborator reactivated successfully",
          collaborator: updatedCollaborators.find(
            (c) => c.userId === collaboratorUserRecord.uid
          ),
        });
      }
    }

    // Get collaborator user data for display name
    const collaboratorRef = adminDb
      .collection("users")
      .doc(collaboratorUserRecord.uid);
    const collaboratorDoc = await collaboratorRef.get();
    const collaboratorData = collaboratorDoc.data();

    // Add new collaborator
    const newCollaborator: WorkspaceCollaborator = {
      userId: collaboratorUserRecord.uid,
      email: collaboratorEmail,
      firstName: collaboratorData?.firstName || "",
      lastName: collaboratorData?.lastName || "",
      role: role as any,
      addedAt: new Date().toISOString(),
      addedBy: userId,
      status: "active",
    };

    const updatedCollaborators = [...workspace.collaborators, newCollaborator];

    await workspaceRef.update({
      collaborators: updatedCollaborators,
      updatedAt: new Date().toISOString(),
    });

    // Add workspace to collaborator's workspace list
    const collaboratorWorkspaces = collaboratorData?.workspaces || [];
    await collaboratorRef.update({
      workspaces: [...collaboratorWorkspaces, workspaceId],
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Collaborator added successfully",
      collaborator: newCollaborator,
    });
  } catch (error: any) {
    console.error("Error adding collaborator:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add collaborator" },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[workspaceId]/collaborators/[collaboratorId] - Remove collaborator
export async function DELETE(
  request: NextRequest,
  { params }: { params: { workspaceId: string; collaboratorId: string } }
) {
  try {
    const { workspaceId } = params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const collaboratorId = searchParams.get("collaboratorId");

    if (!userId || !collaboratorId) {
      return NextResponse.json(
        { error: "User ID and collaborator ID are required" },
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

    // Check if user can remove collaborators (owner or admin)
    const userCollaborator = workspace.collaborators.find(
      (collaborator) =>
        collaborator.userId === userId && collaborator.status === "active"
    );

    if (
      !userCollaborator ||
      (userCollaborator.role !== "owner" && userCollaborator.role !== "admin")
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions to remove collaborators" },
        { status: 403 }
      );
    }

    // Can't remove the owner
    const collaboratorToRemove = workspace.collaborators.find(
      (collaborator) => collaborator.userId === collaboratorId
    );

    if (!collaboratorToRemove) {
      return NextResponse.json(
        { error: "Collaborator not found" },
        { status: 404 }
      );
    }

    if (collaboratorToRemove.role === "owner") {
      return NextResponse.json(
        { error: "Cannot remove workspace owner" },
        { status: 400 }
      );
    }

    // Remove collaborator from workspace
    const updatedCollaborators = workspace.collaborators.filter(
      (collaborator) => collaborator.userId !== collaboratorId
    );

    await workspaceRef.update({
      collaborators: updatedCollaborators,
      updatedAt: new Date().toISOString(),
    });

    // Remove workspace from collaborator's workspace list
    const collaboratorRef = adminDb.collection("users").doc(collaboratorId);
    const collaboratorDoc = await collaboratorRef.get();

    if (collaboratorDoc.exists) {
      const collaboratorData = collaboratorDoc.data();
      const collaboratorWorkspaces = (
        collaboratorData?.workspaces || []
      ).filter((id: string) => id !== workspaceId);

      await collaboratorRef.update({
        workspaces: collaboratorWorkspaces,
        // If this was their default workspace, clear it
        ...(collaboratorData?.defaultWorkspaceId === workspaceId && {
          defaultWorkspaceId: collaboratorWorkspaces[0] || null,
        }),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Collaborator removed successfully",
    });
  } catch (error: any) {
    console.error("Error removing collaborator:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove collaborator" },
      { status: 500 }
    );
  }
}
