import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { fetchBillableHours, normalizeHourlyRate } from '../modules/util';
import type { TrackerName } from '../../../modules/trackers';
import useSettings from '../../../hooks/useSettings';
import type { ClientName } from '../../../modules/clients';
import {
  getActualValues,
  getExpectedValues,
  type ActualValues,
  type ExpectedValues,
} from '../modules/client-computations';

export type DashboardErrorType = {
  tracker?: TrackerName;
  clientName?: string;
  message: string;
};

export type ClientStatistics = {
  name: ClientName;
  hourlyRate: number;
};
export type ClientStatisticsLoaded = ClientStatistics & {
  billableHours: number;
};

type DashboardState = {
  clientStats:
    | {
        isLoading: true;
        clients: ClientStatistics[];
      }
    | {
        isLoading: false;
        clients: ClientStatisticsLoaded[];
      };
  overallStats: {
    expected: ExpectedValues;
    actual?: ActualValues;
  };
  error: DashboardErrorType | undefined;
  handleError: {
    throw: (error: unknown) => void;
    reset: () => void;
  };
};

const DashboardStateContext = createContext<DashboardState | null>(null);

export function DashboardStateProvider({ children }: PropsWithChildren) {
  const settings = useSettings();
  const [startDate, endDate] = settings.dateRange;

  const [error, setError] = useState<DashboardErrorType | undefined>(undefined);
  const [clientStats, setClientStats] = useState<DashboardState['clientStats']>(
    {
      isLoading: true,
      clients: [],
    },
  );

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
    const clients = settings.clients.filter((c) => !c.isHidden);
    const controller = new AbortController();
    let timeoutId: number;

    new Promise((resolve) => {
      // Small buffer timeout to prevent making and aborting a bunch of network calls during rapid changes
      timeoutId = setTimeout(resolve, 1000);
    })
      // First pass simply converting currency
      .then(() =>
        Promise.all(
          clients.map((c) => normalizeHourlyRate(c, settings.money.currency)),
        ),
      )
      .then((hourlyRates) =>
        setClientStats({
          isLoading: true,
          clients: clients.map((client, idx) => ({
            name: client.name,
            hourlyRate: hourlyRates[idx],
          })),
        }),
      )
      // Then actually process the outputs for billableHours
      .then(() =>
        Promise.all(
          clients.map((c) =>
            fetchBillableHours(
              c,
              settings.dateRange[0],
              settings.dateRange[1],
              controller.signal,
            ),
          ),
        ),
      )
      .catch((err) => {
        controller.abort();
        handleError.throw(err);
        throw err;
      })
      .then((billableHours) => {
        handleError.reset();
        setClientStats((clientStats) => ({
          isLoading: false,
          clients: clientStats.clients.map((stats, idx) => ({
            ...stats,
            billableHours: billableHours[idx],
          })),
        }));
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [handleError, settings.clients, settings.dateRange, settings.money]);

  const expected = getExpectedValues(
    startDate,
    endDate,
    clientStats.clients,
    settings.money.format,
  );
  const actual = clientStats.isLoading
    ? undefined
    : getActualValues(clientStats.clients, expected, settings.money.format);

  return (
    <DashboardStateContext.Provider
      value={{
        clientStats,
        overallStats: { expected, actual },
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
