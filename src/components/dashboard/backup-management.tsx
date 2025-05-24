"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, Download, Upload, Trash2, Loader2, Plus, Calendar, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface BackupManagementProps {
  selectedWebsite?: {
    id: string;
    name: string;
    domainId: string;
  };
}

interface Backup {
  id: string;
  name: string;
  created_at: string;
  size: string;
  status: string;
  type: string;
}

export function BackupManagement({ selectedWebsite }: BackupManagementProps) {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedWebsite?.domainId) {
      fetchBackups();
    }
  }, [selectedWebsite]);

  const fetchBackups = async () => {
    if (!selectedWebsite?.domainId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/tenweb/backups?domainId=${selectedWebsite.domainId}`);
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
      } else {
        throw new Error('Failed to fetch backups');
      }
    } catch (error) {
      console.error('Error fetching backups:', error);
      toast({
        title: "Error",
        description: "Failed to fetch backups",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    if (!selectedWebsite?.domainId) return;
    
    setCreating(true);
    try {
      const response = await fetch('/api/tenweb/backups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domainId: selectedWebsite.domainId,
          action: 'create',
          name: `Backup ${new Date().toLocaleDateString()}`,
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Success!",
          description: "Backup creation started. It may take a few minutes.",
        });
        fetchBackups();
      } else {
        throw new Error('Failed to create backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      toast({
        title: "Error",
        description: "Failed to create backup",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async (backupId: string) => {
    if (!selectedWebsite?.domainId) return;
    
    setRestoring(backupId);
    try {
      const response = await fetch('/api/tenweb/backups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domainId: selectedWebsite.domainId,
          action: 'restore',
          backupId,
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Success!",
          description: "Backup restoration started. Your site will be restored shortly.",
        });
      } else {
        throw new Error('Failed to restore backup');
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast({
        title: "Error",
        description: "Failed to restore backup",
        variant: "destructive",
      });
    } finally {
      setRestoring(null);
    }
  };

  const deleteBackup = async (backupId: string) => {
    if (!selectedWebsite?.domainId) return;
    
    try {
      const response = await fetch(`/api/tenweb/backups?domainId=${selectedWebsite.domainId}&backupId=${backupId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast({
          title: "Success!",
          description: "Backup deleted successfully",
        });
        fetchBackups();
      } else {
        throw new Error('Failed to delete backup');
      }
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast({
        title: "Error",
        description: "Failed to delete backup",
        variant: "destructive",
      });
    }
  };

  if (!selectedWebsite) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Select a website to manage backups</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Backup Management</h2>
          <p className="text-gray-600">Create and restore backups for {selectedWebsite.name}</p>
        </div>
        <Button onClick={createBackup} disabled={creating} className="flex items-center space-x-2">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          <span>Create Backup</span>
        </Button>
      </div>

      <Alert>
        <Database className="h-4 w-4" />
        <AlertDescription>
          Backups include your website files, database, and configuration. They are stored securely and can be restored at any time.
        </AlertDescription>
      </Alert>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {backups.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Database className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No backups found</h3>
                <p className="text-gray-500 text-center mb-4">
                  Create your first backup to protect your website data
                </p>
                <Button onClick={createBackup} disabled={creating}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Create First Backup
                </Button>
              </CardContent>
            </Card>
          ) : (
            backups.map((backup) => (
              <Card key={backup.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Database className="h-5 w-5 text-blue-500" />
                      <div>
                        <CardTitle className="text-lg">{backup.name}</CardTitle>
                        <CardDescription className="flex items-center space-x-4 mt-1">
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(backup.created_at).toLocaleDateString()}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(backup.created_at).toLocaleTimeString()}</span>
                          </span>
                          {backup.size && (
                            <span>Size: {backup.size}</span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={backup.status === 'completed' ? 'default' : 'secondary'}>
                        {backup.status}
                      </Badge>
                      {backup.type && (
                        <Badge variant="outline">
                          {backup.type}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restoreBackup(backup.id)}
                      disabled={restoring === backup.id || backup.status !== 'completed'}
                      className="flex items-center space-x-2"
                    >
                      {restoring === backup.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      <span>Restore</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Download backup (if API supports it)
                        toast({
                          title: "Download",
                          description: "Backup download will be available soon",
                        });
                      }}
                      disabled={backup.status !== 'completed'}
                      className="flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteBackup(backup.id)}
                      className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}