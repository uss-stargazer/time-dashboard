import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Box, Radio, Stack, Typography } from '@mui/material';
import useSettings from '../../../hooks/useSettings';

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

function DateRangeInput() {
  const settings = useSettings();

  const [startDate, endDate] = settings.dateRange;
  const setStartDate = (d: Dayjs) => settings.setDateRange([d, endDate]);
  const setEndDate = (d: Dayjs) => settings.setDateRange([startDate, d]);

  return (
    <Stack gap={1}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateInput
          label='From'
          value={startDate}
          onChange={setStartDate}
          validate={(startDate) => {
            if (startDate.isAfter(endDate)) return 'Start must be before end!';
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
            if (startDate.isAfter(endDate)) return 'Start must be before end!';
          }}
          presets={[{ label: 'today', onClick: () => setEndDate(dayjs()) }]}
        />
      </LocalizationProvider>
    </Stack>
  );
}

export default DateRangeInput;
