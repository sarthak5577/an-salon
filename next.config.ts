import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow local phone / network device HMR access
  allowedDevOrigins: ["192.168.1.39", "localhost"],
};

export default nextConfig;
