import type { Dayjs } from "dayjs";
import { getExpectedHours } from "./time";
import type { Money, ParsedClient } from "./definitions";

export function getExpectedValues(
  startDate: Dayjs,
  endDate: Dayjs,
  clients: ParsedClient[],
  money: Money,
) {
  const hours = getExpectedHours(startDate, endDate);
  const incomeMin =
    hours * Math.min(...clients.map((client) => client.hourlyRate));
  const incomeAvg =
    hours *
    (clients.reduce((sum, client) => sum + client.hourlyRate, 0) /
      clients.length);
  const incomeMax =
    hours * Math.max(...clients.map((client) => client.hourlyRate));

  return {
    hours: {
      value: hours,
      display: hours.toFixed(2),
    },
    income: {
      min: {
        value: incomeMin,
        display: money.format(incomeMin),
      },
      avg: {
        value: incomeAvg,
        display: money.format(incomeAvg),
      },
      max: {
        value: incomeMax,
        display: money.format(incomeMax),
      },
    },
  };
}
