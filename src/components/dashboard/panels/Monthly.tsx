import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import trackers, { TrackerError } from "../../../modules/trackers";
import { Box, Button, Typography, useTheme } from "@mui/material";
import { BarChart } from "@mui/x-charts";
import type { DashboardPanelProps } from "../modules/definitions";

type ClientDataGroup = { clientName: string; hours: number; income: number };

function Monthly({ data, error, money }: DashboardPanelProps) {
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
      data.clients.map((client) =>
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
            income: client.hourlyRate * hours,
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
  }, [data.clients, month]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
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
          width={300}
          height={100 + 150 * data.clients.length}
          sx={{ bgcolor: "background.paper" }}
          layout="horizontal"
          dataset={clientData}
          yAxis={[
            {
              dataKey: "clientName",
              tickLabelStyle: {
                angle: -90,
                textAnchor: "middle",
              },
            },
          ]}
          xAxis={[
            {
              id: "hoursAxis",
              dataKey: "hours",
              position: "top",
              label: "Hours",
            },
            {
              id: "incomeAxis",
              dataKey: "income",
              position: "bottom",
              label: `Money (${money.currency})`,
            },
          ]}
          series={[
            {
              dataKey: "hours",
              label: "Hours",
              valueFormatter: (v) => (v === null ? null : `${v?.toFixed(2)}h`),
              color: theme.palette.primary.main,
              xAxisId: "hoursAxis",
            },
            {
              dataKey: "income",
              label: "Income",
              valueFormatter: (v) => (v === null ? null : money.format(v)),
              color: theme.palette.success.main,
              xAxisId: "incomeAxis",
            },
          ]}
        />
      )}
    </Box>
  );
}

export default Monthly;
