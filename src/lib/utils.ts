import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { customAlphabet } from "nanoid";

/**
 * Combines class names with tailwind merging
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to locale string
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Generate a random subdomain
 */
const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);
export function generateRandomSubdomain(prefix = ""): string {
  const randomId = nanoid(8);
  return prefix ? `${prefix}-${randomId}` : randomId;
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const special = "!@#$%^&*()_+{}[]|:;<>,.?/~";

  const allChars = lowercase + uppercase + numbers + special;
  let password = "";

  // Ensure at least one character from each required type
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));

  // Fill the rest of the password
  for (let i = 0; i < 9; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
}

/**
 * Extract domain from email
 */
export function getDomainFromEmail(email: string): string | null {
  if (!email || !email.includes("@")) return null;
  return email.split("@")[1].split(".")[0];
}

/**
 * Delay function for simulating loading states
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sanitize string for use in URLs
 */
export function sanitizeForUrl(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Get user initials from name
 */
export function getUserInitials(name?: string): string {
  if (!name) return "?";

  const parts = name.split(" ").filter((part) => part.length > 0);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Truncate text to a specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Get color based on status
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
    case "complete":
    case "completed":
    case "ready":
      return "bg-green-500";
    case "pending":
    case "processing":
    case "generating":
    case "configuring":
    case "finalizing":
      return "bg-blue-500";
    case "error":
    case "failed":
      return "bg-red-500";
    case "canceled":
    case "cancelled":
    case "suspended":
      return "bg-orange-500";
    default:
      return "bg-gray-500";
  }
}
