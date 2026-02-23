import type { Dayjs } from "dayjs";
import type { TrackerName } from ".";
import type { ZodBaseClientData } from "../clients";
import type z from "zod";

type GetBillableHours<ClientData> = (
  from: Dayjs,
  to: Dayjs,
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

export interface Tracker<
  ClientDataSchema extends ZodBaseClientData,
  ComputedDataSchema extends ZodBaseClientData,
> {
  prettyName: string;
  clientDataSchema: ClientDataSchema;

  // Data under the 'computed' property isn't prompted by the
  // UI, but instead should be computed when clientData changes.
  computed?: {
    dataSchema: ComputedDataSchema;
    compute: (
      newClient: z.infer<ClientDataSchema>,
      old?: {
        data: z.infer<ClientDataSchema>;
        computed: z.infer<ComputedDataSchema>;
      },
      signal?: AbortSignal,
    ) => Promise<z.infer<ComputedDataSchema>>;
  };

  /** @throws {TrackerError} */
  getBillableHours: GetBillableHours<{
    data: z.infer<ClientDataSchema>;
    computed: z.infer<ComputedDataSchema>;
  }>;
}

export const makeTracker = <
  ClientDataSchema extends ZodBaseClientData,
  ComputedDataSchema extends ZodBaseClientData = z.ZodObject<{}>,
>(
  tracker: Tracker<ClientDataSchema, ComputedDataSchema>,
): Tracker<ClientDataSchema, ComputedDataSchema> => tracker;
