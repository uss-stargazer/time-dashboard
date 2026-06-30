import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Radio,
  Select,
  Typography,
} from '@mui/material';
import useSettings, { dateRangePresets } from '../../../hooks/useSettings';

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
  // Display the typed value immediately, but debounce committing it upstream so
  // rapid custom entry doesn't thrash the data fetch. Presets commit instantly.
  const [localValue, setLocalValue] = useState<Dayjs>(value);
  const [prevValue, setPrevValue] = useState<Dayjs>(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setLocalValue(value);
  }
  const commit = useDebouncedCallback(onChange, 1000);

  return (
    <Box sx={{ flexGrow: 1, flexBasis: { xs: '100%', sm: 'auto' } }}>
      <DatePicker
        label={label}
        value={localValue}
        sx={{ width: '100%' }}
        onChange={(value, { validationError }) => {
          if (value && value.isValid() && !validationError) {
            const error = validate(value);
            if (typeof error === 'string') setError(error);
            else {
              setError(null);
              setLocalValue(value);
              commit(value);
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
                onClick={() => {
                  commit.cancel();
                  preset.onClick();
                }}
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

const timeRangeOptions = [
  ...dateRangePresets.map((p) => p.key),
  'Custom',
] as const;

function DateRangeInput() {
  const settings = useSettings();
  const [startDate, endDate] = settings.dateRange;
  const setStartDate = (d: Dayjs) =>
    settings.setSelection({ preset: 'Custom', range: [d, endDate] });
  const setEndDate = (d: Dayjs) =>
    settings.setSelection({ preset: 'Custom', range: [startDate, d] });

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      <FormControl sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 140 } }}>
        <InputLabel>Date Range</InputLabel>
        <Select
          label='Date Range'
          value={settings.selection.preset}
          onChange={(event) => {
            const key = event.target.value;
            // Switching into Custom seeds the editable range from whatever the
            // outgoing selection currently resolves to, so the dates don't jump.
            settings.setSelection(
              key === 'Custom'
                ? { preset: 'Custom', range: settings.dateRange }
                : { preset: key },
            );
          }}
        >
          {timeRangeOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {settings.selection.preset === 'Custom' && (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            width: { xs: '100%', sm: 'auto' },
          }}
        >
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
        </Box>
      )}
    </Box>
  );
}

export default DateRangeInput;
