/** @type {import('next').NextConfig} */
const nextConfig = {
  // Existing settings
  images: {
    domains: ["res.cloudinary.com"], 
  },
  
  // Required for transformers.js
  experimental: {
    serverComponentsExternalPackages: ['@xenova/transformers'],
  },
  
  // Enable longer API timeouts
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  
  // Critical webpack configuration
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    
    // Ensure WebAssembly is properly handled (important for onnxruntime)
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    return config;
  },
};

export default nextConfig;