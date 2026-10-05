export type LiveConfiguration = { readonly status: "unavailable" } | { readonly status: "configured"; readonly apiOrigin: string };

/** Independent public request settings; each API enforces its own 1–500 bound. */
export const productionPreviewSettings = { initialPageSize: 100, maximumPageSize: 500 } as const;
export const productionQuerySettings = { initialPageSize: 100, maximumPageSize: 500 } as const;

/** Server configuration only. Never serialize the backend address or secrets to clients. */
export function readLiveConfiguration(apiOrigin: string | undefined): LiveConfiguration {
  if (!apiOrigin?.trim()) return { status: "unavailable" };
  try {
    const origin = new URL(apiOrigin);
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname);
    if (origin.username || origin.password || origin.search || origin.hash || origin.pathname !== "/"
      || (origin.protocol !== "https:" && !(origin.protocol === "http:" && loopback))) throw new Error("Invalid origin");
    return { status: "configured", apiOrigin: origin.origin };
  } catch {
    // Do not echo configuration values; they may contain accidentally entered secrets.
    throw new Error("OUTAGE_API_ORIGIN must be an HTTPS origin or a loopback HTTP origin without credentials, path, query or fragment.");
  }
}

/** Read server env; serialize only this public managed-login URL, never backend secrets. */
export function readCognitoLogoutUrl(domain: string | undefined, clientId: string | undefined, logoutUri: string | undefined): string {
  try {
    if (!domain || !clientId || !logoutUri || !/^[a-zA-Z0-9]+$/.test(clientId)) throw new Error("Missing configuration");
    const origin = new URL(domain);
    if (origin.protocol !== "https:" || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) throw new Error("Invalid domain");
    const destination = new URL(logoutUri);
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(destination.hostname);
    if (destination.username || destination.password || destination.search || destination.hash || destination.pathname !== "/sign-in"
      || (destination.protocol !== "https:" && !(destination.protocol === "http:" && loopback))) throw new Error("Invalid return URL");
    const url = new URL("/logout", origin);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("logout_uri", logoutUri);
    return url.href;
  } catch {
    throw new Error("Configure COGNITO_DOMAIN (HTTPS origin), COGNITO_APP_CLIENT_ID and OUTAGE_AUTH_LOGOUT_URI (explicit /sign-in URL) for live auth.");
  }
}
