import { Box, Button, Typography } from "@mui/material";
import ExpectedVsActual from "./ExpectedVsActual";
import useClients from "../../hooks/useClients";
import { Info } from "@mui/icons-material";
import Card from "../Card";

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
          {[<ExpectedVsActual />].map((el, idx) => (
            <Card
              key={idx}
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
                border: "1px solid",
                borderColor: "primary.main",
                maxWidth: undefined,
              }}
            >
              {el}
            </Card>
          ))}
        </>
      )}
    </Box>
  );
}

export default Dashboard;
