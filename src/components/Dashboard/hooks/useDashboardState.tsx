import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  fetchBillableHours,
  parseClients,
  type ClientOutput,
} from '../modules/util';
import type { Currency } from '../../../modules/currencies';
import type { TrackerName } from '../../../modules/trackers';
import useSettings from '../../../hooks/useSettings';

export type Money = {
  currency: Currency;
  format: (amount: number) => string;
};

export type DashboardErrorType = {
  tracker?: TrackerName;
  clientName?: string;
  message: string;
};

type DashboardState = {
  clientOutputs: ClientOutput[];
  money: Money;
  error: DashboardErrorType | undefined;
  handleError: {
    throw: (error: unknown) => void;
    reset: () => void;
  };
};

const DashboardStateContext = createContext<DashboardState | null>(null);

export function DashboardStateProvider({
  universalCurrency,
  moneyFormatter,
  children,
}: PropsWithChildren<{
  universalCurrency: Currency;
  moneyFormatter: Intl.NumberFormat;
}>) {
  const settings = useSettings();

  const [clientOutputs, setClientOutputs] = useState<ClientOutput[]>([]);
  const [error, setError] = useState<DashboardErrorType | undefined>(undefined);

  const handleError = useMemo(
    () => ({
      throw: (error: unknown) =>
        setError(
          error instanceof Error
            ? { ...error, message: error.message }
            : {
                message: JSON.stringify(error),
              },
        ),
      reset: () => setError(undefined),
    }),
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    let timeoutId: number;

    new Promise((resolve) => {
      // Small buffer timeout to prevent making and aborting a bunch of network calls during rapid changes
      timeoutId = setTimeout(resolve, 1000);
    })
      // First pass simply parsing stuff
      .then(() => parseClients(settings.clients, universalCurrency))
      .then((unfetchedOutputs) => {
        setClientOutputs(unfetchedOutputs);
        return unfetchedOutputs;
      })
      // Then actually process the outputs for billableHours
      .then((outputs) =>
        fetchBillableHours(
          settings.dateRange[0],
          settings.dateRange[1],
          settings.clients,
          outputs,
          controller.signal,
        ),
      )
      .catch((err) => {
        controller.abort();
        handleError.throw(err);
        throw err;
      })
      .then((outputs) => {
        handleError.reset();
        setClientOutputs(outputs);
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [settings.clients, settings.dateRange, handleError, universalCurrency]);

  return (
    <DashboardStateContext.Provider
      value={{
        clientOutputs,
        money: { currency: universalCurrency, format: moneyFormatter.format },
        error,
        handleError,
      }}
    >
      {children}
    </DashboardStateContext.Provider>
  );
}

function useDashboardState() {
  const state = useContext(DashboardStateContext);
  if (!state)
    throw new Error(
      'useDashboardState needs to be called in child of DashboardStateProvider',
    );
  return state;
}

export default useDashboardState;
