import type { Dayjs } from 'dayjs';
import { getExpectedHours } from './time';
import type {
  ClientStatistics,
  ClientStatisticsLoaded,
} from '../hooks/useDashboardState';

type ExpectedValues = ReturnType<typeof getExpectedValues>;

export function getExpectedValues(
  startDate: Dayjs,
  endDate: Dayjs,
  data: ClientStatistics[],
  formatMoney: (money: number) => string,
) {
  const hours = getExpectedHours(startDate, endDate);
  const incomeMin =
    hours * Math.min(...data.map((client) => client.hourlyRate));
  const incomeAvg =
    hours *
    (data.reduce((sum, client) => sum + client.hourlyRate, 0) / data.length);
  const incomeMax =
    hours * Math.max(...data.map((client) => client.hourlyRate));

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

  const income = clients.reduce(
    (sum, client) => sum + client.billableHours * client.hourlyRate,
    0,
  );
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
