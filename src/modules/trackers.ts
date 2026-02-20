import z from "zod";
import type { ZodBaseClientData } from "./clients";

type GetBillableHours<ClientData> = (
  from: Date,
  to: Date,
  client: ClientData,
  signal?: AbortSignal,
) => Promise<number>;

export interface Tracker<ClientDataSchema extends ZodBaseClientData> {
  prettyName: string;
  clientDataSchema: ClientDataSchema;
  getBillableHours: GetBillableHours<z.infer<ClientDataSchema>>;
}

export const makeTracker = <ClientDataSchema extends ZodBaseClientData>(
  tracker: Tracker<ClientDataSchema>,
): Tracker<ClientDataSchema> => tracker;

const trackers = {
  sample1: makeTracker({
    prettyName: "Sample Tracker 1",
    clientDataSchema: z.object({ apiToken: z.string() }),
    getBillableHours: async (to, from, client) => {
      if (client.apiToken.length !== 5) throw new Error("invalid apiToken");
      return (from.getSeconds() - to.getSeconds()) / 3600;
    },
  }),
  sample2: makeTracker({
    prettyName: "Sample Tracker 2",
    clientDataSchema: z.object({ uuid: z.uuid(), id: z.string().length(3) }),
    getBillableHours: async (to, from, client) =>
      ((from.getSeconds() - to.getSeconds()) / 3600) * client.id.length,
  }),
} as const satisfies { [key: string]: Tracker<ZodBaseClientData> };

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
