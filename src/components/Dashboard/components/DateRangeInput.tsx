import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Radio,
  Select,
  Stack,
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

function custom() {
  return <Stack gap={1}></Stack>;
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

  const [option, setOption] = useState<TimeRangeOption>('Month to Date');

  useEffect(() => {
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
  }, [option]);

  return (
    <Box sx={{ display: 'flex' }}>
      <FormControl>
        <InputLabel>Date Range</InputLabel>
        <Select
          label='Date Range'
          value={option}
          onChange={(option) => {
            setOption(option.target.value);
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
      )}
    </Box>
  );
}

export default DateRangeInput;
