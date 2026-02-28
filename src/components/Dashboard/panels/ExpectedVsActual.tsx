import {
  Box,
  CircularProgress,
  Paper,
  Radio,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import trackers from "../../../modules/trackers";
import type { ClientWithBillableHours, DashboardPanelProps, ParsedClient } from "../modules/definitions";
import { TrackerError } from "../../../modules/trackers/definitions";
import { getActualValues, getExpectedValues } from "../modules/client-computations";

type BillableHoursResult = {
  loading: true,
  clients: ParsedClient[],
} | {
  loading: false,
  clients: ClientWithBillableHours[],
}

function fetchBillableHours(
  clients: ParsedClient[],
  startDate: Dayjs,
  endDate: Dayjs,
  signal: AbortSignal,
): Promise<ClientWithBillableHours[]> {
  return Promise.all(
    clients.map(async (client) => {
      const billableHours = await trackers[client.tracker.name]
        .getBillableHours(
          startDate,
          endDate,
          // @ts-expect-error TODO: find a better way. At the moment of writing, I'm done trying to get typescript to mesh with this.
          { ...client.tracker, clientName: client.name },
          signal
        )
        .catch((error) => {
          if (error instanceof TrackerError)
            error.clientName = client.name;
          throw error;
        });

      return { ...client, billableHours };
    }),
  );
}

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
            <Box key={preset.label}>
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

function ExpectedVsActual({ data: initialData, error, money }: DashboardPanelProps) {
  const [endDate, setEndDate] = useState<Dayjs>(() => dayjs());
  const [startDate, setStartDate] = useState<Dayjs>(() =>
    dayjs().startOf("month"),
  );

  const [data, setData] = useState<BillableHoursResult>({
    loading: true,
    clients: initialData.clients,
  });

  useEffect(() => {
    const controller = new AbortController();
    let timeoutId: number;

    new Promise((resolve) => {
      setData({ loading: true, clients: initialData.clients });
      resolve(undefined);
    }).then(() =>
      new Promise((resolve) => {
        // Small buffer timeout to prevent making and aborting a bunch of network calls during rapid changes
        timeoutId = setTimeout(resolve, 1000);
      }))
      .then(() =>
        fetchBillableHours(initialData.clients, startDate, endDate, controller.signal)
      )
      .catch((err) => {
        controller.abort();
        error.throw(err);
        throw err;
      })
      .then((clients) => {
        error.reset();
        setData({ loading: false, clients });
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [initialData.clients, endDate, error, startDate]);

  const expected = getExpectedValues(startDate, endDate, data.clients, money);
  const actual = data.loading ? "loading" : getActualValues(data.clients, expected, money);

  return (
    <>
      <Stack
        gap={1}
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
      </Stack>

      <Stack gap={2} sx={{ my: 2 }}>
        <Box>
          <Typography variant="h6">Over/under</Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>Hours</TableCell>

                  <TableCell align="right">
                    {actual === "loading" && <CircularProgress size={12} />}
                    {actual !== "loading" && actual.hours.overUnder.display}</TableCell>
                </TableRow>

                {data.clients.length === 1 ? (
                  <TableRow>
                    <TableCell>Income</TableCell>

                    <TableCell align="right">
                      {actual === "loading" && <CircularProgress size={12} />}
                      {actual !== "loading" && actual.income.overUnder.avg.display}
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    <TableRow>
                      <TableCell>Income (min)</TableCell>

                      <TableCell align="right">
                        {actual === "loading" && <CircularProgress size={12} />}
                        {actual !== "loading" && actual.income.overUnder.min.display}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Income (avg)</TableCell>

                      <TableCell align="right">
                        {actual === "loading" && <CircularProgress size={12} />}
                        {actual !== "loading" && actual.income.overUnder.avg.display}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Income (max)</TableCell>

                      <TableCell align="right">
                        {actual === "loading" && <CircularProgress size={12} />}
                        {actual !== "loading" && actual.income.overUnder.max.display}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box>
          <Typography variant="h6">
            Hours
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>Expected</TableCell>

                  <TableCell align="right">{expected.hours.display}</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>Actual</TableCell>

                  <TableCell align="right">
                    {actual === "loading" && <CircularProgress size={12} />}
                    {actual !== "loading" && actual.hours.display}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box>
          <Typography variant="h6">
            Income
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableBody>
                {data.clients.length === 1 ? (
                  <TableRow>
                    <TableCell>Expected</TableCell>

                    <TableCell align="right">{expected.income.min.display}</TableCell>
                  </TableRow>
                ) : (
                  <>
                    <TableRow>
                      <TableCell>Expected (min)</TableCell>

                      <TableCell align="right">{expected.income.min.display}</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Expected (avg)</TableCell>

                      <TableCell align="right">{expected.income.avg.display}</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Expected (max)</TableCell>

                      <TableCell align="right">{expected.income.max.display}</TableCell>
                    </TableRow>
                  </>
                )}

                <TableRow>
                  <TableCell>Actual</TableCell>

                  <TableCell align="right">
                    {actual === "loading" && <CircularProgress size={12} />}
                    {actual !== "loading" && actual.income.display}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Stack>
    </>
  );
}

export default ExpectedVsActual;
