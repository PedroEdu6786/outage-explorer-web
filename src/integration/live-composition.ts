import { createAuthAdapter, type AuthAdapterOptions } from "../adapters/live/auth-adapter";
import { createRefreshAdapter } from "../adapters/live/refresh-adapter";
import { createDataAdapter } from "../adapters/live/data-adapter";
import { createDataHttpTransport } from "./data-http-client";

/** Auth/Admin refresh and analytical operations share the current session transport. */
export function createLiveComposition(options: AuthAdapterOptions & { readonly authEnabled: boolean }) {
  if (!options.authEnabled) return null;
  const auth = createAuthAdapter(options);
  const refresh = createRefreshAdapter({ runtime: options.runtime, fetch: options.fetch, csrfToken: auth.csrfToken });
  const transport = createDataHttpTransport({ fetch: options.fetch, csrfToken: auth.csrfToken,
    isCurrent: (context) => options.runtime.isCurrent(context)
      && options.runtime.getSnapshot().status === "authenticated" && auth.csrfToken() !== null,
  });
  // Explicitly separate groups so consumers choose their production registration.
  const dataOperations = createDataAdapter(transport, options.now);
  return { ...auth, operations: { ...auth.operations, refresh }, dataOperations };
}
