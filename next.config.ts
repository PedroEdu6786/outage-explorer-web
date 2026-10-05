import type { NextConfig } from "next";
import { readLiveConfiguration } from "./src/integration/config";

// This configuration executes server-side. Do not forward credentials through
// `env` or NEXT_PUBLIC variables. Flask remains the credential/session owner.
const live = readLiveConfiguration(process.env.OUTAGE_API_ORIGIN);
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  redirects() {
    // Redirect before rendering: throwing redirect() from the root page trips
    // React's development component timing on the pinned Next/React versions.
    return Promise.resolve([{ source: "/", destination: "/overview", permanent: false }]);
  },
  rewrites() {
    return Promise.resolve(live.status === "configured" ? [{ source: "/api/:path*", destination: `${live.apiOrigin}/api/:path*` }] : []);
  },
};

export default nextConfig;
