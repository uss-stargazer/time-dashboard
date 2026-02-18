import z from "zod";
import { ClientSchema, type Client } from "../modules/clients";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";

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
  const [clients, setClients] = useState<Client[]>(defaultClients);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw !== null) setClients(ClientArraySchema.parse(JSON.parse(raw)));
    setIsLoading(false);
  });

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

const useClients = (): ClientContextType => {
  const clients = useContext(ClientContext);
  if (!clients)
    throw new Error("useClients must be used with ClientProvider as parent");
  return clients;
};

export default useClients;
