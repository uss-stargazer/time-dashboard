import {
  Box,
  Button,
  Typography,
  type BoxProps,
  type SxProps,
} from '@mui/material';
import useSettings from '../../hooks/useSettings';
import { Error as ErrorIcon, Info } from '@mui/icons-material';
import { type ReactElement } from 'react';
import trackers from '../../modules/trackers';
import Card from '../Card';
import useDashboardState, {
  DashboardStateProvider,
} from './hooks/useDashboardState';
import Comparison from './panels/Comparison';
import Overview from './panels/Overview';
import DateRangeInput from './components/DateRangeInput';

function DashboardPanel({
  name,
  children,
  ...props
}: BoxProps & {
  name: string;
}) {
  const { error } = useDashboardState();
  return (
    <Card
      label={name}
      sx={{
        borderColor: 'primary.main',
        maxWidth: undefined,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Box
        {...props}
        sx={{
          display: 'flex',
          flexDirection: {
            xs: 'column',
            sm: 'column',
            md: 'row',
          },
          justifyContent: 'center',
          alignItems: 'center',
          gap: 1,
          ...props.sx,
        }}
      >
        {children}
      </Box>

      {error && (
        <Card sx={{ maxWidth: undefined, borderColor: 'error.main' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ErrorIcon color='error' fontSize='small' />
            <Typography color='error.main' variant='caption'>
              {error.retryAfterMs !== undefined
                ? `${error.tracker ? `${trackers[error.tracker].prettyName} API` : 'API'} rate limit reached`
                : error.tracker
                  ? `${trackers[error.tracker].prettyName} tracker didn't like client${error.clientName ? ` '${error.clientName}'` : ''}`
                  : 'Some error'}
            </Typography>
          </Box>
          <Typography variant='caption' m={1}>
            {error.message}
          </Typography>
        </Card>
      )}
    </Card>
  );
}

const dashboardPanelComponents: {
  name: string;
  el: ReactElement;
}[] = [
  { name: 'Overview', el: <Overview /> },
  { name: 'Comparison', el: <Comparison /> },
];

function Dashboard({ sx }: { sx?: SxProps }) {
  const settings = useSettings();

  if (settings.isLoading || settings.clients.length === 0)
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 1,
          ...sx,
        }}
      >
        {settings.isLoading ? (
          <Button loading />
        ) : (
          <>
            <Info />
            <Typography textAlign='center'>
              Add a non-hidden client to view your time dashboard.
            </Typography>
          </>
        )}
      </Box>
    );

  return (
    <DashboardStateProvider>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          ...sx,
        }}
      >
        <DateRangeInput />

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            gap: 3,
            justifyContent: { xs: 'center', sm: 'center', md: 'flex-start' },
          }}
        >
          {dashboardPanelComponents.map(({ name, el }) => (
            <DashboardPanel key={name} name={name}>
              {el}
            </DashboardPanel>
          ))}
        </Box>
      </Box>
    </DashboardStateProvider>
  );
}

export default Dashboard;
