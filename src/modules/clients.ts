import z from "zod";
import { currencies } from "./currencies";
import { TrackerUnion, UncomputedTrackerUnion } from "./trackers";

export const BaseClientDataSchema = z.record(z.string(), z.string());
export type ZodBaseClientData = z.ZodType<Record<string, string>>;

export type ClientName = string;
export const ClientSchema = z.object({
  name: z.string().nonempty("Required."),
  hourlyRate: z.object({
    amount: z.number().nonnegative("Invalid amount"),
    currency: z.enum(currencies, "Invalid currency code"),
  }),
  tracker: TrackerUnion,
  isHidden: z.boolean().optional(),
});
export const UncomputedClientSchema = ClientSchema.omit({
  tracker: true,
}).extend({ tracker: UncomputedTrackerUnion });
export type Client = z.infer<typeof ClientSchema>;
export type UncomputedClient = z.infer<typeof UncomputedClientSchema>;
