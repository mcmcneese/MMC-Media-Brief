/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow server-side use of Node.js modules (fs, path) in API routes
  experimental: {
    serverComponentsExternalPackages: ["docx"],
  },
};

module.exports = nextConfig;
