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
        // Get the current websites array or create an empty one
        const userData = userDoc.data() as UserData;
        const currentWebsites = userData.websites || [];

        // Add the new website to the array
        const updatedWebsites = [...currentWebsites, website];

        // Update the user document
        await updateDoc(userRef, {
          websites: updatedWebsites,
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
  async transferLocalStorageToFirestore(userId: string): Promise<boolean> {
    try {
      // Get website data from localStorage
      const websiteData = localStorage.getItem("webdash_website");
      const siteInfo = localStorage.getItem("webdash_site_info");
      const subdomain = localStorage.getItem("webdash_subdomain");
      const domainId = localStorage.getItem("webdash_domain_id");

      // Check if we have enough data to create a website
      if (subdomain) {
        let website: UserWebsite;

        if (websiteData) {
          // Parse existing website data
          website = JSON.parse(websiteData) as UserWebsite;
        } else {
          // Create new website object
          website = {
            id: `website-${Date.now()}`,
            domainId: domainId ? parseInt(domainId) : Date.now(),
            subdomain: subdomain,
            siteUrl: `https://${subdomain}.webdash.site`,
            title: "My Website",
            description: "AI-generated website",
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            status: "active",
            userId: userId,
          };

          // Update title and description from siteInfo if available
          if (siteInfo) {
            const parsedSiteInfo = JSON.parse(siteInfo);
            website.title = parsedSiteInfo.businessName || website.title;
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

        // Save to Firestore
        await this.createWebsite(website);

        return true;
      }

      return false;
    } catch (error) {
      console.error("Error transferring localStorage to Firestore:", error);
      return false;
    }
  },
};

export default FirestoreService;
