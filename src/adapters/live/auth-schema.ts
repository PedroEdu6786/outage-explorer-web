import { z } from "zod";
import type { AuthenticatedSession } from "../../contracts/session";

/** Current user-confirmed backend response. Never expose CSRF in presentation props. */
export const authSessionSchema = z.object({
  user: z.object({ id: z.string().min(1).max(256), email: z.string().min(1).max(320), role: z.enum(["viewer", "analyst", "admin"]) }),
  expires_at: z.iso.datetime({ offset: true }),
  csrf_token: z.string().min(1).max(512).regex(/^[\x21-\x7e]+$/),
});

export function mapAuthSession(dto: z.infer<typeof authSessionSchema>): AuthenticatedSession {
  // User-supplied presentation restrictions; Flask independently authorizes each API call.
  const detailAccess = dto.user.role === "analyst" || dto.user.role === "admin";
  return {
    identity: { subject: dto.user.id, displayName: dto.user.email },
    capabilities: { datasetIds: detailAccess ? ["national", "facilities", "generators"] : ["national"], canReadNationalSeries: true, canExecuteQuery: true },
    expiresAt: dto.expires_at,
  };
}
