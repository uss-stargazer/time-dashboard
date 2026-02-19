import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  IconButton,
  Typography,
} from "@mui/material";
import ClientForm from "./components/ClientForm";
import useClients, { ClientProvider } from "./hooks/useClients";
import type { Client } from "./modules/clients";
import { useState } from "react";
import { Add, ExpandMore } from "@mui/icons-material";

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

/**
 * Dashboard features:
 * - Expected vs actual over time period
 *    - Calculate expected at average of all rates, min, and max
 *
 * @todo Time distribution graph accross clients (top n)
 */
function Dashboard() {
  return <div></div>;
}

function App() {
  return (
    <ClientProvider>
      <Typography variant="h2">
        Time, Dr. Freeman? Is it really that... time again?
      </Typography>

      <Dashboard />

      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls="panel1-content"
          id="panel1-header"
        >
          <Typography component="span">Edit clients</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <ClientEditor />
        </AccordionDetails>
      </Accordion>
    </ClientProvider>
  );
}

export default App;
