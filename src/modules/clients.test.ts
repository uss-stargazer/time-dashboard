import { describe, expect, it } from 'vitest';
import { ClientSchema, EPOCH_SENTINEL } from './clients';

const legacyClient = {
  name: 'Foo Corp',
  hourlyRate: { amount: 100, currency: 'USD' },
  tracker: { name: 'sample1', data: { apiToken: 'abcde' } },
};

const newClient = {
  name: 'Bar Inc',
  rateCurrency: 'EUR',
  rates: [
    { amount: 120, effectiveFrom: '2025-06-01' },
    { amount: 100, effectiveFrom: EPOCH_SENTINEL },
  ],
  tracker: { name: 'sample1', data: { apiToken: 'abcde' } },
};

describe('ClientSchema migration', () => {
  it('migrates the legacy single-rate shape to a rate schedule', () => {
    const parsed = ClientSchema.parse(legacyClient);

    expect(parsed).toMatchObject({
      name: 'Foo Corp',
      rateCurrency: 'USD',
      rates: [{ amount: 100, effectiveFrom: EPOCH_SENTINEL }],
    });
    expect('hourlyRate' in parsed).toBe(false);
  });

  it('passes the new shape through and sorts rates ascending', () => {
    const parsed = ClientSchema.parse(newClient);

    expect(parsed.rateCurrency).toBe('EUR');
    expect(parsed.rates.map((r) => r.effectiveFrom)).toEqual([
      EPOCH_SENTINEL,
      '2025-06-01',
    ]);
  });

  it('is idempotent — re-parsing migrated data is stable', () => {
    const once = ClientSchema.parse(legacyClient);
    const twice = ClientSchema.parse(once);
    expect(twice).toEqual(once);
  });

  it('rejects duplicate effective dates', () => {
    const result = ClientSchema.safeParse({
      ...newClient,
      rates: [
        { amount: 100, effectiveFrom: '2025-06-01' },
        { amount: 120, effectiveFrom: '2025-06-01' },
      ],
    });
    expect(result.success).toBe(false);
  });
});
