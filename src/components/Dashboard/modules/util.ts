import type { Dayjs } from 'dayjs';
import { Convert } from 'easy-currencies';
import type { Client } from '../../../modules/clients';
import type { Currency } from '../../../modules/currencies';
import trackers from '../../../modules/trackers';
import { TrackerError } from '../../../modules/trackers/definitions';

export async function normalizeHourlyRate(
  client: Client,
  currency: Currency,
): Promise<number> {
  return client.hourlyRate.currency === currency
    ? client.hourlyRate.amount
    : await Convert(client.hourlyRate.amount)
        .from(client.hourlyRate.currency)
        .to(currency);
}

export async function fetchBillableHours(
  client: Client,
  startDate: Dayjs,
  endDate: Dayjs,
  signal?: AbortSignal,
): Promise<number> {
  return trackers[client.tracker.name]
    .getBillableHours(
      startDate,
      endDate,
      // @ts-expect-error TODO: find a better way. At the moment of writing, I'm done trying to get typescript to mesh with this.
      { ...client.tracker, clientName: client.name },
      signal,
    )
    .catch((error) => {
      if (error instanceof TrackerError) error.clientName = client.name;
      throw error;
    });
}
