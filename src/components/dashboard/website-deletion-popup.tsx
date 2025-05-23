// src/components/dashboard/website-deletion-popup.tsx

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, Trash2, AlertTriangle } from "lucide-react";
import { UserWebsite } from "@/types";
import { useToast } from "@/components/ui/use-toast";

interface WebsiteDeletionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  websites: UserWebsite[];
  requiredDeletions: number;
  targetPlan: string;
  onConfirmDeletion: (websiteIds: string[]) => Promise<void>;
}

export function WebsiteDeletionPopup({
  isOpen,
  onClose,
  websites,
  requiredDeletions,
  targetPlan,
  onConfirmDeletion,
}: WebsiteDeletionPopupProps) {
  const [selectedWebsites, setSelectedWebsites] = useState<Set<string>>(
    new Set()
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleToggleWebsite = (websiteId: string) => {
    const newSelection = new Set(selectedWebsites);
    if (newSelection.has(websiteId)) {
      newSelection.delete(websiteId);
    } else {
      newSelection.add(websiteId);
    }
    setSelectedWebsites(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedWebsites.size === websites.length) {
      setSelectedWebsites(new Set());
    } else {
      setSelectedWebsites(new Set(websites.map((w) => w.id)));
    }
  };

  const handleConfirm = async () => {
    if (selectedWebsites.size < requiredDeletions) {
      toast({
        title: "Insufficient selections",
        description: `Please select at least ${requiredDeletions} website${
          requiredDeletions > 1 ? "s" : ""
        } to delete.`,
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirmDeletion(Array.from(selectedWebsites));
      toast({
        title: "Websites deleted",
        description: `Successfully deleted ${selectedWebsites.size} website${
          selectedWebsites.size > 1 ? "s" : ""
        }. You can now downgrade your plan.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Deletion failed",
        description: "Failed to delete selected websites. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Website Deletion Required for Downgrade
          </DialogTitle>
          <DialogDescription>
            To downgrade to the {targetPlan} plan, you need to delete at least{" "}
            {requiredDeletions} website{requiredDeletions > 1 ? "s" : ""}.
            Currently selected: {selectedWebsites.size} of {requiredDeletions}{" "}
            required.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Warning:</strong> Deleting websites is permanent and cannot
            be undone. All website data, content, and settings will be lost.
          </AlertDescription>
        </Alert>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">
                Select websites to delete:
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs"
              >
                {selectedWebsites.size === websites.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>

            {websites.map((website) => (
              <div
                key={website.id}
                className={`border rounded-lg p-4 transition-colors ${
                  selectedWebsites.has(website.id)
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedWebsites.has(website.id)}
                    onCheckedChange={() => handleToggleWebsite(website.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        {website.title || "Untitled Website"}
                      </h4>
                      <a
                        href={website.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#f58327] hover:underline flex items-center text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Visit
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {website.siteUrl}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Created:{" "}
                      {new Date(website.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={selectedWebsites.size < requiredDeletions || isDeleting}
            className="flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete {selectedWebsites.size} Website
                {selectedWebsites.size !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
