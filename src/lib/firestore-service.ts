// src/lib/firestore-service.ts
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  deleteDoc,
  addDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { UserData, UserWebsite } from "@/types";

export const FirestoreService = {
  // User Operations
  async getUser(userId: string): Promise<UserData | null> {
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        return userDoc.data() as UserData;
      }
      return null;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  },

  async createUser(userId: string, userData: UserData): Promise<boolean> {
    try {
      await setDoc(doc(db, "users", userId), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Error creating user:", error);
      return false;
    }
  },

  async updateUser(
    userId: string,
    userData: Partial<UserData>
  ): Promise<boolean> {
    try {
      await updateDoc(doc(db, "users", userId), {
        ...userData,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Error updating user:", error);
      return false;
    }
  },

  // Website Operations
  async getWebsites(userId: string): Promise<UserWebsite[]> {
    try {
      const websitesRef = collection(db, "websites");
      const q = query(websitesRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      const websites: UserWebsite[] = [];
      querySnapshot.forEach((doc) => {
        websites.push(doc.data() as UserWebsite);
      });

      return websites;
    } catch (error) {
      console.error("Error getting websites:", error);
      return [];
    }
  },

  async createWebsite(website: UserWebsite): Promise<string | null> {
    try {
      // Use website ID if provided, otherwise generate one
      if (!website.id) {
        website.id = `website-${Date.now()}`;
      }

      await setDoc(doc(db, "websites", website.id), {
        ...website,
        createdAt: serverTimestamp(),
        lastModified: serverTimestamp(),
      });

      return website.id;
    } catch (error) {
      console.error("Error creating website:", error);
      return null;
    }
  },

  async updateWebsite(
    websiteId: string,
    websiteData: Partial<UserWebsite>
  ): Promise<boolean> {
    try {
      await updateDoc(doc(db, "websites", websiteId), {
        ...websiteData,
        lastModified: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Error updating website:", error);
      return false;
    }
  },

  async addWebsiteToUser(
    userId: string,
    website: UserWebsite
  ): Promise<boolean> {
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        // Update the user document with the new website using arrayUnion
        await updateDoc(userRef, {
          websites: arrayUnion(website),
          updatedAt: serverTimestamp(),
        });

        console.log(
          `Added website ${website.id} to user ${userId}'s websites array`
        );
        return true;
      } else {
        console.error(`User document ${userId} not found`);
        return false;
      }
    } catch (error) {
      console.error("Error adding website to user:", error);
      return false;
    }
  },

  async deleteWebsite(websiteId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, "websites", websiteId));
      return true;
    } catch (error) {
      console.error("Error deleting website:", error);
      return false;
    }
  },

  // Helper method to transfer localStorage website data to Firestore
  // src/lib/firestore-service.ts - Fixed transferLocalStorageToFirestore method

  async transferLocalStorageToFirestore(userId: string): Promise<boolean> {
    try {
      // Get website data from localStorage
      const websiteData = localStorage.getItem("webdash_website");
      const siteInfo = localStorage.getItem("webdash_site_info");
      const subdomain = localStorage.getItem("webdash_subdomain");
      const domainId = localStorage.getItem("webdash_domain_id");

      // ✅ FIXED: Get existing user data first to check for existing websites
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      let existingWebsites: UserWebsite[] = [];
      if (userDoc.exists()) {
        const userData = userDoc.data();
        existingWebsites = userData.websites || [];
      }

      // Check if we have enough data to create a website
      if (subdomain) {
        let website: UserWebsite;

        if (websiteData) {
          // Parse existing website data
          website = JSON.parse(websiteData) as UserWebsite;
          
          // ✅ Handle pending workspace assignment for parsed websites
          if (website.workspaceId === "pending-workspace-assignment") {
            website.workspaceId = `workspace-${userId}-default`;
            console.log(`Converting parsed website to default workspace: ${website.workspaceId}`);
          }
        } else {
          // Get the workspace ID from localStorage if available
          const storedWorkspaceId = localStorage.getItem("webdash_current_workspace");
          
          // ✅ Handle pending workspace assignment for new users
          let finalWorkspaceId = storedWorkspaceId;
          if (!finalWorkspaceId || finalWorkspaceId === "pending-workspace-assignment") {
            finalWorkspaceId = `workspace-${userId}-default`;
            console.log(`Assigning new user website to default workspace: ${finalWorkspaceId}`);
          }
          
          // Create new website object
          website = {
            id: `website-${Date.now()}`,
            workspaceId: finalWorkspaceId,
            domainId: domainId ? parseInt(domainId) : Date.now(),
            subdomain: subdomain,
            siteUrl: `https://${subdomain}.webdash.site`,
            title: "My Website",
            description: "AI-generated website",
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            status: "active" as "active",
            userId: userId,
          };

          // Update title and description from siteInfo if available
          if (siteInfo) {
            const parsedSiteInfo = JSON.parse(siteInfo);
            website.title =
              parsedSiteInfo.websiteTitle ||
              parsedSiteInfo.businessName ||
              website.title;
            website.description =
              parsedSiteInfo.businessDescription || website.description;

            // Store generation parameters
            website.generationParams = {
              prompt: localStorage.getItem("webdash_prompt") || "",
              businessType: parsedSiteInfo.businessType || "",
              businessName: parsedSiteInfo.businessName || "",
              businessDescription: parsedSiteInfo.businessDescription || "",
              colors: parsedSiteInfo.colors || {},
              fonts: parsedSiteInfo.fonts || {},
              websiteTitle: parsedSiteInfo.websiteTitle || "",
              websiteDescription: parsedSiteInfo.websiteDescription || "",
              websiteKeyphrase: parsedSiteInfo.websiteKeyphrase || "",
            };
          }
        }

        // Add userId if not present
        website.userId = userId;

        // ✅ FIXED: Check if website already exists before adding
        const websiteExists = existingWebsites.some(
          (w) =>
            w.id === website.id ||
            w.subdomain === website.subdomain ||
            w.siteUrl === website.siteUrl
        );

        if (!websiteExists) {
          console.log("Adding new website to Firestore:", website.id);

          // Save to websites collection
          await this.createWebsite(website);

          // Add to user's websites array (arrayUnion prevents duplicates)
          await this.addWebsiteToUser(userId, website);

          // ✅ FIXED: Clear localStorage after successful save
          localStorage.removeItem("webdash_website");
          localStorage.removeItem("webdash_site_info");
          localStorage.removeItem("webdash_subdomain");
          localStorage.removeItem("webdash_domain_id");
          localStorage.removeItem("webdash_job_id");

          console.log("Successfully transferred new website to Firestore");
          return true;
        } else {
          console.log("Website already exists in Firestore, skipping");
          // Still clear localStorage since the website exists
          localStorage.removeItem("webdash_website");
          localStorage.removeItem("webdash_site_info");
          localStorage.removeItem("webdash_subdomain");
          localStorage.removeItem("webdash_domain_id");
          localStorage.removeItem("webdash_job_id");
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Error transferring localStorage to Firestore:", error);
      return false;
    }
  },
};

export default FirestoreService;
