/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't fail the build on TypeScript errors
    // Remove this if you want to enforce strict TypeScript checks
    ignoreBuildErrors: true,
  },
  /* other config options here */
};

module.exports = nextConfig;
