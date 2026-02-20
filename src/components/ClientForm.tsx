import { ClientSchema, type Client } from "../modules/clients";
import trackers, { trackerNames, type TrackerName } from "../modules/trackers";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { KeyOfUnion } from "../modules/util";
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { FormNumberField, FormTextField } from "./FormField";

function ClientDataForm({ trackerName }: { trackerName: TrackerName }) {
  const form = useFormContext<Client>();
  const clientDataSchema = trackers[trackerName].clientDataSchema;
  return (
    <>
      {Object.keys(clientDataSchema.shape).map((key) => {
        const field = key as KeyOfUnion<(typeof clientDataSchema)["shape"]>;
        return (
          <FormTextField
            name={`tracker.data.${field}`}
            control={form.control}
          />
        );
      })}
    </>
  );
}

function ClientForm({
  client,
  invalidNames,
  submitText = "Submit",
  onSubmit,
}: {
  client: Partial<Client>;
  invalidNames: string[];
  submitText?: string;
  onSubmit: (updated: Client) => void;
}) {
  const form = useForm<Client>({
    resolver: zodResolver(ClientSchema),
    defaultValues: client,
  });
  const [trackerName, setTrackerName] = useState<TrackerName | undefined>(
    client.tracker?.name,
  );

  const trackerOptions = trackerNames.map((tracker) => ({
    value: tracker,
    label: trackers[tracker].prettyName,
  }));

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit((client: Client) => {
          // This check should really be a validate() option in the FormField, but I can't get it to work
          if (invalidNames.includes(client.name)) {
            form.setError("name", { message: "Name must be unique." });
          } else onSubmit(client);
        })}
      >
        <FormTextField placeholder="Name" name="name" control={form.control} />
        <Box sx={{ display: "flex" }}>
          <FormNumberField
            placeholder="Rate amount"
            name="hourlyRate.amount"
            control={form.control}
          />
          <FormTextField
            placeholder="Currency"
            name="hourlyRate.currency"
            control={form.control}
          />
        </Box>
        <Controller
          control={form.control}
          name="tracker.name"
          render={({
            field: { value, onChange, onBlur, ref, name },
            fieldState: { error },
          }) => (
            <FormControl sx={{ minWidth: 120 }} error={error && true}>
              <InputLabel>Tracker</InputLabel>
              <Select
                name={name}
                label="Tracker"
                value={value}
                onChange={(option) => {
                  onChange(option.target.value);
                  setTrackerName(option.target.value);
                }}
                onBlur={onBlur}
                inputRef={ref}
              >
                {trackerOptions.map((option) => (
                  <MenuItem key={option.label} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {error && <FormHelperText>{error.message}</FormHelperText>}
            </FormControl>
          )}
        />

        {trackerName && <ClientDataForm trackerName={trackerName} />}

        <Button type="submit" variant="contained">
          {submitText}
        </Button>
      </form>
    </FormProvider>
  );
}

export default ClientForm;
