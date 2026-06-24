import { Box, Button, useTheme } from '@mui/material';
import { BarChart } from '@mui/x-charts';
import useDashboardState from '../hooks/useDashboardState';
import useSettings from '../../../hooks/useSettings';

function Monthly() {
  const theme = useTheme();
  const settings = useSettings();
  const state = useDashboardState();

  const data: { name: string; hours: number; income: number }[] =
    state.clientOutputs
      .filter((c) => c.billableHours != undefined)
      .map((c) => ({
        ...c,
        hours: c.billableHours || 0,
        income: (c.billableHours || 0) * c.hourlyRate,
      }));

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      {state.error ? (
        <Button loading />
      ) : (
        <BarChart
          width={300}
          height={100 + 120 * data.length}
          sx={{ bgcolor: 'background.paper' }}
          layout='horizontal'
          dataset={data}
          yAxis={[
            {
              dataKey: 'name',
              tickLabelStyle: {
                angle: -90,
                textAnchor: 'middle',
              },
            },
          ]}
          xAxis={[
            {
              id: 'hoursAxis',
              dataKey: 'hours',
              position: 'top',
              label: 'Hours',
            },
            {
              id: 'incomeAxis',
              dataKey: 'income',
              position: 'bottom',
              label: `Money (${settings.money.currency})`,
            },
          ]}
          series={[
            {
              dataKey: 'hours',
              label: 'Hours',
              valueFormatter: (v) => (v === null ? null : `${v?.toFixed(2)}h`),
              color: theme.palette.primary.main,
              xAxisId: 'hoursAxis',
            },
            {
              dataKey: 'income',
              label: 'Income',
              valueFormatter: (v) =>
                v === null ? null : settings.money.format(v),
              color: theme.palette.success.main,
              xAxisId: 'incomeAxis',
            },
          ]}
        />
      )}
    </Box>
  );
}

export default Monthly;
