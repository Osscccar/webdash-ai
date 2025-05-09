// 10Web API configuration
import axios from "axios";

export const TENWEB_API_KEY = process.env.TENWEB_API_KEY;
export const TENWEB_API_BASE_URL = "https://10web.io/api/v1";

// Create a secure axios instance for 10Web API calls
export const tenwebApi = axios.create({
  baseURL: TENWEB_API_BASE_URL,
  headers: {
    "x-api-key": TENWEB_API_KEY,
    "Content-Type": "application/json",
  },
});

// Add request interceptor for rate limiting and security
tenwebApi.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent replay attacks
    config.headers["x-request-timestamp"] = Date.now().toString();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
tenwebApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle API errors gracefully
    console.error(
      "10Web API Error:",
      error?.response?.data || error?.message || error
    );
    return Promise.reject(error);
  }
);

// Available fonts for website generation
export const AVAILABLE_FONTS = [
  "Montserrat",
  "Roboto",
  "Open Sans",
  "Lato",
  "Poppins",
  "Raleway",
  "Oswald",
  "Merriweather",
  "Playfair Display",
  "Source Sans Pro",
];

// Available business types
export const BUSINESS_TYPES = [
  "agency",
  "restaurant",
  "e-commerce",
  "blog",
  "portfolio",
  "service",
  "educational",
  "nonprofit",
  "healthcare",
  "real-estate",
];

// Supported PHP versions
export const PHP_VERSIONS = ["7.4", "8.0", "8.1", "8.2", "8.3"];

// Function to validate a subdomain
export const isValidSubdomain = (subdomain: string): boolean => {
  const regex = /^[a-z0-9-]{3,63}$/;
  return regex.test(subdomain);
};

// Regions
export const REGIONS = [
  "us-central1",
  "us-east1",
  "us-west1",
  "europe-west1",
  "asia-east1",
];
