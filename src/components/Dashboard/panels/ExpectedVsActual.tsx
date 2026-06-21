import {
  Box,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import { Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import trackers from '../../../modules/trackers';
import type {
  ClientWithBillableHours,
  DashboardPanelProps,
  ParsedClient,
} from '../modules/definitions';
import { TrackerError } from '../../../modules/trackers/definitions';
import {
  getActualValues,
  getExpectedValues,
} from '../modules/client-computations';
import useSettings from '../../../hooks/useSettings';

type BillableHoursResult =
  | {
      loading: true;
      clients: ParsedClient[];
    }
  | {
      loading: false;
      clients: ClientWithBillableHours[];
    };

function fetchBillableHours(
  clients: ParsedClient[],
  startDate: Dayjs,
  endDate: Dayjs,
  signal: AbortSignal,
): Promise<ClientWithBillableHours[]> {
  return Promise.all(
    clients.map(async (client) => {
      const billableHours = await trackers[client.tracker.name]
        .getBillableHours(
          startDate,
          endDate,
          // @ts-expect-error TODO: find a better way. At the moment of writing, I'm done trying to get typescript to mesh with this.
          { ...client.tracker, clientName: client.name },
          signal,
        )
        .catch((error) => {
          if (error instanceof TrackerError) error.clientName = client.name;
          throw error;
        });

      return { ...client, billableHours };
    }),
  );
}

function ExpectedVsActual({
  data: initialData,
  error,
  money,
}: DashboardPanelProps) {
  const settings = useSettings();
  const [startDate, endDate] = settings.dateRange;

  const [data, setData] = useState<BillableHoursResult>({
    loading: true,
    clients: initialData.clients,
  });

  useEffect(() => {
    const controller = new AbortController();
    let timeoutId: number;

    new Promise((resolve) => {
      setData({ loading: true, clients: initialData.clients });
      resolve(undefined);
    })
      .then(
        () =>
          new Promise((resolve) => {
            // Small buffer timeout to prevent making and aborting a bunch of network calls during rapid changes
            timeoutId = setTimeout(resolve, 1000);
          }),
      )
      .then(() =>
        fetchBillableHours(
          initialData.clients,
          startDate,
          endDate,
          controller.signal,
        ),
      )
      .catch((err) => {
        controller.abort();
        error.throw(err);
        throw err;
      })
      .then((clients) => {
        error.reset();
        setData({ loading: false, clients });
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [initialData.clients, endDate, error, startDate]);

  const expected = getExpectedValues(startDate, endDate, data.clients, money);
  const actual = data.loading
    ? 'loading'
    : getActualValues(data.clients, expected, money);

  return (
    <>
      <Stack gap={2} sx={{ my: 2 }}>
        <Box>
          <Typography variant='h6'>Over/under</Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>Hours</TableCell>

                  <TableCell align='right'>
                    {actual === 'loading' && <CircularProgress size={12} />}
                    {actual !== 'loading' && actual.hours.overUnder.display}
                  </TableCell>
                </TableRow>

                {data.clients.length === 1 ? (
                  <TableRow>
                    <TableCell>Income</TableCell>

                    <TableCell align='right'>
                      {actual === 'loading' && <CircularProgress size={12} />}
                      {actual !== 'loading' &&
                        actual.income.overUnder.avg.display}
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    <TableRow>
                      <TableCell>Income (min)</TableCell>

                      <TableCell align='right'>
                        {actual === 'loading' && <CircularProgress size={12} />}
                        {actual !== 'loading' &&
                          actual.income.overUnder.min.display}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Income (avg)</TableCell>

                      <TableCell align='right'>
                        {actual === 'loading' && <CircularProgress size={12} />}
                        {actual !== 'loading' &&
                          actual.income.overUnder.avg.display}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Income (max)</TableCell>

                      <TableCell align='right'>
                        {actual === 'loading' && <CircularProgress size={12} />}
                        {actual !== 'loading' &&
                          actual.income.overUnder.max.display}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box>
          <Typography variant='h6'>Hours</Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>Expected</TableCell>

                  <TableCell align='right'>{expected.hours.display}</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>Actual</TableCell>

                  <TableCell align='right'>
                    {actual === 'loading' && <CircularProgress size={12} />}
                    {actual !== 'loading' && actual.hours.display}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box>
          <Typography variant='h6'>Income</Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableBody>
                {data.clients.length === 1 ? (
                  <TableRow>
                    <TableCell>Expected</TableCell>

                    <TableCell align='right'>
                      {expected.income.min.display}
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    <TableRow>
                      <TableCell>Expected (min)</TableCell>

                      <TableCell align='right'>
                        {expected.income.min.display}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Expected (avg)</TableCell>

                      <TableCell align='right'>
                        {expected.income.avg.display}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Expected (max)</TableCell>

                      <TableCell align='right'>
                        {expected.income.max.display}
                      </TableCell>
                    </TableRow>
                  </>
                )}

                <TableRow>
                  <TableCell>Actual</TableCell>

                  <TableCell align='right'>
                    {actual === 'loading' && <CircularProgress size={12} />}
                    {actual !== 'loading' && actual.income.display}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Stack>
    </>
  );
}

export default ExpectedVsActual;
