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
    <Box>
      <DatePicker
        label={label}
        value={localValue}
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
  'Week to Date',
  'Last 30 Days',
  'Month to Date',
  'Year to Date',
  'This Week',
  'This Month',
  'This Year',
  'Custom',
] as const;

type TimeRangeOption = (typeof timeRangeOptions)[number];

function DateRangeInput() {
  const settings = useSettings();
  const [startDate, endDate] = settings.dateRange;
  const setStartDate = (d: Dayjs) => settings.setDateRange([d, endDate]);
  const setEndDate = (d: Dayjs) => settings.setDateRange([startDate, d]);

  const [option, setOption] = useState<TimeRangeOption>(timeRangeOptions[0]);

  const selectOption = (option: TimeRangeOption) => {
    setOption(option);
    switch (option) {
      case 'Week to Date':
        settings.setDateRange([dayjs().startOf('week'), dayjs()]);
        break;
      case 'Month to Date':
        settings.setDateRange([dayjs().startOf('month'), dayjs()]);
        break;
      case 'Year to Date':
        settings.setDateRange([dayjs().startOf('year'), dayjs()]);
        break;
      case 'This Week':
        settings.setDateRange([dayjs().startOf('week'), dayjs().endOf('week')]);
        break;
      case 'This Month':
        settings.setDateRange([
          dayjs().startOf('month'),
          dayjs().endOf('month'),
        ]);
        break;
      case 'This Year':
        settings.setDateRange([dayjs().startOf('year'), dayjs().endOf('year')]);
        break;
      case 'Last 30 Days':
        settings.setDateRange([dayjs().subtract(30, 'days'), dayjs()]);
        break;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      <FormControl>
        <InputLabel>Date Range</InputLabel>
        <Select
          label='Date Range'
          value={option}
          onChange={(option) => {
            selectOption(option.target.value);
          }}
        >
          {timeRangeOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {option === 'Custom' && (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
