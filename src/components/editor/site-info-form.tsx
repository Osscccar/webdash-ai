"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BUSINESS_TYPES } from "@/config/tenweb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const siteInfoSchema = z.object({
  businessType: z.string().min(1, "Business type is required"),
  businessName: z.string().min(1, "Business name is required"),
  businessDescription: z
    .string()
    .min(10, "Business description must be at least 10 characters"),
  websiteTitle: z.string().min(1, "Website title is required"),
  websiteDescription: z
    .string()
    .min(10, "Website description must be at least 10 characters"),
  websiteKeyphrase: z.string().optional(),
});

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof siteInfoSchema>>({
    resolver: zodResolver(siteInfoSchema),
    defaultValues: siteInfo,
  });

  function onSubmit(values: z.infer<typeof siteInfoSchema>) {
    setIsSubmitting(true);

    // Update the parent component's state
    setSiteInfo(values);

    setTimeout(() => {
      setIsSubmitting(false);
    }, 500);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="businessType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BUSINESS_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the type of business or organization.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Creative Solutions" {...field} />
                </FormControl>
                <FormDescription>
                  The name of your business or organization.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="businessDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about your business..."
                    className="resize-none min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  A brief description of your business and what you offer.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="websiteTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Creative Solutions | Digital Agency"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  The title that appears in the browser tab.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="websiteDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="A brief description of your website for search engines..."
                    className="resize-none min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  A meta description for your website (important for SEO).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="websiteKeyphrase"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website Key Phrase</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., digital agency creative solutions"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Main keywords for your website (separated by spaces).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="bg-[#f58327] hover:bg-[#f58327]/90 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save Site Info"}
        </Button>
      </form>
    </Form>
  );
}
