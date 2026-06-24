import type { Dayjs } from 'dayjs';
import { getExpectedHours } from './time';
import type { Money } from '../hooks/useDashboardState';
import type { ClientOutput } from './util';

type ExpectedValues = ReturnType<typeof getExpectedValues>;

export function getExpectedValues(
  startDate: Dayjs,
  endDate: Dayjs,
  data: ClientOutput[],
  money: Money,
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

export function getActualValues(
  data: ClientOutput[],
  expected: ExpectedValues,
  money: Money,
) {
  const clients = data.filter((client) => client.billableHours != undefined);

  const hours = clients.reduce((sum, client) => sum + client.billableHours!, 0);
  const hoursOverUnder = hours - expected.hours.value;

  const income = clients.reduce(
    (sum, client) => sum + client.billableHours! * client.hourlyRate,
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
      display: money.format(income),
      overUnder: {
        min: {
          value: incomeMinOverUnder,
          display: money.format(incomeMinOverUnder),
        },
        avg: {
          value: incomeAvgOverUnder,
          display: money.format(incomeAvgOverUnder),
        },
        max: {
          value: incomeMaxOverUnder,
          display: money.format(incomeMaxOverUnder),
        },
      },
    },
  };
}
