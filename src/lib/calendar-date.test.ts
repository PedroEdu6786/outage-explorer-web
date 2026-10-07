import { describe, expect, it } from "vitest";
import { isCalendarDate } from "./calendar-date";

describe("calendar date spelling and Gregorian rules", () => {
  it("accepts real dates, leap centuries and the full four-digit year range", () => {
    for (const value of ["0000-02-29", "0001-01-01", "0099-12-31", "1900-02-28", "2000-02-29", "2024-02-29", "2026-04-30", "9999-12-31"]) {
      expect(isCalendarDate(value), value).toBe(true);
    }
  });

  it("rejects impossible days, rollover dates and non-date spellings", () => {
    for (const value of ["", "2026-00-01", "2026-13-01", "2026-01-00", "2026-01-32", "2026-04-31", "2026-02-29", "1900-02-29", "2100-02-29", "0001-02-29", "2026-2-01", "26-02-01", "+010000-01-01", "2026-01-01T00:00:00Z", "2026-01-01\n", " 2026-01-01"]) {
      expect(isCalendarDate(value), value).toBe(false);
    }
  });
});
