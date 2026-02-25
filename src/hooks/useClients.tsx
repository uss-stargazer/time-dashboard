import z, { ZodError } from "zod";
import { ClientSchema, type Client } from "../modules/clients";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { Box, Button, Typography } from "@mui/material";
import trackers from "../modules/trackers";

const ClientArraySchema = z.array(ClientSchema);

type ClientContextType = {
  isLoading: boolean;
  clients: Client[];
  setClients: (updated: Client[]) => void;
};
const ClientContext = createContext<ClientContextType | null>(null);

export function ClientProvider({
  children,
  storageKey = "clients",
  defaultClients = [],
}: PropsWithChildren<
  Partial<{
    storageKey: string;
    defaultClients: Client[];
  }>
>) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState<boolean>(false);
  const [clients, setClients] = useState<Client[]>(defaultClients);

  const loadData = () => {
    setError(null);
    setIsLoading(true);
    new Promise<void>((resolve) => {
      const raw = localStorage.getItem(storageKey);
      if (raw !== null) {
        try {
          const clients = ClientArraySchema.parse(JSON.parse(raw));
          if (new Set(clients.map((c) => c.name)).size !== clients.length)
            throw new SyntaxError(
              "Invalid stored clients: has duplicate client names",
            );

          Promise.all(
            clients.map((client) =>
              (async () => {
                const tracker = trackers[client.tracker.name];
                if (tracker.computed)
                  client.tracker.computed = await tracker.computed.compute(
                    client.name,
                    // @ts-expect-error TODO: better way. Like I said elsewhere, I'm tired trying to get ts to mesh
                    client.tracker.data,
                  );
                return client;
              })(),
            ),
          )
            .catch((error) => {
              setError(
                error instanceof Error ? error.message : JSON.stringify(error),
              );
              return undefined;
            })
            .then((clients) => {
              if (clients) {
                setClients(clients);
                setError(null);
              }
            });
        } catch (error) {
          if (error instanceof ZodError) {
            setError(z.prettifyError(error));
          } else if (error instanceof SyntaxError) {
            setError(error.message);
          } else throw error;
        }
      }
      resolve();
    }).finally(() => setIsLoading(false));
  };

  useEffect(loadData, []);

  return error ? (
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
      <Typography>Data stored locally is broken! :[</Typography>
      <Button
        variant="outlined"
        color="warning"
        onClick={() => {
          localStorage.removeItem(storageKey);
          loadData();
        }}
      >
        Reset local storage
      </Button>

      <Button
        size="small"
        color="error"
        onClick={() => setShowError(!showError)}
      >
        {showError ? "Hide" : "Show"} error
      </Button>
      {showError && (
        <Typography variant="caption" align="center" maxWidth="75%">
          {error}
        </Typography>
      )}
    </Box>
  ) : (
    <ClientContext.Provider
      value={{
        isLoading,
        clients,
        setClients(updated) {
          localStorage.setItem(storageKey, JSON.stringify(updated));
          setClients(updated);
        },
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

const useClients = (): ClientContextType => {
  const clients = useContext(ClientContext);
  if (!clients)
    throw new Error("useClients must be used with ClientProvider as parent");
  return clients;
};

export default useClients;
