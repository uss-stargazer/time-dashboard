import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { getRatePeriods } from './rates';
import { EPOCH_SENTINEL, type Rate } from './clients';

const baseline = (amount: number): Rate => ({
  amount,
  effectiveFrom: EPOCH_SENTINEL,
});

describe('getRatePeriods', () => {
  it('returns a single period when the range sits within one rate', () => {
    const periods = getRatePeriods(
      [baseline(100)],
      dayjs('2026-03-01'),
      dayjs('2026-03-31'),
    );

    expect(periods).toHaveLength(1);
    expect(periods[0].rate).toBe(100);
    expect(periods[0].from.format('YYYY-MM-DD')).toBe('2026-03-01');
    expect(periods[0].to.format('YYYY-MM-DD')).toBe('2026-03-31');
  });

  it('splits at a boundary inside the range, with inclusive effectiveFrom', () => {
    const rates = [baseline(100), { amount: 120, effectiveFrom: '2026-06-01' }];
    const periods = getRatePeriods(
      rates,
      dayjs('2026-05-15'),
      dayjs('2026-06-30'),
    );

    expect(periods).toHaveLength(2);

    expect(periods[0].rate).toBe(100);
    expect(periods[0].from.format('YYYY-MM-DD')).toBe('2026-05-15');
    // Old rate owns up to the day before the raise.
    expect(periods[0].to.format('YYYY-MM-DD')).toBe('2026-05-31');
    expect(periods[0].to.hour()).toBe(23);

    expect(periods[1].rate).toBe(120);
    // New rate owns its start day.
    expect(periods[1].from.format('YYYY-MM-DD')).toBe('2026-06-01');
    expect(periods[1].from.hour()).toBe(0);
    expect(periods[1].to.format('YYYY-MM-DD')).toBe('2026-06-30');
  });

  it('ignores boundaries outside the range (range within the later rate)', () => {
    const rates = [baseline(100), { amount: 120, effectiveFrom: '2026-06-01' }];
    const periods = getRatePeriods(
      rates,
      dayjs('2026-07-01'),
      dayjs('2026-07-31'),
    );

    expect(periods).toHaveLength(1);
    expect(periods[0].rate).toBe(120);
  });

  it('omits future-dated rates that never overlap the range', () => {
    const rates = [baseline(100), { amount: 200, effectiveFrom: '2027-01-01' }];
    const periods = getRatePeriods(
      rates,
      dayjs('2026-01-01'),
      dayjs('2026-12-31'),
    );

    expect(periods).toHaveLength(1);
    expect(periods[0].rate).toBe(100);
  });

  it('handles several boundaries inside one range', () => {
    const rates = [
      baseline(100),
      { amount: 110, effectiveFrom: '2026-04-01' },
      { amount: 120, effectiveFrom: '2026-08-01' },
    ];
    const periods = getRatePeriods(
      rates,
      dayjs('2026-01-01'),
      dayjs('2026-12-31'),
    );

    expect(periods.map((p) => p.rate)).toEqual([100, 110, 120]);
    expect(periods[0].to.format('YYYY-MM-DD')).toBe('2026-03-31');
    expect(periods[1].from.format('YYYY-MM-DD')).toBe('2026-04-01');
    expect(periods[1].to.format('YYYY-MM-DD')).toBe('2026-07-31');
    expect(periods[2].from.format('YYYY-MM-DD')).toBe('2026-08-01');
  });
});
