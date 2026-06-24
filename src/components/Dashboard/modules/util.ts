import type { Dayjs } from 'dayjs';
import { Convert } from 'easy-currencies';
import type { Client } from '../../../modules/clients';
import type { Currency } from '../../../modules/currencies';
import trackers from '../../../modules/trackers';
import { TrackerError } from '../../../modules/trackers/definitions';

export type ClientOutput = {
  name: string;
  hourlyRate: number;
  billableHours: number | undefined;
};

export async function parseClients(
  clients: Client[],
  universalCurrency: Currency,
): Promise<ClientOutput[]> {
  try {
    return Promise.all(
      clients
        .filter((client) => !client.isHidden)
        .map((client) =>
          (async () => ({
            name: client.name,
            billableHours: undefined,
            hourlyRate:
              client.hourlyRate.currency === universalCurrency
                ? client.hourlyRate.amount
                : await Convert(client.hourlyRate.amount)
                    .from(client.hourlyRate.currency)
                    .to(universalCurrency),
          }))(),
        ),
    );
  } catch (error) {
    throw new Error(`converting to ${universalCurrency}: ${error}`);
  }
}

export function fetchBillableHours(
  startDate: Dayjs,
  endDate: Dayjs,
  clients: Client[],
  baseClientOutputs?: ClientOutput[],
  signal?: AbortSignal,
): Promise<ClientOutput[]> {
  return Promise.all(
    clients.map(async (client, idx) => {
      const billableHours = await trackers[client.tracker.name]
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

      return {
        name: client.name,
        hourlyRate: client.hourlyRate.amount, // not totally accurate because currency conversion
        ...(baseClientOutputs && baseClientOutputs[idx]),
        billableHours,
      };
    }),
  );
}
