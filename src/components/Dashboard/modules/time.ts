import type { Dayjs } from "dayjs";

const EXPECTED_DAILY_HOURS = 8;
const WEEKEND_DAYS = [0, 6];
export const getExpectedHours = (start: Dayjs, end: Dayjs): number => {
  const daysBetween = end.diff(start, "days");
  if (Number.isNaN(daysBetween))
    throw new Error(
      `getExpectedHours couldn't get days between ${start} and ${end}`,
    );
  const nWeeks = Math.floor(daysBetween / 7);
  const weekOffset = daysBetween % 7;
  let nWeekDays = nWeeks * 5 + weekOffset;

  const startDay = start.day();
  if ((startDay + weekOffset) % 7 !== end.day())
    throw new Error("getExpectedHours failed sanity check");
  for (let i = 0; i < weekOffset; i++) {
    const day = (startDay + i) % 7;
    if (WEEKEND_DAYS.includes(day)) nWeekDays--;
  }

  return nWeekDays * EXPECTED_DAILY_HOURS;
};
