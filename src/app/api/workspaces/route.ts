// src/app/api/workspaces/route.ts

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/config/firebase-admin";
import { AdminAuthService } from "@/lib/admin-auth-service";
import { PLAN_LIMITS } from "@/types/workspace";
import type { Workspace, WorkspaceCollaborator } from "@/types/workspace";

// GET /api/workspaces - Get user's workspaces
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify user exists
    const userRecord = await AdminAuthService.getUserById(userId);
    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's workspace IDs from their profile
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User document not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const workspaceIds = userData?.workspaces || [];

    // If user has no workspaces, create a default one
    if (workspaceIds.length === 0) {
      const defaultWorkspace: Workspace = {
        id: `workspace-${userId}-default`,
        name: `${
          userData?.firstName || userRecord.email?.split("@")[0] || "User"
        }'s Workspace`,
        ownerId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        collaborators: [
          {
            userId: userId,
            email: userRecord.email || userData?.email || "",
            firstName: userData?.firstName || "",
            lastName: userData?.lastName || "",
            role: "owner",
            addedAt: new Date().toISOString(),
            addedBy: userId,
            status: "active",
          },
        ],
        websites: [],
      };

      // Save the default workspace
      const workspaceRef = adminDb
        .collection("workspaces")
        .doc(defaultWorkspace.id);
      await workspaceRef.set(defaultWorkspace);

      // Update user's workspace list and set as default
      await userRef.update({
        workspaces: [defaultWorkspace.id],
        defaultWorkspaceId: defaultWorkspace.id,
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        workspaces: [defaultWorkspace],
        defaultWorkspaceId: defaultWorkspace.id,
      });
    }

    // Fetch all workspaces
    const workspaces: Workspace[] = [];
    for (const workspaceId of workspaceIds) {
      const workspaceRef = adminDb.collection("workspaces").doc(workspaceId);
      const workspaceDoc = await workspaceRef.get();

      if (workspaceDoc.exists) {
        workspaces.push({
          id: workspaceDoc.id,
          ...workspaceDoc.data(),
        } as Workspace);
      }
    }

    return NextResponse.json({
      success: true,
      workspaces,
      defaultWorkspaceId: userData?.defaultWorkspaceId || workspaces[0]?.id,
    });
  } catch (error: any) {
    console.error("Error fetching workspaces:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch workspaces" },
      { status: 500 }
    );
  }
}

// POST /api/workspaces - Create a new workspace
export async function POST(request: NextRequest) {
  try {
    const { userId, name } = await request.json();

    if (!userId || !name) {
      return NextResponse.json(
        { error: "User ID and workspace name are required" },
        { status: 400 }
      );
    }

    // Verify user exists and get their plan
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const userRecord = await AdminAuthService.getUserById(userId);

    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's plan type and check limits
    const planType =
      userData?.webdashSubscription?.planType ||
      userData?.planType ||
      "business";
    const planLimits = PLAN_LIMITS[planType];
    const currentWorkspaces = userData?.workspaces || [];

    // Check if user can create more workspaces
    if (
      planLimits.workspaces !== -1 &&
      currentWorkspaces.length >= planLimits.workspaces
    ) {
      return NextResponse.json(
        {
          error: `You have reached the maximum number of workspaces for your ${planType} plan (${planLimits.workspaces})`,
          planType,
          limit: planLimits.workspaces,
          current: currentWorkspaces.length,
        },
        { status: 403 }
      );
    }

    // Create the new workspace
    const workspaceId = `workspace-${userId}-${Date.now()}`;
    const newWorkspace: Workspace = {
      id: workspaceId,
      name: name.trim(),
      ownerId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      collaborators: [
        {
          userId: userId,
          email: userRecord.email || userData?.email || "",
          firstName: userData?.firstName || "",
          lastName: userData?.lastName || "",
          role: "owner",
          addedAt: new Date().toISOString(),
          addedBy: userId,
          status: "active",
        },
      ],
      websites: [],
    };

    // Save the workspace
    const workspaceRef = adminDb.collection("workspaces").doc(workspaceId);
    await workspaceRef.set(newWorkspace);

    // Update user's workspace list
    await userRef.update({
      workspaces: [...currentWorkspaces, workspaceId],
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      workspace: newWorkspace,
    });
  } catch (error: any) {
    console.error("Error creating workspace:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create workspace" },
      { status: 500 }
    );
  }
}
