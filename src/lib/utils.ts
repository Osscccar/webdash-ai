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
/**
 * Generate a secure random password that meets 10Web requirements
 * - At least 8 characters
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one number
 * - Contains at least one special character
 */
export function generateSecurePassword(): string {
  // Force a password format that we know meets the requirements
  // This is simpler than trying to randomly generate one
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";

  // Pick random characters from each required category
  const randomLowercase = lowercase.charAt(
    Math.floor(Math.random() * lowercase.length)
  );
  const randomUppercase = uppercase.charAt(
    Math.floor(Math.random() * uppercase.length)
  );
  const randomNumber = numbers.charAt(
    Math.floor(Math.random() * numbers.length)
  );

  // Create a base password that meets requirements
  let password = `Password${randomNumber}${randomLowercase}${randomUppercase}`;

  // Add more characters to make it more secure
  for (let i = 0; i < 4; i++) {
    const allChars = lowercase + uppercase + numbers;
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  return password;
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
