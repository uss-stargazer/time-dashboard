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
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import useClients from "../../hooks/useClients";
import trackers from "../../modules/trackers";

const EXPECTED_DAILY_HOURS = 8;
const WEEKEND_DAYS = [0, 6];
const getExpectedHours = (start: Dayjs, end: Dayjs): number => {
  const daysBetween = end.diff(start, "days");
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

function ExpectedVsActual() {
  const [endDate, setEndDate] = useState<Dayjs>(() => dayjs());
  const [startDate, setStartDate] = useState<Dayjs>(() =>
    dayjs().subtract(1, "year"),
  );

  const { clients, isLoading: clientsAreLoading } = useClients();
  const [actualHours, setActualHours] = useState<number | undefined>(undefined);
  if (clients.length === 0)
    throw new Error("At least 1 client required for ExpectedVsActual");
  if (clientsAreLoading)
    throw new Error("Loaded clients required for ExpectedVsActual");

  useEffect(() => {
    const controller = new AbortController();
    let timeoutId: number;

    new Promise((resolve) => {
      // Small buffer timeout to prevent making and aborting a bunch of network calls during rapid changes
      timeoutId = setTimeout(resolve, 1000);
    })
      .then(() =>
        Promise.all(
          clients.map((client) =>
            trackers[client.tracker.name].getBillableHours(
              startDate.toDate(),
              endDate.toDate(),
              // @ts-expect-error TODO: find a better way. At the moment of writing, I'm done trying to get typescript to mesh with this.
              client.tracker.data,
              controller.signal,
            ),
          ),
        ),
      )
      .then((clientTotalHours) => {
        setActualHours(
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
  }, [startDate, endDate]);

  if (clientsAreLoading) return <Button loading />;

  const expectedHours = getExpectedHours(startDate, endDate);

  // Compute table rows

  const rows: { name: string; expected: number; actual?: number }[] = [
    {
      name: "Hours",
      expected: expectedHours,
      actual: actualHours,
    },
  ];
  if (clients.length > 1) {
    // TODO: This doesn't take into account currencty 😭; prob should prompt user for currency and convert all before
    const rates = clients.map((c) => c.hourlyRate.amount);
    const rateStats = {
      avg: rates.reduce((sum, v) => sum + v, 0) / rates.length,
      min: Math.min(...rates),
      max: Math.max(...rates),
    };
    Object.entries(rateStats).forEach(([stat, rate]) =>
      rows.push({
        name: `Income (${stat})`,
        expected: expectedHours * rate,
        actual: actualHours !== undefined ? actualHours * rate : undefined,
      }),
    );
  } else {
    rows.push({
      name: "Income",
      expected: expectedHours * clients[0].hourlyRate.amount,
      actual:
        actualHours !== undefined
          ? actualHours * clients[0].hourlyRate.amount
          : undefined,
    });
  }

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
            onChange={(value) => value && setStartDate(value)}
          />
          <DatePicker
            label="To"
            value={endDate}
            onChange={(value) => value && setEndDate(value)}
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
                {/* TODO: currency symbol */}
                <TableCell align="center" color="primary.main">
                  {row.actual !== undefined ? (
                    (Math.round(row.actual * 100) / 100).toLocaleString()
                  ) : (
                    <Button loading />
                  )}
                </TableCell>
                <TableCell align="center" color="primary.main">
                  {(Math.round(row.expected * 100) / 100).toLocaleString()}
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
