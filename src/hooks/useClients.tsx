import z from "zod";
import { ClientSchema, type Client } from "../modules/clients";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { ErrorBoundary } from "react-error-boundary";

const ClientArraySchema = z.array(ClientSchema);

type ClientContextType = {
  isLoading: boolean;
  clients: Client[];
  setClients: (updated: Client[]) => void;
};
const ClientContext = createContext<ClientContextType | null>(null);

type ClientProviderProps = PropsWithChildren<{
  storageKey: string;
  defaultClients: Client[];
}>;

function ClientProviderNoCatch({
  children,
  storageKey,
  defaultClients,
}: ClientProviderProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [clients, setClients] = useState<Client[]>(defaultClients);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw !== null) {
      const clients = ClientArraySchema.parse(JSON.parse(raw));
      if (new Set(clients.map((c) => c.name)).size !== clients.length)
        throw new Error("Invalid stored clients: has duplicate client names");
      setClients(clients);
    }
    setIsLoading(false);
  }, []);

  const clientsObj: ClientContextType = {
    isLoading,
    clients,
    setClients(updated) {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setClients(updated);
    },
  };

  return (
    <ClientContext.Provider value={clientsObj}>
      {children}
    </ClientContext.Provider>
  );
}

export const ClientProvider = ({
  children,
  storageKey = "clients",
  defaultClients = [],
}: Partial<ClientProviderProps>) => (
  <ErrorBoundary
    FallbackComponent={({ error, resetErrorBoundary }) => (
      <>
        <h4>
          Data stored locally is broken! Either fix it or{" "}
          <a
            onClick={() => {
              localStorage.removeItem(storageKey);
              resetErrorBoundary();
            }}
          >
            reset localStorage
          </a>
          .
        </h4>
        {error instanceof Error && <span>{error.message}</span>}
      </>
    )}
  >
    <ClientProviderNoCatch
      storageKey={storageKey}
      defaultClients={defaultClients}
    >
      {children}
    </ClientProviderNoCatch>
  </ErrorBoundary>
);

const useClients = (): ClientContextType => {
  const clients = useContext(ClientContext);
  if (!clients)
    throw new Error("useClients must be used with ClientProvider as parent");
  return clients;
};

export default useClients;
