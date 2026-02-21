import {
  Box,
  Button,
  Typography,
  type BoxProps,
  type SxProps,
} from "@mui/material";
import ExpectedVsActual from "./panels/ExpectedVsActual";
import useClients from "../../hooks/useClients";
import { Error as ErrorIcon, Info } from "@mui/icons-material";
import Monthly from "./panels/Monthly";
import React, { useState } from "react";
import type {
  DashboardData,
  DashboardErrorType,
  DashboardPanelProps,
} from "./modules/definitions";
import trackers from "../../modules/trackers";
import type { Client } from "../../modules/clients";
import Card from "../Card";

function DashboardPanel({
  data,
  Panel,
  ...props
}: Omit<BoxProps, "children"> & {
  data: DashboardData;
  Panel: React.FC<DashboardPanelProps>;
}) {
  const [error, setError] = useState<DashboardErrorType | undefined>(undefined);

  return (
    <Card
      sx={{
        borderColor: "primary.main",
        maxWidth: undefined,
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      <Box
        {...props}
        sx={{
          display: "flex",
          flexDirection: {
            xs: "column",
            sm: "column",
            md: "row",
          },
          justifyContent: "center",
          alignItems: "center",
          gap: 1,
          ...props.sx,
        }}
      >
        <Panel
          data={data}
          error={{
            throw: (error) =>
              setError(
                error instanceof Error
                  ? { ...error, message: error.message }
                  : {
                      message: JSON.stringify(error),
                    },
              ),
            reset: () => setError(undefined),
          }}
        />
      </Box>

      {error && (
        <Card sx={{ maxWidth: undefined, borderColor: "error.main" }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <ErrorIcon color="error" fontSize="small" />
            <Typography color="error.main" variant="caption">
              {error.tracker
                ? `${trackers[error.tracker].prettyName} tracker didn't like client${error.clientName ? ` '${error.clientName}'` : ""}`
                : "Some error"}
            </Typography>
          </Box>
          <Typography variant="caption" m={1}>
            {error.message}
          </Typography>
        </Card>
      )}
    </Card>
  );
}

const dashboardPanelComponents: React.FC<DashboardPanelProps>[] = [
  ExpectedVsActual,
  Monthly,
];

function Dashboard({ sx }: { sx?: SxProps }) {
  const { clients: allClients, isLoading } = useClients();
  const clients = allClients.filter((client) => !client.isHidden);

  if (isLoading || clients.length === 0)
    return (
      <Box
        sx={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 1,
          ...sx,
        }}
      >
        {isLoading ? (
          <Button loading />
        ) : (
          <>
            <Info />
            <Typography textAlign="center">
              Add a non-hidden client to view your time dashboard.
            </Typography>
          </>
        )}
      </Box>
    );

  const data: DashboardData = {
    clients: clients as [Client, ...Client[]], // clients.length must be greater than zero
    rate: clients[0].hourlyRate.amount,
  };
  if (clients.length > 1) {
    const rates = clients.map((c) => c.hourlyRate.amount);
    data.rate = {
      avg: rates.reduce((sum, v) => sum + v, 0) / rates.length,
      min: Math.min(...rates),
      max: Math.max(...rates),
    };
  }

  return (
    <Box sx={sx}>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          gap: 3,
          justifyContent: { xs: "center", sm: "center", md: "flex-start" },
        }}
      >
        {dashboardPanelComponents.map((Panel) => (
          <DashboardPanel Panel={Panel} data={data} />
        ))}
      </Box>
    </Box>
  );
}

export default Dashboard;
