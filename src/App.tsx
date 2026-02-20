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
import { useRef, useState } from "react";
import { Add, ExpandMore, Settings } from "@mui/icons-material";
import Card from "./components/Card";
import Dashboard from "./components/Dashboard";
import { ErrorBoundary } from "react-error-boundary";

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
  const removeClient = (clientName: string) => {
    if (clientData.clients.some((c) => c.name === clientName))
      clientData.setClients(
        clientData.clients.filter((c) => c.name !== clientName),
      );
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
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      {[
        ...clientData.clients.map((client) => (
          <ClientForm
            key={client.name}
            client={client}
            invalidNames={clientNames.filter((c) => c !== client.name)}
            submitText="Update"
            onSubmit={(updated) => updateClient(client.name, updated)}
            otherButtons={[
              { label: "Remove", onClick: () => removeClient(client.name) },
            ]}
          />
        )),
        stagedClient ? (
          <ClientForm
            key="staged"
            client={stagedClient}
            invalidNames={clientNames}
            submitText="Add"
            onSubmit={(client) => {
              addClient(client);
              setStagedClient(null);
            }}
            otherButtons={[
              { label: "Cancel", onClick: () => setStagedClient(null) },
            ]}
          />
        ) : (
          <Card fullWidth sx={{ display: "flex" }}>
            <Button sx={{ flexGrow: 1 }} onClick={() => setStagedClient({})}>
              <Add />
            </Button>
          </Card>
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

function ErrorFallback({ error }: { error: unknown }) {
  const [showError, setShowError] = useState<boolean>(false);
  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Typography variant="h4" color="warning">
        :[
      </Typography>
      <Typography align="center" maxWidth="50%">
        The right code in the wrong place can make all the difference in the
        world...
      </Typography>

      <Button
        size="small"
        color="error"
        onClick={() => setShowError(!showError)}
      >
        {showError ? "Hide" : "Show"} error
      </Button>
      {showError && (
        <Typography variant="caption" align="center" maxWidth="75%">
          {error instanceof Error
            ? error.message
            : JSON.stringify(error, undefined, "  ")}
        </Typography>
      )}
    </Box>
  );
}

function App() {
  const editClientsRef = useRef<HTMLDivElement | null>(null);
  const [editClientsExpanded, setEditClientsExpanded] =
    useState<boolean>(false);
  const scrollToEditClients = () => {
    if (editClientsRef.current) {
      setEditClientsExpanded(true);
      editClientsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ThemeProvider theme={theme}>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Box>
            <AppBar position="static">
              <Toolbar
                sx={{ display: "flex", justifyContent: "space-between" }}
              >
                <Typography color="primary">Time Dashboard</Typography>
                <IconButton onClick={scrollToEditClients}>
                  <Settings />
                </IconButton>
              </Toolbar>
            </AppBar>
          </Box>

          <ClientProvider>
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

              <Accordion
                ref={editClientsRef}
                expanded={editClientsExpanded}
                onChange={(_, expanded) => setEditClientsExpanded(expanded)}
              >
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
          </ClientProvider>
        </Box>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
