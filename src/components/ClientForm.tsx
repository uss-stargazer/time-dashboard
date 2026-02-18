import Select from "react-select";
import { ClientSchema, type Client } from "../modules/clients";
import trackers, { trackerNames, type TrackerName } from "../modules/trackers";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  type FieldError,
  type FieldErrorsImpl,
  type Merge,
} from "react-hook-form";
import FormField from "./FormField";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { KeyOfUnion } from "../modules/util";

function ClientDataForm({ trackerName }: { trackerName: TrackerName }) {
  const form = useFormContext<Client>();
  const clientDataSchema = trackers[trackerName].clientDataSchema;
  return (
    <>
      {Object.keys(clientDataSchema.shape).map((key) => {
        const field = key as KeyOfUnion<(typeof clientDataSchema)["shape"]>;
        return (
          <FormField
            type="text"
            placeholder={field}
            name={`tracker.data.${field}`}
            register={form.register}
            error={
              form.formState.errors.tracker?.data &&
              (
                form.formState.errors.tracker?.data as Merge<
                  FieldError,
                  FieldErrorsImpl<{ [key: string]: string }>
                >
              )[field]
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
  onSubmit,
}: {
  client: Partial<Client>;
  invalidNames: string[];
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
        <FormField
          type="text"
          placeholder="Name"
          name="name"
          register={form.register}
          error={form.formState.errors.name}
        />
        <FormField
          type="number"
          placeholder="Rate amount"
          name="hourlyRate.amount"
          register={form.register}
          error={form.formState.errors.hourlyRate?.amount}
          options={{ valueAsNumber: true }}
        />
        <FormField
          type="text"
          placeholder="Rate currency"
          name="hourlyRate.currency"
          register={form.register}
          error={form.formState.errors.hourlyRate?.currency}
        />
        <Controller
          control={form.control}
          name="tracker.name"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <Select
              value={trackerOptions.find((opt) => opt.value === value)}
              isSearchable
              name="tracker"
              ref={ref}
              options={trackerOptions}
              onBlur={onBlur}
              onChange={(option) => {
                onChange(option?.value);
                setTrackerName(option?.value);
              }}
            />
          )}
        />

        {trackerName && <ClientDataForm trackerName={trackerName} />}

        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}

export default ClientForm;
