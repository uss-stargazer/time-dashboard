import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import { getExpectedHours } from "./time";

// Reference week: Mon 2024-01-08 through Sun 2024-01-14
const mon = dayjs("2024-01-08");
const tue = dayjs("2024-01-09");
const thu = dayjs("2024-01-11");
const fri = dayjs("2024-01-12");
const sat = dayjs("2024-01-13");
const sun = dayjs("2024-01-14");
const nextMon = dayjs("2024-01-15");
const nextSun = dayjs("2024-01-21");

describe("getExpectedHours", () => {
  it("returns 8h for a single weekday", () => {
    expect(getExpectedHours(mon, mon)).toBe(8);
  });

  it("returns 0h for a single weekend day", () => {
    expect(getExpectedHours(sat, sat)).toBe(0);
  });

  it("returns 16h for two adjacent weekdays (Mon–Tue)", () => {
    expect(getExpectedHours(mon, tue)).toBe(16);
  });

  it("returns 40h for a full work week (Mon–Fri)", () => {
    expect(getExpectedHours(mon, fri)).toBe(40);
  });

  it("returns 16h spanning a weekend (Fri–Mon)", () => {
    expect(getExpectedHours(fri, nextMon)).toBe(16);
  });

  it("returns 0h for a weekend-only range (Sat–Sun)", () => {
    expect(getExpectedHours(sat, sun)).toBe(0);
  });

  it("returns 8h from Sat–Mon (only Mon counts)", () => {
    expect(getExpectedHours(sat, nextMon)).toBe(8);
  });

  it("returns 8h from Sun–Mon (only Mon counts)", () => {
    expect(getExpectedHours(sun, nextMon)).toBe(8);
  });

  it("returns 40h for a full 7-day week (Mon–Sun)", () => {
    expect(getExpectedHours(mon, sun)).toBe(40);
  });

  it("returns 48h from Mon to next Mon (6 weekdays)", () => {
    expect(getExpectedHours(mon, nextMon)).toBe(48);
  });

  it("returns 80h for two full weeks (Mon 8th–Sun 21st)", () => {
    expect(getExpectedHours(mon, nextSun)).toBe(80);
  });

  it("returns 24h spanning a weekend (Thu–Mon)", () => {
    expect(getExpectedHours(thu, nextMon)).toBe(24);
  });

  it("returns 160h for a longer span (Mon Jan 8–Fri Feb 2)", () => {
    expect(getExpectedHours(mon, dayjs("2024-02-02"))).toBe(160);
  });

  it("throws on invalid input", () => {
    expect(() =>
      getExpectedHours(dayjs("invalid"), dayjs("invalid")),
    ).toThrow();
  });

  it("throws when start is after end", () => {
    expect(() => getExpectedHours(nextMon, mon)).toThrow();
  });
});
