import z from 'zod';
import { currencies } from './currencies';
import { TrackerUnion, UncomputedTrackerUnion } from './trackers';

export const BaseClientDataSchema = z.record(z.string(), z.string());
export type ZodBaseClientData = z.ZodType<Record<string, string>>;

export type ClientName = string;

// The first (baseline) rate in a client's history uses this sentinel date so
// that every entry has a uniform shape. Nothing predates it, so the baseline
// rate correctly applies to all earlier time entries. See migrateClient below.
export const EPOCH_SENTINEL = '1970-01-01';

export const RateSchema = z.object({
  amount: z.number().nonnegative('Invalid amount'),
  // 'YYYY-MM-DD'. The rate is in effect *from* this day (inclusive) until the
  // next entry's effectiveFrom; the last entry is open-ended.
  effectiveFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date (expected YYYY-MM-DD)'),
});
export type Rate = z.infer<typeof RateSchema>;

const RatesSchema = z
  .array(RateSchema)
  .nonempty('At least one rate is required')
  .refine(
    (rates) =>
      new Set(rates.map((r) => r.effectiveFrom)).size === rates.length,
    'Rate change dates must be unique',
  )
  // Normalise to ascending order so the split/blend logic can assume sorted
  // input. effectiveFrom is YYYY-MM-DD, so lexicographic === chronological.
  .transform((rates) =>
    [...rates].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom)),
  );

const ClientObjectSchema = z.object({
  name: z.string().nonempty('Required.'),
  rateCurrency: z.enum(currencies, 'Invalid currency code'),
  rates: RatesSchema,
  tracker: TrackerUnion,
  isHidden: z.boolean().optional(),
});

// Lazily migrate the legacy single-rate shape
// ({ hourlyRate: { amount, currency } }) to the rate-schedule shape on read.
// Idempotent: new-shape data passes through untouched and re-persists on the
// next settings write.
function migrateClient(raw: unknown): unknown {
  if (
    raw &&
    typeof raw === 'object' &&
    'hourlyRate' in raw &&
    !('rates' in raw)
  ) {
    const { hourlyRate, ...rest } = raw as {
      hourlyRate?: { amount?: number; currency?: string };
    } & Record<string, unknown>;
    return {
      ...rest,
      rateCurrency: hourlyRate?.currency,
      rates: [{ amount: hourlyRate?.amount, effectiveFrom: EPOCH_SENTINEL }],
    };
  }
  return raw;
}

export const ClientSchema = z.preprocess(migrateClient, ClientObjectSchema);
// The form always produces the new shape, so it needs no migration — just the
// uncomputed tracker variant.
export const UncomputedClientSchema = ClientObjectSchema.omit({
  tracker: true,
}).extend({ tracker: UncomputedTrackerUnion });
export type Client = z.infer<typeof ClientSchema>;
export type UncomputedClient = z.infer<typeof UncomputedClientSchema>;
