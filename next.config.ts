import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The parentheses route groups confuse Next 16's Turbopack route-type
  // generator, producing a malformed .next/dev/types/routes.d.ts. Disable
  // typed routes to avoid generating those broken types.
  typedRoutes: false,
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
