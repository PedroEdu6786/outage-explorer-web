/** Exact backend identity data: validate without trimming or normalizing. */
export function isFacilityId(value: unknown): value is string {
  return typeof value === "string"
    && value.length > 0
    && !/^[\s\u0085]|[\s\u0085]$/u.test(value)
    && !/[\u0000-\u001f\u007f-\u009f\ud800-\udfff]/u.test(value)
    && new TextEncoder().encode(value).byteLength <= 256;
}
