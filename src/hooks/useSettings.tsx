import z, { ZodError } from 'zod';
import { ClientSchema, type Client } from '../modules/clients';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { Box, Button, Typography } from '@mui/material';
import trackers from '../modules/trackers';
import SettingsEditor from '../components/SettingEditor';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { Currency } from '../modules/currencies';

const ClientArraySchema = z.array(ClientSchema);

// Ordered table of relative date-range presets. The first entry is the boot
// default. Each resolves against "now" when read, so relative ranges never go
// stale; only 'Custom' (kept out of this table) carries a stored tuple.
export const dateRangePresets = [
  { key: 'Week to Date', resolve: () => [dayjs().startOf('week'), dayjs()] },
  { key: 'Last 30 Days', resolve: () => [dayjs().subtract(30, 'days'), dayjs()] },
  { key: 'Month to Date', resolve: () => [dayjs().startOf('month'), dayjs()] },
  { key: 'Year to Date', resolve: () => [dayjs().startOf('year'), dayjs()] },
  {
    key: 'This Week',
    resolve: () => [dayjs().startOf('week'), dayjs().endOf('week')],
  },
  {
    key: 'This Month',
    resolve: () => [dayjs().startOf('month'), dayjs().endOf('month')],
  },
  {
    key: 'This Year',
    resolve: () => [dayjs().startOf('year'), dayjs().endOf('year')],
  },
] as const satisfies { key: string; resolve: () => [Dayjs, Dayjs] }[];

type RelativePreset = (typeof dateRangePresets)[number]['key'];

export type DateSelection =
  | { preset: RelativePreset }
  | { preset: 'Custom'; range: [Dayjs, Dayjs] };

const presetByKey = Object.fromEntries(
  dateRangePresets.map((p) => [p.key, p]),
) as Record<RelativePreset, (typeof dateRangePresets)[number]>;

type SettingsContextType = {
  isLoading: boolean;
  clients: Client[];
  selection: DateSelection;
  dateRange: [Dayjs, Dayjs];
  money: {
    currency: Currency;
    format: (amount: number) => string;
  };
  setClients: (updated: Client[]) => void;
  setSelection: (updated: DateSelection) => void;
  setCurrency: (updated: Currency) => void;
};
const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({
  children,
  storageKey = 'clients',
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
  const [selection, setSelection] = useState<DateSelection>({
    preset: dateRangePresets[0].key,
  });
  // Derive the concrete range from the selection, memoized on `selection` so the
  // reference is stable across renders (the dashboard fetch effect keys on it).
  // Relative presets re-resolve only when the selection changes — never every
  // render, which would thrash the fetch.
  const dateRange = useMemo<[Dayjs, Dayjs]>(
    () =>
      selection.preset === 'Custom'
        ? selection.range
        : presetByKey[selection.preset].resolve(),
    [selection],
  );
  const [currency, setCurrency] = useState<Currency>('USD');

  // TODO: load startDate and endDate from local storage
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
              'Invalid stored clients: has duplicate client names',
            );

          Promise.all(
            clients.map((client) =>
              (async (): Promise<{ client: Client; error?: string }> => {
                let error: string | undefined = undefined;
                const tracker = trackers[client.tracker.name];
                if (tracker.computed)
                  client.tracker.computed = await tracker.computed
                    .compute(
                      client.name,
                      // @ts-expect-error TODO: better way. Like I said elsewhere, I'm tired trying to get ts to mesh
                      client.tracker.data,
                    )
                    .catch((e) => {
                      error =
                        e instanceof Error ? e.message : JSON.stringify(e);
                    });
                return { client, error };
              })(),
            ),
          ).then((clients) => {
            setClients(clients.map((c) => c.client));
            setError(clients.find((c) => c.error !== undefined)?.error ?? null);
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

  useEffect(loadData, [storageKey]);

  const setClientsWStorage: SettingsContextType['setClients'] = (updated) => {
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setClients(updated);
  };

  const dashboardState = {
    isLoading,
    clients,
    selection,
    dateRange,
    money: {
      currency,
      format: new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        currencySign: 'accounting',
      }).format,
    },
    setClients: setClientsWStorage,
    setSelection,
    setCurrency,
  };

  return error ? (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Typography>Data stored locally is broken! :[</Typography>
      <Button
        variant='outlined'
        color='warning'
        onClick={() => {
          localStorage.removeItem(storageKey);
          loadData();
        }}
      >
        Reset local storage
      </Button>

      <Button
        size='small'
        color='error'
        onClick={() => setShowError(!showError)}
      >
        {showError ? 'Hide' : 'Show'} error
      </Button>
      {showError && (
        <Typography variant='caption' align='center' maxWidth='75%'>
          {error}
        </Typography>
      )}

      <SettingsContext.Provider value={dashboardState}>
        {clients.length > 0 && <SettingsEditor />}
      </SettingsContext.Provider>
    </Box>
  ) : (
    <SettingsContext.Provider value={dashboardState}>
      {children}
    </SettingsContext.Provider>
  );
}

const useSettings = (): SettingsContextType => {
  const settings = useContext(SettingsContext);
  if (!settings)
    throw new Error('useSettings must be used with SettingsProvider as parent');
  return settings;
};

export default useSettings;
