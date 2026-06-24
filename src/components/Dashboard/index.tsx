import {
  Box,
  Button,
  Radio,
  Stack,
  Typography,
  type BoxProps,
  type SxProps,
} from '@mui/material';
import ExpectedVsActual from './panels/ExpectedVsActual';
import useSettings from '../../hooks/useSettings';
import { Error as ErrorIcon, Info } from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { type ReactElement } from 'react';
import trackers from '../../modules/trackers';
import Card from '../Card';
import useDashboardState, {
  DashboardStateProvider,
} from './hooks/useDashboardState';
import Comparison from './panels/Comparison';

function DateInput({
  label,
  value,
  onChange,
  validate,
  presets,
}: {
  label: string;
  value: Dayjs;
  onChange: (newDate: Dayjs) => void;
  validate: (newDate: Dayjs) => void | string;
  presets?: { label: string; onClick: () => void }[];
}) {
  const [error, setError] = useState<string | null>(null);
  return (
    <Box>
      <DatePicker
        label={label}
        value={value}
        onChange={(value, { validationError }) => {
          if (value && value.isValid() && !validationError) {
            const error = validate(value);
            if (typeof error === 'string') setError(error);
            else {
              setError(null);
              onChange(value);
            }
          }
        }}
        disableFuture
      />
      {error && (
        <Typography variant='caption' color='error'>
          {error}
        </Typography>
      )}
      {presets && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {presets.map((preset) => (
            <Box key={preset.label}>
              <Radio
                size='small'
                checked={false}
                onClick={preset.onClick}
                sx={{ p: 0.5 }}
              />
              <Typography variant='caption'>{preset.label}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

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
              {error.tracker
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
  { name: 'Expected v. Actual', el: <ExpectedVsActual /> },
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

  const [startDate, endDate] = settings.dateRange;
  const setStartDate = (d: Dayjs) => settings.setDateRange([d, endDate]);
  const setEndDate = (d: Dayjs) => settings.setDateRange([startDate, d]);

  return (
    <DashboardStateProvider>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          ...sx,
        }}
      >
        <Stack gap={1}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateInput
              label='From'
              value={startDate}
              onChange={setStartDate}
              validate={(startDate) => {
                if (startDate.isAfter(endDate))
                  return 'Start must be before end!';
              }}
              presets={[
                {
                  label: 'month',
                  onClick: () => setStartDate(endDate.startOf('month')),
                },
                {
                  label: 'year',
                  onClick: () => setStartDate(endDate.startOf('year')),
                },
              ]}
            />
            <DateInput
              label='To'
              value={endDate}
              onChange={setEndDate}
              validate={(endDate) => {
                if (startDate.isAfter(endDate))
                  return 'Start must be before end!';
              }}
              presets={[{ label: 'today', onClick: () => setEndDate(dayjs()) }]}
            />
          </LocalizationProvider>
        </Stack>

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
