import {
  AppBar,
  Box,
  Button,
  GlobalStyles,
  IconButton,
  styled,
  SwipeableDrawer,
  Toolbar,
  Typography,
} from "@mui/material";
import useClients from "../hooks/useClients";
import { useState, type Ref } from "react";
import type { Client } from "../modules/clients";
import ClientForm from "./ClientForm";
import { Add, Password, Settings } from "@mui/icons-material";
import Card from "./Card";
import { grey } from "@mui/material/colors";

function Editor() {
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

const drawerBleeding = 60;
const Puller = styled("div")(() => ({
  width: 30,
  height: 6,
  position: "absolute",
  top: 8,
  left: "calc(50% - 15px)",
  backgroundColor: grey[500],
  borderRadius: 3,
  cursor: "pointer",
}));

function ClientEditor({
  isOpen,
  setIsOpen,
  ref,
  container,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  ref: Ref<HTMLDivElement>;
  container: () => Element | null;
}) {
  return (
    <>
      <GlobalStyles
        styles={{
          ".MuiDrawer-root > .MuiPaper-root": {
            height: `calc(50% - ${drawerBleeding}px)`,
            overflow: "visible",
          },
        }}
      />
      <Box onClick={() => isOpen || setIsOpen(true)}>
        <SwipeableDrawer
          container={container}
          anchor="bottom"
          open={isOpen}
          onClose={() => setIsOpen(false)}
          onOpen={() => setIsOpen(true)}
          swipeAreaWidth={drawerBleeding}
          disableSwipeToOpen={false}
          keepMounted
        >
          <AppBar
            sx={{
              position: "absolute",
              top: -drawerBleeding,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              visibility: "visible",
              right: 0,
              left: 0,
              height: `${drawerBleeding}px`,
              bgcolor: "primary.dark",
            }}
          >
            <Puller />
            <Box
              sx={{
                height: "100%",
                width: "100%",
                mt: 0.5,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Settings />
              <Typography>Edit clients</Typography>
            </Box>
          </AppBar>
          <Box sx={{ p: 2, height: "100%", overflow: "auto" }} ref={ref}>
            <Editor />
          </Box>
        </SwipeableDrawer>

        {/* Empty box to make sure no elements can hide behind the drawer bar */}
        <Box sx={{ height: `${drawerBleeding}px` }} />
      </Box>
    </>
  );
}

export default ClientEditor;
