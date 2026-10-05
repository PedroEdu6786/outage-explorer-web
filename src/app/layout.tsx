import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";
import { readCognitoLogoutUrl, readLiveConfiguration } from "../integration/config";

export const metadata: Metadata = {
  title: "Outage Explorer",
  description: "Explore authorized U.S. nuclear outage observations.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const authEnabled = readLiveConfiguration(process.env.OUTAGE_API_ORIGIN).status === "configured";
  const logoutUrl = authEnabled ? readCognitoLogoutUrl(process.env.COGNITO_DOMAIN, process.env.COGNITO_APP_CLIENT_ID, process.env.OUTAGE_AUTH_LOGOUT_URI) : undefined;
  return (
    <html lang="en">
      {/* Shared CSS loads the same local licensed fonts in Next and Storybook. */}
      <body><Providers authEnabled={authEnabled} logoutUrl={logoutUrl}>{children}</Providers></body>
    </html>
  );
}
