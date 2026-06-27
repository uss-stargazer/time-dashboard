import {
  EPOCH_SENTINEL,
  UncomputedClientSchema,
  type UncomputedClient,
} from '../../modules/clients';
import trackers, {
  trackerNames,
  type TrackerName,
} from '../../modules/trackers';
import {
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from 'react-hook-form';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import type { KeyOfUnion } from '../../modules/util';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { Add, Close } from '@mui/icons-material';
import {
  FormDateField,
  FormNumberField,
  FormSelectField,
  FormTextField,
} from './../FormField';
import Card from './../Card';
import { currencies } from '../../modules/currencies';

function ClientDataForm({ trackerName }: { trackerName: TrackerName }) {
  const form = useFormContext<UncomputedClient>();
  const tracker = trackers[trackerName];
  const clientDataSchema = tracker.clientDataSchema;
  return (
    <>
      {Object.keys(clientDataSchema.shape).map((key) => {
        const field = key as KeyOfUnion<(typeof clientDataSchema)['shape']>;
        return (
          <FormTextField
            key={key}
            name={`tracker.data.${field}`}
            control={form.control}
            type={
              tracker.secretsDataKeys?.includes(field as never)
                ? 'password'
                : undefined
            }
          />
        );
      })}
    </>
  );
}

function ClientForm({
  client,
  invalidNames,
  submitText = 'Submit',
  onSubmit,
  otherButtons,
  isHidden,
  buttonStatus = 'normal',
}: {
  client: Partial<UncomputedClient>;
  invalidNames: string[];
  submitText?: string;
  onSubmit: (updated: UncomputedClient) => void;
  otherButtons?: { label: string; onClick: () => void }[];
  isHidden?: boolean;
  buttonStatus?: 'normal' | 'disabled' | 'loading';
}) {
  const form = useForm<UncomputedClient>({
    resolver: zodResolver(UncomputedClientSchema),
    defaultValues: {
      rateCurrency: client.rateCurrency ?? 'USD',
      rates: client.rates ?? [
        { amount: undefined as unknown as number, effectiveFrom: EPOCH_SENTINEL },
      ],
      ...client,
    },
  });
  const [trackerName, setTrackerName] = useState<TrackerName | undefined>(
    client.tracker?.name,
  );
  const rateFields = useFieldArray({ control: form.control, name: 'rates' });
  const ratesError =
    form.formState.errors.rates?.message ??
    form.formState.errors.rates?.root?.message;

  const trackerOptions = trackerNames.map((tracker) => ({
    value: tracker,
    label: trackers[tracker].prettyName,
  }));

  return (
    <FormProvider {...form}>
      <Card
        component='form'
        faded={isHidden}
        onSubmit={form.handleSubmit((client: UncomputedClient) => {
          // This check should really be a validate() option in the FormField, but I can't get it to work
          if (invalidNames.includes(client.name)) {
            form.setError('name', { message: 'Name must be unique.' });
          } else onSubmit(client);
        })}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormTextField
            placeholder='Name'
            name='name'
            control={form.control}
          />
          <FormSelectField
            placeholder='Currency'
            name='rateCurrency'
            control={form.control}
            items={currencies.map((code) => ({ label: code, value: code }))}
            minWidth={130}
          />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            {rateFields.fields.map((field, idx) => (
              <Box
                key={field.id}
                sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
              >
                {/* Amount has a fixed width so it's identical on every row;
                    the second column (date or label) flexes, and the remove
                    button gets a reserved column. This keeps the baseline row
                    aligned with the dated rows. */}
                <Box sx={{ width: 100, flexShrink: 0 }}>
                  <FormNumberField
                    name={`rates.${idx}.amount`}
                    control={form.control}
                    fullWidth
                  />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0, maxWidth: 220 }}>
                  {idx === 0 ? (
                    // The baseline rate has no meaningful "effective from" and
                    // is always present, so it's neither dated nor removable.
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      sx={{ display: 'block', width: '100%', textAlign: 'center' }}
                    >
                      Initial rate
                    </Typography>
                  ) : (
                    <FormDateField
                      name={`rates.${idx}.effectiveFrom`}
                      control={form.control}
                      label='Effective from'
                      fullWidth
                    />
                  )}
                </Box>
                <IconButton
                  size='small'
                  aria-label='Remove rate change'
                  onClick={() => rateFields.remove(idx)}
                  // Reserve the column on the baseline row so widths stay even.
                  sx={{ visibility: idx === 0 ? 'hidden' : 'visible' }}
                >
                  <Close fontSize='small' />
                </IconButton>
              </Box>
            ))}
            {ratesError && (
              <Typography variant='caption' color='error'>
                {ratesError}
              </Typography>
            )}
            <Button
              size='small'
              startIcon={<Add />}
              sx={{ alignSelf: 'flex-start' }}
              onClick={() =>
                rateFields.append({
                  amount: 0,
                  effectiveFrom: dayjs().format('YYYY-MM-DD'),
                })
              }
            >
              Add rate change
            </Button>
          </LocalizationProvider>
          <FormSelectField
            name='tracker.name'
            control={form.control}
            items={trackerOptions}
            onChangeCb={(name) =>
              trackerNames.includes(name as TrackerName) &&
              setTrackerName(name as TrackerName)
            }
          />

          {trackerName && <ClientDataForm trackerName={trackerName} />}
        </Box>

        <br />

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            type='submit'
            variant='contained'
            disabled={buttonStatus === 'disabled'}
            loading={buttonStatus === 'loading'}
          >
            {submitText}
          </Button>
          {otherButtons?.map((btn) => (
            <Button
              key={btn.label}
              variant='outlined'
              onClick={btn.onClick}
              disabled={buttonStatus === 'disabled'}
              loading={buttonStatus === 'loading'}
            >
              {btn.label}
            </Button>
          ))}
        </Box>
      </Card>
    </FormProvider>
  );
}

export default ClientForm;
