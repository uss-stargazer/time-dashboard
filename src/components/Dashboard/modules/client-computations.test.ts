import dayjs from "dayjs";
import { describe, expect, it, vi } from "vitest";
import type {
  ClientWithBillableHours,
  Money,
  ParsedClient,
} from "./definitions";
import { getActualValues, getExpectedValues } from "./client-computations";

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

const makeBillableClient = (
  hourlyRate: number,
  billableHours: number,
): ClientWithBillableHours => ({
  name: "Foo Corp",
  tracker: {
    name: "sample1",
    data: { workspaceId: "abc123", apiKey: "abc123" },
  },
  hourlyRate,
  billableHours,
});

const makeExpected = (
  hours: number,
  incomeMin: number,
  incomeAvg: number,
  incomeMax: number,
) => ({
  hours: { value: hours, display: hours.toFixed(2) },
  income: {
    min: { value: incomeMin, display: money.format(incomeMin) },
    avg: { value: incomeAvg, display: money.format(incomeAvg) },
    max: { value: incomeMax, display: money.format(incomeMax) },
  },
});

describe("getActualValues", () => {
  it("computes hours and income for a single client", () => {
    const expected = makeExpected(40, 2000, 2000, 2000);
    const result = getActualValues(
      [makeBillableClient(50, 35)],
      expected,
      money,
    );

    expect(result.hours.value).toBe(35);
    expect(result.income.value).toBe(1750);
  });

  it("sums hours and weighted income across multiple clients", () => {
    const expected = makeExpected(40, 1600, 2400, 3200);
    const clients = [
      makeBillableClient(40, 10),
      makeBillableClient(60, 20),
      makeBillableClient(80, 5),
    ];
    const result = getActualValues(clients, expected, money);

    expect(result.hours.value).toBe(35);
    expect(result.income.value).toBe(10 * 40 + 20 * 60 + 5 * 80);
  });

  it("computes positive over/under when actual exceeds expected", () => {
    const expected = makeExpected(30, 1200, 1500, 1800);
    const result = getActualValues(
      [makeBillableClient(50, 40)],
      expected,
      money,
    );

    expect(result.hours.overUnder.value).toBe(10);
    expect(result.income.overUnder.min.value).toBe(800);
    expect(result.income.overUnder.avg.value).toBe(500);
    expect(result.income.overUnder.max.value).toBe(200);
  });

  it("computes negative over/under when actual is below expected", () => {
    const expected = makeExpected(40, 2000, 2000, 2000);
    const result = getActualValues(
      [makeBillableClient(50, 20)],
      expected,
      money,
    );

    expect(result.hours.overUnder.value).toBe(-20);
    expect(result.income.overUnder.avg.value).toBe(-1000);
  });

  it("formats hours with toFixed(2)", () => {
    const expected = makeExpected(10, 500, 500, 500);
    const result = getActualValues(
      [makeBillableClient(50, 12.5)],
      expected,
      money,
    );

    expect(result.hours.display).toBe("12.50");
    expect(result.hours.overUnder.display).toBe("2.50");
  });

  it("delegates income display to money.format", () => {
    const expected = makeExpected(40, 1600, 2000, 2400);
    const result = getActualValues(
      [makeBillableClient(50, 40)],
      expected,
      money,
    );

    expect(result.income.display).toBe("$2000.00");
    expect(result.income.overUnder.min.display).toBe("$400.00");
    expect(result.income.overUnder.avg.display).toBe("$0.00");
    expect(result.income.overUnder.max.display).toBe("$-400.00");
  });
});
