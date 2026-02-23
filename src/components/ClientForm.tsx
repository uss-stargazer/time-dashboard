import {
  UncomputedClientSchema,
  type UncomputedClient,
} from "../modules/clients";
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
import Card from "./Card";

function ClientDataForm({ trackerName }: { trackerName: TrackerName }) {
  const form = useFormContext<UncomputedClient>();
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
  otherButtons,
  isHidden,
  buttonStatus = "normal",
}: {
  client: Partial<UncomputedClient>;
  invalidNames: string[];
  submitText?: string;
  onSubmit: (updated: UncomputedClient) => void;
  otherButtons?: { label: string; onClick: () => void }[];
  isHidden?: boolean;
  buttonStatus?: "normal" | "disabled" | "loading";
}) {
  const form = useForm<UncomputedClient>({
    resolver: zodResolver(UncomputedClientSchema),
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
      <Card
        component="form"
        faded={isHidden}
        onSubmit={form.handleSubmit((client: UncomputedClient) => {
          // This check should really be a validate() option in the FormField, but I can't get it to work
          if (invalidNames.includes(client.name)) {
            form.setError("name", { message: "Name must be unique." });
          } else onSubmit(client);
        })}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <FormTextField
            placeholder="Name"
            name="name"
            control={form.control}
          />
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
        </Box>

        <br />

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={buttonStatus === "disabled"}
            loading={buttonStatus === "loading"}
          >
            {submitText}
          </Button>
          {otherButtons?.map((btn) => (
            <Button
              variant="outlined"
              onClick={btn.onClick}
              disabled={buttonStatus === "disabled"}
              loading={buttonStatus === "loading"}
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
