import { Box, Button, Typography, type SxProps } from "@mui/material";
import ExpectedVsActual from "./ExpectedVsActual";
import useClients from "../../hooks/useClients";
import { Info } from "@mui/icons-material";
import DashboardPane from "./DashboardPane";
import Monthly from "./Monthly";

/**
 * @todo Time distribution graph accross clients (top n)
 */
function Dashboard({ sx }: { sx?: SxProps }) {
  const { clients, isLoading } = useClients();

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
              Add a client to view your time dashboard.
            </Typography>
          </>
        )}
      </Box>
    );

  return (
    <Box sx={sx}>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          gap: 3,
        }}
      >
        {[<ExpectedVsActual />, <Monthly />].map((pane) => (
          <DashboardPane>{pane}</DashboardPane>
        ))}
      </Box>
    </Box>
  );
}

export default Dashboard;
