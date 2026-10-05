import { createAuthAdapter, type AuthAdapterOptions } from "../adapters/live/auth-adapter";

/** Only auth is registered here. Pending data services never substitute fixtures. */
export function createLiveComposition(options: AuthAdapterOptions & { readonly authEnabled: boolean }) {
  return options.authEnabled ? createAuthAdapter(options) : null;
}
