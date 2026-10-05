import type { NextConfig } from "next";
import { readLiveConfiguration } from "./src/integration/config";

// This configuration executes server-side. Do not forward credentials through
// `env` or NEXT_PUBLIC variables. Flask remains the credential/session owner.
const live = readLiveConfiguration(process.env.OUTAGE_API_ORIGIN);
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  rewrites() {
    return Promise.resolve(live.status === "configured" ? [{ source: "/api/:path*", destination: `${live.apiOrigin}/api/:path*` }] : []);
  },
};

export default nextConfig;
