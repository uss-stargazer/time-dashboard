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
import useDashboardState from '../hooks/useDashboardState';

function Overview() {
  const state = useDashboardState();
  const { expected, actual } = state.overallStats;

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
                    {!actual && <CircularProgress size={12} />}
                    {actual && actual.hours.overUnder.display}
                  </TableCell>
                </TableRow>

                {state.clientStats.clients.length === 1 ? (
                  <TableRow>
                    <TableCell>Income</TableCell>

                    <TableCell align='right'>
                      {!actual && <CircularProgress size={12} />}
                      {actual && actual.income.overUnder.avg.display}
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    <TableRow>
                      <TableCell>Income (min)</TableCell>

                      <TableCell align='right'>
                        {!actual && <CircularProgress size={12} />}
                        {actual && actual.income.overUnder.min.display}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Income (avg)</TableCell>

                      <TableCell align='right'>
                        {!actual && <CircularProgress size={12} />}
                        {actual && actual.income.overUnder.avg.display}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Income (max)</TableCell>

                      <TableCell align='right'>
                        {!actual && <CircularProgress size={12} />}
                        {actual && actual.income.overUnder.max.display}
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
                    {!actual && <CircularProgress size={12} />}
                    {actual && actual.hours.display}
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
                    {!actual && <CircularProgress size={12} />}
                    {actual && actual.income.display}
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

export default Overview;
