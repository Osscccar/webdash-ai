"use client";

import type React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface SiteInfoFormProps {
  siteInfo: {
    businessType: string;
    businessName: string;
    businessDescription: string;
    websiteTitle: string;
    websiteDescription: string;
    websiteKeyphrase: string;
  };
  setSiteInfo: React.Dispatch<
    React.SetStateAction<{
      businessType: string;
      businessName: string;
      businessDescription: string;
      websiteTitle: string;
      websiteDescription: string;
      websiteKeyphrase: string;
    }>
  >;
}

export function SiteInfoForm({ siteInfo, setSiteInfo }: SiteInfoFormProps) {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setSiteInfo((prevSiteInfo) => ({
      ...prevSiteInfo,
      [name]: value,
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="businessName">Business Name</Label>
        <Input
          type="text"
          id="businessName"
          name="businessName"
          value={siteInfo.businessName}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="businessType">Business Type</Label>
        <Input
          type="text"
          id="businessType"
          name="businessType"
          value={siteInfo.businessType}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="businessDescription">Business Description</Label>
        <Input
          id="businessDescription"
          name="businessDescription"
          value={siteInfo.businessDescription}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="websiteTitle">Website Title</Label>
        <Input
          type="text"
          id="websiteTitle"
          name="websiteTitle"
          value={siteInfo.websiteTitle}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="websiteDescription">Website Description</Label>
        <Input
          id="websiteDescription"
          name="websiteDescription"
          value={siteInfo.websiteDescription}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="websiteKeyphrase">Website Keyphrase</Label>
        <Input
          type="text"
          id="websiteKeyphrase"
          name="websiteKeyphrase"
          value={siteInfo.websiteKeyphrase}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
