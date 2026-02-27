import type { Dayjs } from "dayjs";

const EXPECTED_DAILY_HOURS = 8;
const WEEKEND_DAYS = [0, 6];
export const getExpectedHours = (start: Dayjs, end: Dayjs): number => {
  const daysBetween = end.diff(start, "days") + 1;
  if (Number.isNaN(daysBetween))
    throw new Error(
      `getExpectedHours couldn't get days between ${start} and ${end}`,
    );
  if (daysBetween < 1)
    throw new Error("getExpectedHours: start must be before or equal to end");
  const nWeeks = Math.floor(daysBetween / 7);
  const weekOffset = daysBetween % 7;
  let nWeekDays = nWeeks * 5;

  const startDay = start.day();

  for (let i = 0; i < weekOffset; i++) {
    const day = (startDay + i) % 7;
    const isWeekday = !WEEKEND_DAYS.includes(day);
    if (isWeekday) {
      nWeekDays++;
    }
  }

  return nWeekDays * EXPECTED_DAILY_HOURS;
};
