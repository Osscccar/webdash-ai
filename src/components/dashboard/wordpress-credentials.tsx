"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, Eye, EyeOff, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface WordPressCredentialsProps {
  selectedWebsite?: {
    id: string;
    name: string;
    domainId: string;
  };
}

interface UserInfo {
  wordpress?: {
    username: string;
    password: string;
    admin_url: string;
  };
  database?: {
    host: string;
    name: string;
    username: string;
    password: string;
    port: number;
  };
  sftp?: {
    host: string;
    username: string;
    password: string;
    port: number;
    path: string;
  };
}

export function WordPressCredentials({ selectedWebsite }: WordPressCredentialsProps) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    wordpress: false,
    database: false,
    sftp: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (selectedWebsite?.domainId) {
      fetchUserInfo();
    }
  }, [selectedWebsite]);

  const fetchUserInfo = async () => {
    if (!selectedWebsite?.domainId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/tenweb/user-info?domainId=${selectedWebsite.domainId}`);
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data);
      } else {
        throw new Error('Failed to fetch user info');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      toast({
        title: "Error",
        description: "Failed to fetch WordPress credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const togglePasswordVisibility = (type: 'wordpress' | 'database' | 'sftp') => {
    setShowPasswords(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const openWordPressAdmin = async () => {
    if (!selectedWebsite?.domainId) return;
    
    try {
      const response = await fetch('/api/tenweb/autologin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domainId: selectedWebsite.domainId,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.open(data.url, '_blank');
        }
      } else {
        throw new Error('Failed to generate login URL');
      }
    } catch (error) {
      console.error('Error opening WordPress admin:', error);
      toast({
        title: "Error",
        description: "Failed to open WordPress admin",
        variant: "destructive",
      });
    }
  };

  if (!selectedWebsite) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Select a website to view WordPress credentials</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">WordPress Access</h2>
          <p className="text-gray-600">Manage your WordPress installation for {selectedWebsite.name}</p>
        </div>
        <Button onClick={openWordPressAdmin} className="flex items-center space-x-2">
          <ExternalLink className="h-4 w-4" />
          <span>Open WordPress Admin</span>
        </Button>
      </div>

      {/* WordPress Credentials */}
      {userInfo?.wordpress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>WordPress Admin</span>
              <Badge variant="secondary">Admin Access</Badge>
            </CardTitle>
            <CardDescription>
              Use these credentials to access your WordPress admin panel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Admin URL</label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="flex-1 p-2 bg-gray-100 rounded text-sm">
                    {userInfo.wordpress.admin_url}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(userInfo.wordpress.admin_url, 'Admin URL')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Username</label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="flex-1 p-2 bg-gray-100 rounded text-sm">
                    {userInfo.wordpress.username}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(userInfo.wordpress.username, 'Username')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="flex-1 p-2 bg-gray-100 rounded text-sm">
                    {showPasswords.wordpress ? userInfo.wordpress.password : '••••••••••••'}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => togglePasswordVisibility('wordpress')}
                  >
                    {showPasswords.wordpress ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(userInfo.wordpress.password, 'Password')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Database Credentials */}
      {userInfo?.database && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Database Access</span>
              <Badge variant="secondary">MySQL</Badge>
            </CardTitle>
            <CardDescription>
              Direct database access credentials for advanced users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Host</label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="flex-1 p-2 bg-gray-100 rounded text-sm">
                    {userInfo.database.host}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(userInfo.database.host, 'Database Host')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Port</label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="flex-1 p-2 bg-gray-100 rounded text-sm">
                    {userInfo.database.port}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(userInfo.database.port.toString(), 'Database Port')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Database Name</label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="flex-1 p-2 bg-gray-100 rounded text-sm">
                    {userInfo.database.name}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(userInfo.database.name, 'Database Name')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Username</label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="flex-1 p-2 bg-gray-100 rounded text-sm">
                    {userInfo.database.username}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(userInfo.database.username, 'Database Username')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="flex-1 p-2 bg-gray-100 rounded text-sm">
                    {showPasswords.database ? userInfo.database.password : '••••••••••••'}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => togglePasswordVisibility('database')}
                  >
                    {showPasswords.database ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(userInfo.database.password, 'Database Password')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SFTP Credentials */}
      {userInfo?.sftp && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>SFTP Access</span>
              <Badge variant="secondary">File Transfer</Badge>
            </CardTitle>
            <CardDescription>
              Secure file transfer protocol access to your website files
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Host</label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="flex-1 p-2 bg-gray-100 rounded text-sm">
                    {userInfo.sftp.host}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(userInfo.sftp.host, 'SFTP Host')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Port</label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="flex-1 p-2 bg-gray-100 rounded text-sm">
                    {userInfo.sftp.port}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(userInfo.sftp.port.toString(), 'SFTP Port')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Username</label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="flex-1 p-2 bg-gray-100 rounded text-sm">
                    {userInfo.sftp.username}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(userInfo.sftp.username, 'SFTP Username')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Path</label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="flex-1 p-2 bg-gray-100 rounded text-sm">
                    {userInfo.sftp.path}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(userInfo.sftp.path, 'SFTP Path')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="flex-1 p-2 bg-gray-100 rounded text-sm">
                    {showPasswords.sftp ? userInfo.sftp.password : '••••••••••••'}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => togglePasswordVisibility('sftp')}
                  >
                    {showPasswords.sftp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(userInfo.sftp.password, 'SFTP Password')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}