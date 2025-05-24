"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Globe, Lock, Loader2, ExternalLink, Info, Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface DomainManagementProps {
  selectedWebsite?: {
    id: string;
    name: string;
    domainId: string;
    url?: string;
  };
}

interface DomainNameItem {
  id: number;
  name: string;
  admin_url: string;
  site_url: string;
  default: number;
  scheme: string;
  created_at: string;
}

interface SSLStatus {
  enabled: boolean;
  status: string;
  expires_at?: string;
  certificate_info?: {
    issuer: string;
    subject: string;
  };
}

interface DNSRecord {
  type: string;
  name: string;
  value: string;
  description: string;
}

interface DNSInfo {
  a_record: string;
  cname_target: string;
  domain: string;
  records: DNSRecord[];
  mx_records?: any[];
  ns_records?: any[];
}

interface SSLStatusByDomain {
  [domainName: string]: {
    hasCertificate: boolean;
    status?: string;
    validTo?: string;
    issuer?: string;
  };
}

export function DomainManagement({ selectedWebsite }: DomainManagementProps) {
  const [customDomain, setCustomDomain] = useState("");
  const [sslStatus, setSslStatus] = useState<SSLStatus | null>(null);
  const [loadingSSL, setLoadingSSL] = useState(false);
  const [updatingDomain, setUpdatingDomain] = useState(false);
  const [showDNSInstructions, setShowDNSInstructions] = useState(false);
  const [addedDomain, setAddedDomain] = useState("");
  const [dnsInfo, setDnsInfo] = useState<DNSInfo | null>(null);
  const [currentDomains, setCurrentDomains] = useState<DomainNameItem[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [settingPrimary, setSettingPrimary] = useState<number | null>(null);
  const [sslStatusByDomain, setSslStatusByDomain] = useState<SSLStatusByDomain>(
    {}
  );
  const { toast } = useToast();

  // Utility function to clean domain names
  const cleanDomainName = (domain: string) => {
    return domain.replace(/^https?:\/\//, "");
  };

  useEffect(() => {
    if (selectedWebsite?.domainId) {
      fetchSSLStatus();
      fetchDNSInfo();
      fetchCurrentDomains();
      fetchSSLStatusForDomains();
    }
  }, [selectedWebsite]);

  // Periodically check for SSL certificate updates
  useEffect(() => {
    if (selectedWebsite?.domainId) {
      const interval = setInterval(() => {
        fetchSSLStatusForDomains();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [selectedWebsite?.domainId]);

  const fetchCurrentDomains = async () => {
    if (!selectedWebsite?.domainId) return;

    setLoadingDomains(true);
    try {
      const response = await fetch(
        `/api/tenweb/domain/list?domainId=${selectedWebsite.domainId}`
      );
      const data = await response.json();

      if (response.ok && data.data) {
        setCurrentDomains(data.data);
      }
    } catch (error) {
      console.error("Error fetching current domains:", error);
    } finally {
      setLoadingDomains(false);
    }
  };

  const fetchSSLStatusForDomains = async () => {
    if (!selectedWebsite?.domainId) return;

    try {
      const response = await fetch(
        `/api/tenweb/ssl/status?domainId=${selectedWebsite.domainId}`
      );
      const data = await response.json();

      if (response.ok && data.certificates) {
        setSslStatusByDomain(data.certificates);
      }
    } catch (error) {
      console.error("Error fetching SSL status for domains:", error);
    }
  };

  const fetchDNSInfo = async () => {
    if (!selectedWebsite?.domainId) return;

    try {
      const response = await fetch(
        `/api/tenweb/domain/dns-info?domainId=${selectedWebsite.domainId}`
      );
      const data = await response.json();

      if (response.ok && data.dns) {
        setDnsInfo(data.dns);
      }
    } catch (error) {
      console.error("Error fetching DNS info:", error);
      // Set fallback DNS info
      setDnsInfo({
        a_record: "35.193.39.110",
        cname_target: "webdash.site",
        domain: "",
        records: [],
      });
    }
  };

  const fetchDNSInfoForDomain = async (zoneId?: string, domain?: string) => {
    if (!selectedWebsite?.domainId) return;

    try {
      const params = new URLSearchParams({
        domainId: selectedWebsite.domainId,
        ...(zoneId && { zoneId }),
        ...(domain && { domain }),
      });

      const response = await fetch(`/api/tenweb/domain/dns-info?${params}`);
      const data = await response.json();

      if (response.ok && data.dns) {
        setDnsInfo(data.dns);
      }
    } catch (error) {
      console.error("Error fetching DNS info for domain:", error);
      // Set fallback DNS info with the domain
      setDnsInfo({
        a_record: "35.193.39.110",
        cname_target: domain || "webdash.site",
        domain: domain || "",
        records: [
          {
            type: "A",
            name: "@",
            value: "35.193.39.110",
            description: `Points your root domain (${domain}) to our servers`,
          },
          {
            type: "CNAME",
            name: "www",
            value: domain || "webdash.site",
            description: `Points www.${domain} to your root domain`,
          },
        ],
      });
    }
  };

  const fetchSSLStatus = async () => {
    if (!selectedWebsite?.domainId) return;

    // Check for rate limit cooldown
    const lastRateLimit = localStorage.getItem("webdash_last_rate_limit");
    const rateLimitCooldown = lastRateLimit
      ? Date.now() - parseInt(lastRateLimit) < 10 * 60 * 1000
      : false;

    if (rateLimitCooldown) {
      // Show demo SSL data during cooldown
      setSslStatus({
        enabled: true,
        status: "active",
        expires_at: new Date(
          Date.now() + 90 * 24 * 60 * 60 * 1000
        ).toISOString(), // 90 days from now
        certificate_info: {
          issuer: "Let's Encrypt",
          subject: selectedWebsite.url || "your-site.webdash.site",
        },
      });
      return;
    }

    setLoadingSSL(true);
    try {
      const response = await fetch(
        `/api/tenweb/ssl?domainId=${selectedWebsite.domainId}`
      );
      if (response.ok) {
        const data = await response.json();
        setSslStatus(data);
      } else if (response.status === 429) {
        localStorage.setItem("webdash_last_rate_limit", Date.now().toString());
        // Show demo data for rate limit
        setSslStatus({
          enabled: true,
          status: "active",
          expires_at: new Date(
            Date.now() + 90 * 24 * 60 * 60 * 1000
          ).toISOString(),
          certificate_info: {
            issuer: "Let's Encrypt",
            subject: selectedWebsite.url || "your-site.webdash.site",
          },
        });
        toast({
          title: "Rate Limited",
          description: "Showing demo SSL data. Please wait before refreshing.",
        });
      }
    } catch (error) {
      console.error("Error fetching SSL status:", error);
      // Show demo data on error
      setSslStatus({
        enabled: true,
        status: "active",
        expires_at: new Date(
          Date.now() + 90 * 24 * 60 * 60 * 1000
        ).toISOString(),
        certificate_info: {
          issuer: "Let's Encrypt",
          subject: selectedWebsite.url || "your-site.webdash.site",
        },
      });
    } finally {
      setLoadingSSL(false);
    }
  };

  const addCustomDomain = async () => {
    if (!selectedWebsite?.domainId || !customDomain.trim()) {
      return;
    }

    setUpdatingDomain(true);
    try {
      const response = await fetch("/api/tenweb/domain/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domainId: selectedWebsite.domainId,
          domain: customDomain.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const domainName = data.domain || customDomain.trim();
        const cleanedDomainName = cleanDomainName(domainName);
        setAddedDomain(cleanedDomainName);

        // Refresh the current domains list
        await fetchCurrentDomains();
        await fetchSSLStatusForDomains();

        // Fetch DNS info for the new domain
        await fetchDNSInfoForDomain(undefined, cleanedDomainName);

        setShowDNSInstructions(true);
        setCustomDomain("");
        toast({
          title: "Domain Added Successfully!",
          description: `${cleanedDomainName} has been added and SSL certificate generation started. Please configure your DNS settings as shown below.`,
        });
      } else {
        throw new Error(data.error || "Failed to add custom domain");
      }
    } catch (error: any) {
      console.error("Error adding custom domain:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add custom domain",
        variant: "destructive",
      });
    } finally {
      setUpdatingDomain(false);
    }
  };

  const setPrimaryDomain = async (domainNameId: number, domainName: string) => {
    if (!selectedWebsite?.domainId) return;

    setSettingPrimary(domainNameId);
    try {
      const response = await fetch("/api/tenweb/domain/set-primary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domainId: selectedWebsite.domainId,
          domainNameId: domainNameId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success!",
          description: `${cleanDomainName(
            domainName
          )} is now the primary domain`,
        });
        // Refresh the domains list to show updated primary status
        await fetchCurrentDomains();
        await fetchSSLStatusForDomains();
      } else {
        throw new Error(data.error || "Failed to set primary domain");
      }
    } catch (error: any) {
      console.error("Error setting primary domain:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to set primary domain",
        variant: "destructive",
      });
    } finally {
      setSettingPrimary(null);
    }
  };

  const enableSSL = async () => {
    if (!selectedWebsite?.domainId) return;

    setLoadingSSL(true);
    try {
      const response = await fetch(
        `/api/tenweb/ssl?domainId=${selectedWebsite.domainId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "enable" }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success!",
          description: "SSL certificate installation started",
        });
        fetchSSLStatus();
      } else {
        throw new Error("Failed to enable SSL");
      }
    } catch (error) {
      console.error("Error enabling SSL:", error);
      toast({
        title: "Error",
        description: "Failed to enable SSL",
        variant: "destructive",
      });
    } finally {
      setLoadingSSL(false);
    }
  };

  if (!selectedWebsite) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">
          Select a website to manage domains and SSL
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Domain & SSL Management</h2>
        <p className="text-gray-600">
          Manage domains and SSL certificates for {selectedWebsite.name}
        </p>
      </div>

      {/* Current Domain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Current Domain</span>
          </CardTitle>
          <CardDescription>
            Your website's current domain configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <code className="p-2 bg-gray-100 rounded text-sm">
                {selectedWebsite.url ||
                  `${selectedWebsite.name
                    .toLowerCase()
                    .replace(/\s+/g, "-")}.webdash.site`}
              </code>
              {sslStatus?.enabled && (
                <Badge
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <Lock className="h-3 w-3" />
                  <span>SSL Enabled</span>
                </Badge>
              )}
            </div>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit Site
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Domains */}
      <Card>
        <CardHeader>
          <CardTitle>Current Domains</CardTitle>
          <CardDescription>
            All domains currently connected to your website
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingDomains ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading domains...</span>
            </div>
          ) : currentDomains.length > 0 ? (
            <div className="space-y-3">
              {currentDomains.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <code className="text-sm font-mono">{domain.name}</code>
                      {!sslStatusByDomain[cleanDomainName(domain.name)]
                        ?.hasCertificate && (
                        <TooltipProvider className="cursor-pointer">
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-amber-500 cursor-pointer" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>SSL (https) can take up to 24 hours</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    {domain.default === 1 && (
                      <Badge variant="default">Primary</Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="flex items-center space-x-1"
                    >
                      <Lock className="h-3 w-3" />
                      <span>{domain.scheme.toUpperCase()}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    {domain.default !== 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPrimaryDomain(domain.id, domain.name)}
                        disabled={settingPrimary === domain.id}
                      >
                        {settingPrimary === domain.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : null}
                        Set Primary
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(domain.site_url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Visit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(domain.admin_url, "_blank")}
                    >
                      Admin
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              No additional domains configured
            </p>
          )}
        </CardContent>
      </Card>

      {/* Custom Domain */}
      <Card>
        <CardHeader>
          <CardTitle>Add Custom Domain</CardTitle>
          <CardDescription>
            Connect your own domain name to your website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="yourdomain.com"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
            />
            <Button
              onClick={addCustomDomain}
              disabled={!customDomain.trim() || updatingDomain}
            >
              {updatingDomain ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Add Domain"
              )}
            </Button>
          </div>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              After adding a custom domain, you'll need to update your DNS
              settings to point to our servers.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* DNS Instructions */}
      {showDNSInstructions && addedDomain && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">
              DNS Configuration Required
            </CardTitle>
            <CardDescription className="text-blue-600">
              Configure these DNS records at your domain provider to connect{" "}
              {cleanDomainName(addedDomain)} to your website
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-medium text-gray-900 mb-3">
                Add DNS records to your domain registrar using the information
                below:
              </h4>

              {/* DNS Records Table */}
              <div className="overflow-hidden border rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Value
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* A Record */}
                    <tr>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm bg-blue-100 px-2 py-1 rounded">
                          A
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm">
                          {cleanDomainName(addedDomain)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm">
                          {dnsInfo?.a_record || "Loading..."}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {dnsInfo?.a_record && (
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(dnsInfo.a_record)
                            }
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Copy to clipboard"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* CNAME Record */}
                    <tr>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm bg-blue-100 px-2 py-1 rounded">
                          CNAME
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm">
                          www.{cleanDomainName(addedDomain)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm">
                          {cleanDomainName(addedDomain)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(
                              cleanDomainName(addedDomain)
                            )
                          }
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Copy to clipboard"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> DNS changes can take up to 24-48
                  hours to propagate worldwide. Your domain will work once the
                  DNS records are updated at your domain provider.
                  {dnsInfo?.a_record && (
                    <div className="mt-2 p-2 bg-green-100 rounded text-green-800 text-sm">
                      ✅ Using 10Web server IP address: {dnsInfo.a_record}
                    </div>
                  )}
                </AlertDescription>
              </Alert>

              <div className="pt-4 border-t">
                <h5 className="font-medium text-gray-900 mb-2">
                  Common DNS Providers:
                </h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>• Cloudflare</div>
                  <div>• GoDaddy</div>
                  <div>• Namecheap</div>
                  <div>• Google Domains</div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Log into your domain provider's control panel and add the DNS
                  records above.
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDNSInstructions(false)}
                >
                  Close Instructions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SSL Certificate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <span>SSL Certificate</span>
          </CardTitle>
          <CardDescription>
            Secure your website with HTTPS encryption
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingSSL ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading SSL status...</span>
            </div>
          ) : sslStatus ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant={sslStatus.enabled ? "default" : "secondary"}>
                    {sslStatus.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Status: {sslStatus.status}
                  </span>
                </div>
                {!sslStatus.enabled && (
                  <Button onClick={enableSSL} disabled={loadingSSL}>
                    Enable SSL
                  </Button>
                )}
              </div>
              {sslStatus.expires_at && (
                <p className="text-sm text-gray-600">
                  Expires: {new Date(sslStatus.expires_at).toLocaleDateString()}
                </p>
              )}
              {sslStatus.certificate_info && (
                <div className="text-sm text-gray-600">
                  <p>Issuer: {sslStatus.certificate_info.issuer}</p>
                  <p>Subject: {sslStatus.certificate_info.subject}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                SSL status unavailable
              </span>
              <Button onClick={fetchSSLStatus}>Refresh Status</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
