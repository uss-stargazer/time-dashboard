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
import { useRef, useState, type Ref } from "react";
import { Add, Dashboard, ExpandMore, Settings } from "@mui/icons-material";
import Card from "./components/Card";

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
    <ThemeProvider theme={theme}>
      <ClientProvider>
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
        </Box>
      </ClientProvider>
    </ThemeProvider>
  );
}

export default App;
