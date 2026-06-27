import type { Dayjs } from 'dayjs';
import { Convert } from 'easy-currencies';
import type { Client, Rate } from '../../../modules/clients';
import type { Currency } from '../../../modules/currencies';
import { getRatePeriods } from '../../../modules/rates';
import trackers from '../../../modules/trackers';
import { TrackerError } from '../../../modules/trackers/definitions';

// One billable-hours bucket at a single rate, all in the display currency.
export type RateSegment = {
  hours: number;
  rate: number;
  effectiveFrom: string;
};

/**
 * Convert a client's whole rate schedule into the display currency with a
 * single FX lookup (the conversion is linear, so we scale every entry by the
 * factor for one unit).
 */
export async function normalizeRates(
  client: Client,
  currency: Currency,
): Promise<Rate[]> {
  if (client.rateCurrency === currency) return client.rates;
  const factor = await Convert(1).from(client.rateCurrency).to(currency);
  return client.rates.map((rate) => ({
    ...rate,
    amount: rate.amount * factor,
  }));
}

/**
 * Fetch billable hours for each rate period the selected range touches. Makes
 * one tracker call per period (usually one, since most ranges sit within a
 * single rate), pairing each with its rate so income can be summed per segment.
 */
export async function fetchClientSegments(
  client: Client,
  rates: Rate[],
  startDate: Dayjs,
  endDate: Dayjs,
  signal?: AbortSignal,
): Promise<RateSegment[]> {
  const periods = getRatePeriods(rates, startDate, endDate);
  const tracker = trackers[client.tracker.name];
  return Promise.all(
    periods.map(async (period) => ({
      hours: await tracker.getBillableHours(
        period.from,
        period.to,
        // @ts-expect-error TODO: find a better way. At the moment of writing, I'm done trying to get typescript to mesh with this.
        { ...client.tracker, clientName: client.name },
        signal,
      ),
      rate: period.rate,
      effectiveFrom: period.effectiveFrom,
    })),
  ).catch((error) => {
    if (error instanceof TrackerError) error.clientName = client.name;
    throw error;
  });
}
