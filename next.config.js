/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const nextConfig = {
  images: {
    domains: ["res.cloudinary.com"], 
  },

  experimental: {
    serverComponentsExternalPackages: ['@xenova/transformers'],
  },

  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default nextConfig;
