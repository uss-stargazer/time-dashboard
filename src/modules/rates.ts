import dayjs, { type Dayjs } from 'dayjs';
import type { Rate } from './clients';

export type RatePeriod = {
  from: Dayjs;
  to: Dayjs;
  rate: number;
  effectiveFrom: string;
};

/**
 * Split [start, end] at each rate boundary that falls inside it, returning one
 * period per applicable rate with its hours-bearing bounds. Bounds are
 * normalised to start/end-of-day so trackers that use datetime precision (e.g.
 * Clockify) don't drop the boundary day's entries.
 *
 * `rates` must be sorted ascending by effectiveFrom and non-empty (its first
 * entry is the baseline). Periods that don't overlap the range (e.g. a
 * future-dated rate) are omitted.
 */
export function getRatePeriods(
  rates: Rate[],
  start: Dayjs,
  end: Dayjs,
): RatePeriod[] {
  const rangeStart = start.startOf('day');
  const rangeEnd = end.endOf('day');
  const periods: RatePeriod[] = [];

  for (let i = 0; i < rates.length; i++) {
    const rate = rates[i];
    const next = rates[i + 1];
    // This rate is in effect from its own effectiveFrom until the day before
    // the next one's; the last rate runs to the end of the range.
    const rateStart = dayjs(rate.effectiveFrom).startOf('day');
    const rateEnd = next
      ? dayjs(next.effectiveFrom).startOf('day').subtract(1, 'day').endOf('day')
      : rangeEnd;

    // Intersect [rateStart, rateEnd] with [rangeStart, rangeEnd].
    const from = rateStart.isAfter(rangeStart) ? rateStart : rangeStart;
    const to = rateEnd.isBefore(rangeEnd) ? rateEnd : rangeEnd;
    if (from.isAfter(to)) continue;

    periods.push({ from, to, rate: rate.amount, effectiveFrom: rate.effectiveFrom });
  }

  return periods;
}
