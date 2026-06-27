import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  fetchClientSegments,
  normalizeRates,
  type RateSegment,
} from '../modules/util';
import type { TrackerName } from '../../../modules/trackers';
import { TrackerError } from '../../../modules/trackers/definitions';
import useSettings from '../../../hooks/useSettings';
import type { ClientName, Rate } from '../../../modules/clients';
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
  // Present when the error is rate limiting; the dashboard auto-retries after
  // this delay and the UI shows a distinct "rate limited" message.
  retryAfterMs?: number;
};

export type ClientStatistics = {
  name: ClientName;
  // Rate schedule, already converted to the display currency.
  rates: Rate[];
};
export type ClientStatisticsLoaded = ClientStatistics & {
  billableHours: number;
  segments: RateSegment[];
  // Income reduced once here (Σ segment.hours × segment.rate) so panels and
  // the overall totals read it rather than re-multiplying.
  income: number;
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
  // Bumped to re-run the fetch effect when a rate-limit cooldown elapses.
  const [retryNonce, setRetryNonce] = useState(0);
  const retryTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const clients = settings.clients.filter((c) => !c.isHidden);
    const controller = new AbortController();

    // First pass: convert each client's rate schedule to the display currency.
    let normalizedRates: Rate[][] = [];
    Promise.all(
      clients.map((c) => normalizeRates(c, settings.money.currency)),
    )
      .then((rates) => {
        normalizedRates = rates;
        setClientStats({
          isLoading: true,
          clients: clients.map((client, idx) => ({
            name: client.name,
            rates: rates[idx],
          })),
        });
      })
      // Then fetch billable hours per rate period and pair them with rates.
      .then(() =>
        Promise.all(
          clients.map((c, idx) =>
            fetchClientSegments(
              c,
              normalizedRates[idx],
              settings.dateRange[0],
              settings.dateRange[1],
              controller.signal,
            ),
          ),
        ),
      )
      .then((segmentsPerClient) => {
        setError(undefined);
        setClientStats((clientStats) => ({
          isLoading: false,
          clients: clientStats.clients.map((stats, idx) => {
            const segments = segmentsPerClient[idx];
            return {
              ...stats,
              segments,
              billableHours: segments.reduce((sum, s) => sum + s.hours, 0),
              income: segments.reduce((sum, s) => sum + s.hours * s.rate, 0),
            };
          }),
        }));
      })
      .catch((err) => {
        controller.abort();
        const retryAfterMs =
          err instanceof TrackerError ? err.retryAfterMs : undefined;
        if (retryAfterMs !== undefined) {
          setError({
            tracker: err.tracker,
            message: 'Rate limited — auto-retrying shortly.',
            retryAfterMs,
          });
          // Self-heal once the cooldown passes. If still rate limited, the
          // re-run trips the breaker again and reschedules (a cheap probe per
          // cooldown, since an open breaker rejects without touching the API).
          retryTimeout.current = setTimeout(
            () => setRetryNonce((n) => n + 1),
            retryAfterMs,
          );
        } else {
          setError(
            err instanceof Error
              ? { ...err, message: err.message }
              : {
                message: JSON.stringify(err),
              },
          );
        }
        console.error(err);
      })

    return () => {
      clearTimeout(retryTimeout.current);
      controller.abort();
    };
  }, [settings.clients, settings.dateRange, settings.money, retryNonce]);

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
