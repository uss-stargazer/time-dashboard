import type { Dayjs } from 'dayjs';
import { getExpectedHours } from './time';
import { getRatePeriods } from '../../../modules/rates';
import type { Rate } from '../../../modules/clients';
import type {
  ClientStatistics,
  ClientStatisticsLoaded,
} from '../hooks/useDashboardState';

export type ExpectedValues = ReturnType<typeof getExpectedValues>;
export type ActualValues = ReturnType<typeof getActualValues>;

/**
 * A single rate representing a client's schedule over [start, end], weighted by
 * the expected working hours falling under each rate. In the common case (range
 * within one rate) this is just that rate; across a boundary it blends, keeping
 * the expected projection consistent with how actual income is summed.
 */
function getBlendedRate(rates: Rate[], start: Dayjs, end: Dayjs): number {
  const periods = getRatePeriods(rates, start, end);
  let weighted = 0;
  let totalHours = 0;
  for (const period of periods) {
    const hours = getExpectedHours(period.from, period.to);
    weighted += hours * period.rate;
    totalHours += hours;
  }
  if (totalHours > 0) return weighted / totalHours;
  // Degenerate range (e.g. all weekends): fall back to a plain mean of rates.
  return periods.length
    ? periods.reduce((sum, p) => sum + p.rate, 0) / periods.length
    : 0;
}

export function getExpectedValues(
  startDate: Dayjs,
  endDate: Dayjs,
  data: ClientStatistics[],
  formatMoney: (money: number) => string,
) {
  const hours = getExpectedHours(startDate, endDate);
  const blendedRates = data.map((client) =>
    getBlendedRate(client.rates, startDate, endDate),
  );
  const incomeMin = hours * Math.min(...blendedRates);
  const incomeAvg =
    hours * (blendedRates.reduce((sum, rate) => sum + rate, 0) / data.length);
  const incomeMax = hours * Math.max(...blendedRates);

  return {
    hours: {
      value: hours,
      display: hours.toFixed(2),
    },
    income: {
      min: {
        value: incomeMin,
        display: formatMoney(incomeMin),
      },
      avg: {
        value: incomeAvg,
        display: formatMoney(incomeAvg),
      },
      max: {
        value: incomeMax,
        display: formatMoney(incomeMax),
      },
    },
  };
}

export function getActualValues(
  clients: ClientStatisticsLoaded[],
  expected: ExpectedValues,
  formatMoney: (money: number) => string,
) {
  const hours = clients.reduce((sum, client) => sum + client.billableHours, 0);
  const hoursOverUnder = hours - expected.hours.value;

  const income = clients.reduce((sum, client) => sum + client.income, 0);
  const incomeAvgOverUnder = income - expected.income.avg.value;
  const incomeMinOverUnder = income - expected.income.min.value;
  const incomeMaxOverUnder = income - expected.income.max.value;

  return {
    hours: {
      value: hours,
      display: hours.toFixed(2),
      overUnder: {
        value: hoursOverUnder,
        display: hoursOverUnder.toFixed(2),
      },
    },
    income: {
      value: income,
      display: formatMoney(income),
      overUnder: {
        min: {
          value: incomeMinOverUnder,
          display: formatMoney(incomeMinOverUnder),
        },
        avg: {
          value: incomeAvgOverUnder,
          display: formatMoney(incomeAvgOverUnder),
        },
        max: {
          value: incomeMaxOverUnder,
          display: formatMoney(incomeMaxOverUnder),
        },
      },
    },
  };
}
