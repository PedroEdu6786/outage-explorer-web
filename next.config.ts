import type { NextConfig } from "next";

// This configuration executes server-side. Do not forward credentials through
// `env` or NEXT_PUBLIC variables; live session transport is not agreed yet.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
