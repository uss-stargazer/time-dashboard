import z from "zod";
import type { ZodBaseClientData } from "../clients";
import { sample1, sample2 } from "./samples";

type GetBillableHours<ClientData> = (
  from: Date,
  to: Date,
  client: ClientData,
  signal?: AbortSignal,
) => Promise<number>;

export class TrackerError extends Error {
  public tracker: TrackerName;
  public clientName?: string;
  constructor(tracker: TrackerName, message?: string) {
    super(message);
    this.tracker = tracker;
  }
}

export interface Tracker<ClientDataSchema extends ZodBaseClientData> {
  prettyName: string;
  clientDataSchema: ClientDataSchema;
  /** @throws {TrackerError} */
  getBillableHours: GetBillableHours<z.infer<ClientDataSchema>>;
}

export const makeTracker = <ClientDataSchema extends ZodBaseClientData>(
  tracker: Tracker<ClientDataSchema>,
): Tracker<ClientDataSchema> => tracker;

const trackers = {
  sample1,
  sample2,
} as const satisfies { [key: string]: Tracker<ZodBaseClientData> };

// Remove sample trackers if not dev
if (!import.meta.env.DEV) {
  // @ts-expect-error
  delete trackers.sample1;
  // @ts-expect-error
  delete trackers.sample2;
}

export type Trackers = typeof trackers;
export type TrackerName = keyof Trackers;
export const trackerNames = Object.keys(trackers) as TrackerName[];

const unionSchemas = trackerNames.map((name) =>
  z.object({ name: z.literal(name), data: trackers[name].clientDataSchema }),
);
export const TrackerClientDataSchema = z.discriminatedUnion(
  "name",
  unionSchemas as [(typeof unionSchemas)[number], ...typeof unionSchemas],
);

export default trackers;
