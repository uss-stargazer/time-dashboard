import z from "zod";
import { makeTracker, TrackerError } from ".";

export const sample1 = makeTracker({
  prettyName: "Sample Tracker 1",
  clientDataSchema: z.object({ apiToken: z.string() }),
  getBillableHours: async (to, from, client) => {
    if (client.apiToken.length !== 5)
      throw new TrackerError("sample1", "invalid apiToken");
    return from.diff(to, "days") / 3600;
  },
});

export const sample2 = makeTracker({
  prettyName: "Sample Tracker 2",
  clientDataSchema: z.object({ uuid: z.uuid(), id: z.string().length(3) }),
  getBillableHours: async (to, from, client) =>
    (from.diff(to, "days") / 3600) * client.id.length,
});
