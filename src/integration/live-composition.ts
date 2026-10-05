import { createAuthAdapter, type AuthAdapterOptions } from "../adapters/live/auth-adapter";
import { createRefreshAdapter } from "../adapters/live/refresh-adapter";

/** Auth and user-requested Admin refresh; analytical data remains unregistered. */
export function createLiveComposition(options: AuthAdapterOptions & { readonly authEnabled: boolean }) {
  if (!options.authEnabled) return null;
  const auth = createAuthAdapter(options);
  const refresh = createRefreshAdapter({ runtime: options.runtime, fetch: options.fetch, csrfToken: auth.csrfToken });
  return { ...auth, operations: { ...auth.operations, refresh } };
}
