import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // 1. Tells Next.js that the app is hosted under a subpath
  basePath: '/mvp',

  // 2. Ensures that trailing slashes are handled consistently 
  // (Optional, but recommended for Cloudflare Pages compatibility)
  trailingSlash: true, 
};

export default nextConfig;
