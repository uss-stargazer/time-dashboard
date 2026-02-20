import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  AppBar,
  Box,
  Button,
  createTheme,
  IconButton,
  ThemeProvider,
  Toolbar,
  Typography,
} from "@mui/material";
import ClientForm from "./components/ClientForm";
import useClients, { ClientProvider } from "./hooks/useClients";
import type { Client } from "./modules/clients";
import { useState } from "react";
import { Add, Dashboard, ExpandMore, Settings } from "@mui/icons-material";

function ClientEditor() {
  const clientData = useClients();
  const [stagedClient, setStagedClient] = useState<Partial<Client> | null>(
    null,
  );
  if (clientData.isLoading) return <Button loading variant="outlined" />;

  const clientNames = clientData.clients.map((c) => c.name);
  const addClient = (client: Client) => {
    if (clientNames.includes(client.name))
      throw new Error("Add client: client name must be unique");
    clientData.setClients([...clientData.clients, client]);
  };
  const updateClient = (ogName: string, updated: Client) => {
    if (ogName !== updateClient.name && clientNames.includes(updateClient.name))
      throw new Error("Update client: new client name must be unique");
    clientData.setClients([
      ...clientData.clients.filter((c) => c.name !== ogName),
      updated,
    ]);
  };

  return (
    <Box>
      {[
        ...clientData.clients.map((client) => (
          <ClientForm
            key={client.name}
            client={client}
            invalidNames={clientNames.filter((c) => c !== client.name)}
            onSubmit={(updated) => updateClient(client.name, updated)}
          />
        )),
        stagedClient ? (
          <ClientForm
            key="staged"
            client={stagedClient}
            invalidNames={clientNames}
            onSubmit={(client) => {
              addClient(client);
              setStagedClient(null);
            }}
          />
        ) : (
          <IconButton onClick={() => setStagedClient({})}>
            <Add />
          </IconButton>
        ),
      ]}
    </Box>
  );
}

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#ef6c00",
    },
    secondary: {
      main: "#42a5f5",
    },
  },
  typography: { fontFamily: "'Fira Mono', monospace" },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <ClientProvider>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Box>
            <AppBar position="static">
              <Toolbar>
                <Typography color="primary">Time Dashboard</Typography>
              </Toolbar>
            </AppBar>
          </Box>

          <Box
            sx={{
              flexGrow: 1,
              p: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <Dashboard />

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" gap="1rem">
                  <Settings />
                  <Typography component="span">Edit clients</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <ClientEditor />
              </AccordionDetails>
            </Accordion>
          </Box>
        </Box>
      </ClientProvider>
    </ThemeProvider>
  );
}

export default App;
