import { TextField } from "@mui/material";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type RegisterOptions,
} from "react-hook-form";
import { camelCaseToTitle } from "../modules/util";
import NumberField from "./NumberField";

export type FormFieldProps<FormData extends FieldValues> = {
  type?: string;
  placeholder?: string;
  name: Path<FormData>;
  control: Control<FormData>;
  options?: RegisterOptions<FormData, Path<FormData>>;
};

export function FormTextField<FormData extends FieldValues>({
  placeholder,
  name,
  control,
  options,
  type,
}: FormFieldProps<FormData>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={options}
      render={({
        field: { onChange, onBlur, value, ref },
        fieldState: { error },
      }) => (
        <TextField
          label={camelCaseToTitle(name.split(".").at(-1)!)}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          onBlur={onBlur}
          inputRef={ref}
          helperText={error && error.message}
          error={!!error}
        />
      )}
    />
  );
}

export function FormNumberField<FormData extends FieldValues>({
  name,
  control,
  options,
}: FormFieldProps<FormData>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={options}
      render={({
        field: { onChange, onBlur, value, ref },
        fieldState: { error },
      }) => (
        <NumberField
          allowFloat
          label={camelCaseToTitle(name.split(".").at(-1)!)}
          value={value}
          onValueChange={(value) =>
            onChange(typeof value === "string" ? parseFloat(value) : value)
          }
          onBlur={onBlur}
          inputRef={ref}
          helperText={error && error.message}
          errorMessage={error?.message}
        />
      )}
    />
  );
}
