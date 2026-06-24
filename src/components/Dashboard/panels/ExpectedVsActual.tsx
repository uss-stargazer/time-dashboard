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
import {
  getActualValues,
  getExpectedValues,
} from '../modules/client-computations';
import useSettings from '../../../hooks/useSettings';
import useDashboardState from '../hooks/useDashboardState';

function ExpectedVsActual() {
  const settings = useSettings();
  const state = useDashboardState();
  const [startDate, endDate] = settings.dateRange;

  const expected = getExpectedValues(
    startDate,
    endDate,
    state.clientStats.clients,
    settings.money.format,
  );
  const actual = state.clientStats.isLoading
    ? 'loading'
    : getActualValues(
        state.clientStats.clients,
        expected,
        settings.money.format,
      );

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

                {state.clientStats.clients.length === 1 ? (
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
                {state.clientStats.clients.length === 1 ? (
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
