import z from "zod";
import { TrackerClientDataSchema } from "./trackers";
import { currencies } from "./currencies";

export const BaseClientDataSchema = z.record(z.string(), z.string());
export type ZodBaseClientData = z.ZodType<Record<string, string>>;

export const ClientSchema = z.object({
  name: z.string().nonempty(),
  hourlyRate: z.object({
    amount: z.number().nonnegative(),
    currency: z.enum(currencies),
  }),
  tracker: TrackerClientDataSchema,
  isHidden: z.boolean().optional(),
});
export type Client = z.infer<typeof ClientSchema>;
