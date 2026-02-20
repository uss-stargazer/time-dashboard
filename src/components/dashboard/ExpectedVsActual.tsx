import { useState } from "react";

const DAY_IN_SECONDS = 3600 * 24;
const EXPECTED_DAILY_HOURS = 8;
const getExpectedHours = (from: Date, to: Date): number => {
  const daysBetween = Math.ceil(
    (to.getUTCSeconds() - from.getUTCSeconds()) / DAY_IN_SECONDS,
  );
  const nWeeks = Math.floor(daysBetween / 7);
  const weekOffset = daysBetween % 7;
  const nWeekDays = nWeeks * 5;
  return nWeekDays * EXPECTED_DAILY_HOURS;
};

function DateInput({}: { value: Date; onChange: (changed: Date) => void }) {}

function ExpectedVsActual() {
  const today = new Date();

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(today);

  const expectedHours = getExpectedHours(startDate, endDate);

  return <></>;
}

export default ExpectedVsActual;
