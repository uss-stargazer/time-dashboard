import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import trackers, { TrackerError } from "../../../modules/trackers";
import type { DashboardPanelProps } from "../modules/definitions";

const EXPECTED_DAILY_HOURS = 8;
const WEEKEND_DAYS = [0, 6];
const getExpectedHours = (start: Dayjs, end: Dayjs): number => {
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

type Row = { name: string; expected: string; actual?: string };

function ExpectedVsActual({ data, error, money }: DashboardPanelProps) {
  const [endDate, setEndDate] = useState<Dayjs>(() => dayjs());
  const [startDate, setStartDate] = useState<Dayjs>(() =>
    dayjs().startOf("month"),
  );

  const [actualHours, setActualHours] = useState<number | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();
    let timeoutId: number;

    new Promise((resolve) => {
      // Small buffer timeout to prevent making and aborting a bunch of network calls during rapid changes
      timeoutId = setTimeout(resolve, 1000);
    })
      .then(() =>
        Promise.all(
          data.clients.map((client) =>
            trackers[client.tracker.name]
              .getBillableHours(
                startDate.toDate(),
                endDate.toDate(),
                // @ts-expect-error TODO: find a better way. At the moment of writing, I'm done trying to get typescript to mesh with this.
                client.tracker.data,
                controller.signal,
              )
              .catch((error) => {
                if (error instanceof TrackerError)
                  error.clientName = client.name;
                throw error;
              }),
          ),
        ),
      )
      .catch((err) => {
        controller.abort();
        error.throw(err);
        return undefined;
      })
      .then((clientTotalHours) => {
        if (clientTotalHours) error.reset();
        setActualHours(
          clientTotalHours &&
            clientTotalHours.reduce(
              (total, clientHours) => total + clientHours,
              0,
            ),
        );
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [data.clients, startDate, endDate]);

  const expectedHours = getExpectedHours(startDate, endDate);
  const rows: Row[] = [
    {
      name: "Hours",
      expected: expectedHours.toFixed(2),
      actual: actualHours?.toFixed(2),
    },
    ...Object.entries(
      typeof data.rate === "number" ? { single: data.rate } : data.rate,
    ).map(([stat, rate]) => ({
      name: `Income (${stat})`,
      expected: money.format(expectedHours * rate),
      actual:
        actualHours !== undefined
          ? money.format(actualHours * rate)
          : undefined,
    })),
  ];

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="From"
            value={startDate}
            onChange={(value, { validationError }) =>
              value &&
              value.isValid() &&
              !validationError &&
              setStartDate(value)
            }
            maxDate={endDate}
            disableFuture
          />
          <DatePicker
            label="To"
            value={endDate}
            onChange={(value, { validationError }) =>
              value && value.isValid() && !validationError && setEndDate(value)
            }
            minDate={startDate}
            disableFuture
          />
        </LocalizationProvider>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "background.paper" }}>
              <TableCell />
              <TableCell
                variant="head"
                align="center"
                sx={{ color: "primary.main", width: 10, p: 2 }}
              >
                Actual
              </TableCell>
              <TableCell
                variant="head"
                align="center"
                sx={{ color: "primary.main", width: 10, p: 2 }}
              >
                Expected
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.name}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row" align="right">
                  {row.name}
                </TableCell>
                <TableCell align="center" color="primary.main">
                  {row.actual !== undefined ? row.actual : <Button loading />}
                </TableCell>
                <TableCell align="center" color="primary.main">
                  {row.expected}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

export default ExpectedVsActual;
