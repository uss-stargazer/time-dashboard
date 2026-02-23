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
import { FormNumberField, FormSelectField, FormTextField } from "./FormField";
import Card from "./Card";
import { currencies } from "../modules/currencies";

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
            <FormSelectField
              placeholder="Currency"
              name="hourlyRate.currency"
              control={form.control}
              items={currencies.map((code) => ({ label: code, value: code }))}
              minWidth={130}
            />
          </Box>
          <FormSelectField
            name="tracker.name"
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
