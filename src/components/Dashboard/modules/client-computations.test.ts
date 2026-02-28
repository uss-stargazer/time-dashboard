import dayjs from "dayjs";
import { describe, expect, it, vi } from "vitest";
import type { Money, ParsedClient } from "./definitions";
import { getExpectedValues } from "./client-computations";

vi.mock("./time", () => ({
  getExpectedHours: vi.fn(() => 40),
}));

const money: Money = {
  currency: "USD",
  format: (amount: number) => `$${amount.toFixed(2)}`,
};

const makeClient = (hourlyRate: number): ParsedClient =>
  ({ hourlyRate }) as ParsedClient;

describe("getExpectedValues", () => {
  const start = dayjs("2026-02-02");
  const end = dayjs("2026-02-06");

  it("returns equal min/avg/max for a single client", () => {
    const result = getExpectedValues(start, end, [makeClient(50)], money);

    expect(result.income.min.value).toBe(2000);
    expect(result.income.avg.value).toBe(2000);
    expect(result.income.max.value).toBe(2000);
  });

  it("computes min/avg/max across multiple clients", () => {
    const clients = [makeClient(40), makeClient(60), makeClient(80)];
    const result = getExpectedValues(start, end, clients, money);

    expect(result.income.min.value).toBe(40 * 40);
    expect(result.income.avg.value).toBe(40 * 60);
    expect(result.income.max.value).toBe(40 * 80);
  });

  it("formats hours with toFixed(2)", () => {
    const result = getExpectedValues(start, end, [makeClient(50)], money);

    expect(result.hours.display).toBe("40.00");
  });

  it("delegates income display to money.format", () => {
    const clients = [makeClient(25), makeClient(75)];
    const result = getExpectedValues(start, end, clients, money);

    expect(result.income.min.display).toBe("$1000.00");
    expect(result.income.avg.display).toBe("$2000.00");
    expect(result.income.max.display).toBe("$3000.00");
  });
});
