import {
  Box,
  Button,
  Paper,
  Radio,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
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

function DateInput({
  label,
  value,
  onChange,
  validate,
  presets,
}: {
  label: string;
  value: Dayjs;
  onChange: (newDate: Dayjs) => void;
  validate: (newDate: Dayjs) => void | string;
  presets?: { label: string; onClick: () => void }[];
}) {
  const [error, setError] = useState<string | null>(null);
  return (
    <Box>
      <DatePicker
        label={label}
        value={value}
        onChange={(value, { validationError }) => {
          if (value && value.isValid() && !validationError) {
            const error = validate(value);
            if (typeof error === "string") setError(error);
            else {
              setError(null);
              onChange(value);
            }
          }
        }}
        disableFuture
      />
      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}
      {presets && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {presets.map((preset) => (
            <Box>
              <Radio
                size="small"
                checked={false}
                onClick={preset.onClick}
                sx={{ p: 0.5 }}
              />
              <Typography variant="caption">{preset.label}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

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
          <DateInput
            label="From"
            value={startDate}
            onChange={setStartDate}
            validate={(startDate) => {
              if (startDate.isAfter(endDate))
                return "Start must be before end!";
            }}
            presets={[
              {
                label: "month",
                onClick: () => setStartDate(endDate.startOf("month")),
              },
              {
                label: "year",
                onClick: () => setStartDate(endDate.startOf("year")),
              },
            ]}
          />
          <DateInput
            label="To"
            value={endDate}
            onChange={setEndDate}
            validate={(endDate) => {
              if (startDate.isAfter(endDate))
                return "Start must be before end!";
            }}
            presets={[{ label: "today", onClick: () => setEndDate(dayjs()) }]}
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
