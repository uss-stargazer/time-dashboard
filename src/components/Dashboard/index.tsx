import { Box, Button, Typography } from "@mui/material";
import ExpectedVsActual from "./ExpectedVsActual";
import useClients from "../../hooks/useClients";
import { Info } from "@mui/icons-material";
import DashboardPane from "./DashboardPane";

/**
 * @todo Time distribution graph accross clients (top n)
 */
function Dashboard() {
  const { clients, isLoading } = useClients();

  return (
    <Box
      sx={{
        minHeight: "10rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 1,
      }}
    >
      {isLoading ? (
        <Button loading />
      ) : clients.length === 0 ? (
        <>
          <Info />
          <Typography textAlign="center">
            Add a client to view your time dashboard.
          </Typography>
        </>
      ) : (
        <>
          {[<ExpectedVsActual />].map((pane) => (
            <DashboardPane>{pane}</DashboardPane>
          ))}
        </>
      )}
    </Box>
  );
}

export default Dashboard;
