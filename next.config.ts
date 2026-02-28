import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  basePath: '/mvp',
  output: 'export', // Add this line
  trailingSlash: true, 
};

export default nextConfig;
