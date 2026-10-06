import type { ResourceRepository } from "../contracts/resources";
import { createResourceRepository, disabledResourcePolicy } from "../resources/resource-repository";
import { createAuthAdapter, type AuthAdapterOptions } from "../adapters/live/auth-adapter";
import { createRefreshAdapter } from "../adapters/live/refresh-adapter";
import { createDataAdapter } from "../adapters/live/data-adapter";
import { createDataHttpTransport } from "./data-http-client";

/** Auth/Admin refresh and analytical operations share the current session transport. */
export function createLiveComposition(options: AuthAdapterOptions & { readonly authEnabled: boolean; readonly resources?: ResourceRepository }) {
  if (!options.authEnabled) return null;
  const resources = options.resources ?? createResourceRepository({ runtime: options.runtime, policy: disabledResourcePolicy, ...(options.now ? { now: options.now } : {}) });
  const auth = createAuthAdapter(options);
  const refresh = createRefreshAdapter({ runtime: options.runtime, fetch: options.fetch, csrfToken: auth.csrfToken });
  const transport = createDataHttpTransport({ fetch: options.fetch, csrfToken: auth.csrfToken,
    isCurrent: (context) => options.runtime.isCurrent(context)
      && options.runtime.getSnapshot().status === "authenticated" && auth.csrfToken() !== null,
  });
  // Explicitly separate groups so consumers choose their production registration.
  const dataOperations = createDataAdapter(transport, options.now, resources);
  return { ...auth, resources, dispose() { resources.dispose(); auth.dispose(); }, operations: { ...auth.operations, refresh }, dataOperations };
}
