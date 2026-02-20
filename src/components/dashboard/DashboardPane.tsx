import { Box, Typography, type BoxProps } from "@mui/material";
import Card from "../Card";
import type { TrackerName } from "../../modules/trackers";
import { createContext, useContext, useState } from "react";
import { Error as ErrorIcon } from "@mui/icons-material";
import trackers from "../../modules/trackers";

export type DashboardError = {
  tracker?: TrackerName;
  clientName?: string;
  message: string;
};
export type ThrowDashboardError = {
  throw: (error: unknown) => void;
  reset: () => void;
};
const DashboardErrorContext = createContext<ThrowDashboardError | null>(null);
export const useDashboardError = (): ThrowDashboardError =>
  useContext(DashboardErrorContext) ??
  (() => {
    throw new Error("useDashboardError must be within child of DashboardPane");
  })();

function DashboardPane({ children, ...props }: BoxProps) {
  const [error, setError] = useState<DashboardError | undefined>(undefined);

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
      <DashboardErrorContext.Provider
        value={{
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
          {children}
        </Box>
      </DashboardErrorContext.Provider>

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

export default DashboardPane;
