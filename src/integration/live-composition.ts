import { createAuthAdapter, type AuthAdapterOptions } from "../adapters/live/auth-adapter";
import { createRefreshAdapter } from "../adapters/live/refresh-adapter";
import { createDataAdapter } from "../adapters/live/data-adapter";
import { createDataHttpTransport } from "./data-http-client";

/** Auth/Admin refresh registration with separately prepared analytical operations. */
export function createLiveComposition(options: AuthAdapterOptions & { readonly authEnabled: boolean }) {
  if (!options.authEnabled) return null;
  const auth = createAuthAdapter(options);
  const refresh = createRefreshAdapter({ runtime: options.runtime, fetch: options.fetch, csrfToken: auth.csrfToken });
  const transport = createDataHttpTransport({ fetch: options.fetch, csrfToken: auth.csrfToken,
    isCurrent: (context) => options.runtime.isCurrent(context)
      && options.runtime.getSnapshot().status === "authenticated" && auth.csrfToken() !== null,
  });
  // Prepared separately: existing production consumers spread only auth/refresh.
  const dataOperations = createDataAdapter(transport, options.now);
  return { ...auth, operations: { ...auth.operations, refresh }, dataOperations };
}
