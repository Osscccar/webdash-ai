// src/hooks/use-data-sync.ts
import { useEffect, useState } from "react";
import { useAuth } from "./use-auth";
import FirestoreService from "@/lib/firestore-service";

export function useDataSync() {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Function to sync localStorage data to Firestore
  const syncToFirestore = async () => {
    if (!user || !user.uid) return false;

    setIsSyncing(true);

    try {
      const success = await FirestoreService.transferLocalStorageToFirestore(
        user.uid
      );

      if (success) {
        setLastSyncTime(new Date());
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error syncing to Firestore:", error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Function to clear localStorage after successful sync
  const clearLocalStorage = () => {
    const keysToRemove = [
      "webdash_prompt",
      "webdash_site_info",
      "webdash_colors_fonts",
      "webdash_subdomain",
      "webdash_website",
      "webdash_domain_id",
      "webdash_pages_meta",
      "webdash_generate_ai_content",
    ];

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  };

  // Auto-sync when user becomes available
  useEffect(() => {
    const autoSync = async () => {
      if (user && user.uid) {
        await syncToFirestore();
      }
    };

    autoSync();
  }, [user]);

  return {
    syncToFirestore,
    clearLocalStorage,
    isSyncing,
    lastSyncTime,
  };
}
