import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/config/firebase-admin";
import { UserWebsite } from "@/types";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    
    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    console.log(`Loading workspace websites for user: ${userId}`);

    // Get the user's document to find their workspaces
    const userDoc = await adminDb.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    console.log(`User data found for ${userId}, checking workspaces...`);
    
    // Check the structure of workspaces data
    const userWorkspaces = userData?.workspaces || {};
    console.log(`User workspaces data:`, userWorkspaces);
    console.log(`User workspaces type:`, typeof userWorkspaces);
    console.log(`User workspaces keys:`, Object.keys(userWorkspaces));

    // First, always include the user's own websites
    let allWebsites: UserWebsite[] = [];
    const userOwnWebsites = userData?.websites || [];
    console.log(`User has ${userOwnWebsites.length} websites in their own document`);
    
    if (userOwnWebsites.length > 0) {
      allWebsites = [...userOwnWebsites];
      console.log(`Added ${userOwnWebsites.length} websites from user's own document`);
    }

    // ✅ NEW: Use workspaces API to get all workspaces for this user
    try {
      const workspacesResponse = await fetch(`http://localhost:3000/api/workspaces?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${await adminAuth.createCustomToken(userId)}`
        }
      });
      
      if (workspacesResponse.ok) {
        const workspacesData = await workspacesResponse.json();
        const workspaces = workspacesData.workspaces || [];
        console.log(`Found ${workspaces.length} workspaces via API for user ${userId}`);
        
        // Load websites from each workspace owner
        for (const workspace of workspaces) {
          console.log(`Processing workspace: ${workspace.name} (ID: ${workspace.id}, Owner: ${workspace.ownerId})`);
          
          if (!workspace.ownerId) {
            console.log(`Skipping workspace ${workspace.id} - no owner ID`);
            continue;
          }
          
          // Skip if the owner is the same as current user (already loaded above)
          if (workspace.ownerId === userId) {
            console.log(`Skipping workspace ${workspace.id} - user is the owner`);
            continue;
          }
          
          console.log(`Loading websites from workspace owner: ${workspace.ownerId} for workspace: ${workspace.id}`);
          
          try {
            // Get the workspace owner's document
            const ownerDoc = await adminDb.collection("users").doc(workspace.ownerId).get();
            
            if (ownerDoc.exists) {
              const ownerData = ownerDoc.data();
              const ownerWebsites = ownerData?.websites || [];
              console.log(`Owner ${workspace.ownerId} has ${ownerWebsites.length} total websites`);
              
              // Include ALL websites from workspace owner for now (we can filter by workspace later)
              if (ownerWebsites.length > 0) {
                // Ensure each website has the correct workspace ID
                const workspaceWebsites = ownerWebsites.map((website: UserWebsite) => ({
                  ...website,
                  workspaceId: website.workspaceId || workspace.id
                }));
                
                allWebsites = [...allWebsites, ...workspaceWebsites];
                console.log(`Added ${workspaceWebsites.length} websites from workspace owner ${workspace.ownerId}`);
              }
            } else {
              console.log(`Owner document not found for ${workspace.ownerId}`);
            }
          } catch (error) {
            console.error(`Error loading websites from workspace owner ${workspace.ownerId}:`, error);
            // Continue with other workspaces even if one fails
          }
        }
      } else {
        console.error(`Failed to load workspaces: ${workspacesResponse.status}`);
      }
    } catch (error) {
      console.error(`Error loading workspaces for user ${userId}:`, error);
    }
    
    // Remove duplicates based on website ID
    const uniqueWebsites = allWebsites.filter((website, index, self) => 
      index === self.findIndex(w => w.id === website.id)
    );
    
    console.log(`Returning ${uniqueWebsites.length} total unique websites for user ${userId}`);
    
    return NextResponse.json({ websites: uniqueWebsites });
    
  } catch (error) {
    console.error("Error loading workspace websites:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    
    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const body = await request.json();
    const { website, workspaceId } = body;

    if (!website) {
      return NextResponse.json({ error: "Website data required" }, { status: 400 });
    }

    console.log(`Saving website for user: ${userId} to workspace: ${workspaceId}`);

    // Get the user's workspaces to determine the target owner
    const userDoc = await adminDb.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const userWorkspaces = userData?.workspaces || {};
    
    // ✅ Handle pending workspace assignment for new users
    if (workspaceId === "pending-workspace-assignment") {
      // Find user's default workspace or create one
      const defaultWorkspaceId = `workspace-${userId}-default`;
      workspaceId = defaultWorkspaceId;
      console.log(`Converting pending assignment to default workspace: ${workspaceId}`);
    }

    // Determine which user should store this website
    let targetUserId = userId; // Default to current user
    
    if (workspaceId && workspaceId !== "default-workspace" && userWorkspaces[workspaceId]) {
      // If this is a workspace website, save to workspace owner
      targetUserId = userWorkspaces[workspaceId].ownerId || userId;
    }

    console.log(`Saving website to user document: ${targetUserId}`);

    // Ensure website has proper metadata
    const websiteToSave = {
      ...website,
      userId: userId, // Creator of the website
      workspaceId: workspaceId, // Use the corrected workspace ID
      createdAt: website.createdAt || new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    // Get target user's current websites
    const targetUserDoc = await adminDb.collection("users").doc(targetUserId).get();
    
    if (!targetUserDoc.exists) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    const targetUserData = targetUserDoc.data();
    const targetUserWebsites = targetUserData?.websites || [];
    
    // Check if website already exists
    const websiteExists = targetUserWebsites.some((w: UserWebsite) =>
      w.id === websiteToSave.id || w.subdomain === websiteToSave.subdomain
    );
    
    if (websiteExists) {
      console.log("Website already exists in target user's document");
      return NextResponse.json({ success: true, message: "Website already exists" });
    }

    // Add website to target user's document
    await adminDb.collection("users").doc(targetUserId).update({
      websites: FieldValue.arrayUnion(websiteToSave),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`Successfully saved website ${websiteToSave.id} to user ${targetUserId}`);
    
    return NextResponse.json({ 
      success: true, 
      message: "Website saved successfully",
      websiteId: websiteToSave.id 
    });
    
  } catch (error) {
    console.error("Error saving website:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}