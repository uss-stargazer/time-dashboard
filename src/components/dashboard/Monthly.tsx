import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import useClients from "../../hooks/useClients";
import trackers, { TrackerError } from "../../modules/trackers";
import { useDashboardError } from "./DashboardPane";
import { Box, Button, Typography, useTheme } from "@mui/material";
import { BarChart } from "@mui/x-charts";
import { formatMoney } from "../../modules/util";

type ClientDataGroup = { clientName: string; hours: number; income: number };

function Monthly() {
  const { clients, isLoading } = useClients();
  if (clients.length === 0)
    throw new Error("At least 1 client required for Monthly");
  if (isLoading) throw new Error("Loaded clients required for Monthly");
  const error = useDashboardError();
  const theme = useTheme();

  const [month, setMonth] = useState<Dayjs>(() => dayjs().startOf("month"));
  const [clientData, setClientData] = useState<ClientDataGroup[] | undefined>(
    undefined,
  );

  const today = dayjs();
  let monthEnd = month.endOf("month");
  let monthInProgress = false;
  if (today.isBefore(monthEnd)) {
    monthEnd = today;
    monthInProgress = true;
  }

  useEffect(() => {
    const controller = new AbortController();

    Promise.all(
      clients.map((client) =>
        (async (): Promise<ClientDataGroup> => {
          const hours = await trackers[client.tracker.name]
            .getBillableHours(
              month.toDate(),
              monthEnd.toDate(),
              // @ts-expect-error TODO: find a better way. At the moment of writing, I'm done trying to get typescript to mesh with this.
              client.tracker.data,
              controller.signal,
            )
            .catch((error) => {
              if (error instanceof TrackerError) error.clientName = client.name;
              throw error;
            });
          return {
            clientName: client.name,
            hours,
            income: client.hourlyRate.amount * hours, // TODO: Currency conversion
          };
        })(),
      ),
    )
      .catch((err) => {
        controller.abort();
        error.throw(err);
        return undefined;
      })
      .then((clientDataGroups) => setClientData(clientDataGroups));

    return () => controller.abort();
  }, [clients, month]);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Month"
            value={month}
            onChange={(value, { validationError }) =>
              value && value.isValid() && !validationError && setMonth(value)
            }
            views={["month", "year"]}
            disableFuture
          />
        </LocalizationProvider>
        {monthInProgress && (
          <Typography variant="caption">(Current month)</Typography>
        )}
      </Box>

      {!clientData ? (
        <Button loading />
      ) : (
        <BarChart
          height={300}
          width={100 + 150 * clients.length}
          dataset={clientData}
          xAxis={[{ dataKey: "clientName" }]}
          yAxis={[
            { id: "hoursAxis", dataKey: "hours", label: "Hours", width: 50 },
            {
              id: "incomeAxis",
              dataKey: "income",
              width: 50,
              position: "right",
              label: "Money", // TODO: currency
            },
          ]}
          series={[
            {
              dataKey: "hours",
              label: "Hours",
              valueFormatter: (v) => (v === null ? null : `${v?.toFixed(2)}h`),
              color: theme.palette.primary.main,
              yAxisId: "hoursAxis",
            },
            {
              dataKey: "income",
              label: "Income",
              valueFormatter: (v) => (v === null ? null : `${formatMoney(v)}`), // TODO: Currency symbol
              color: theme.palette.success.main,
              yAxisId: "incomeAxis",
            },
          ]}
        />
      )}
    </>
  );
}

export default Monthly;
