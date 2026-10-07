import { describe, expect, it } from "vitest";
import { isFacilityId } from "./facility-id";

describe("exact facility identity validation", () => {
  it.each(["001", "aB-01", "two words", "' OR 1=1 --", "%_", "é".repeat(128), "😀".repeat(64), "a".repeat(256)])("accepts exact identity %s", (value) => {
    expect(isFacilityId(value)).toBe(true);
  });
  it.each(["", " 001", "001 ", "\u00a0001", "001\u0085", "a\u0000b", "a\u007fb", "a\u009fb", "\ud800", "\udfff", "a".repeat(257), "é".repeat(129), "😀".repeat(65), 1, null])("rejects invalid identity %s", (value) => {
    expect(isFacilityId(value)).toBe(false);
  });
});
