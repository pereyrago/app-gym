import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { classCanBeEdited } from "./class-utils";

describe("classCanBeEdited", () => {
  const originalDateNow = Date.now;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    Date.now = originalDateNow;
  });

  it("returns true when now is before class start", () => {
    const now = new Date("2025-03-12T14:00:00Z");
    vi.setSystemTime(now);
    // Class starts 2025-03-12 16:00 in app TZ - we mock so we need class_date + start_time
    // classCanBeEdited uses parseClassDateTimeInAppTz; result depends on APP_TIMEZONE.
    // Use a class that started 1h ago: start 13:00, now 14:00 -> 24h after start = 13:00 next day -> editable
    expect(classCanBeEdited("2025-03-12", "13:00")).toBe(true);
  });

  it("returns true when now is exactly 24 hours after class start", () => {
    const now = new Date("2025-03-12T12:00:00Z");
    vi.setSystemTime(now);
    // Class was at 2025-03-11 12:00 app TZ -> 24h later is 2025-03-12 12:00 -> still editable
    expect(classCanBeEdited("2025-03-11", "12:00")).toBe(true);
  });

  it("returns false when now is more than 24 hours after class start", () => {
    // Class 2025-03-11 12:00 in America/Argentina/Buenos_Aires = 2025-03-11T15:00:00Z (UTC-3)
    // 24h after = 2025-03-12T15:00:00Z. Set now to 15:01 UTC so we're past the window.
    const now = new Date("2025-03-12T15:01:00Z");
    vi.setSystemTime(now);
    expect(classCanBeEdited("2025-03-11", "12:00")).toBe(false);
  });

  it("returns true when class start is in the future", () => {
    const now = new Date("2025-03-12T10:00:00Z");
    vi.setSystemTime(now);
    expect(classCanBeEdited("2025-03-12", "18:00")).toBe(true);
  });
});
