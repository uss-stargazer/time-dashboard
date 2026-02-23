import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
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
  onChangeCb?: (value: unknown) => void;
};

export function FormTextField<FormData extends FieldValues>({
  placeholder,
  name,
  control,
  options,
  type,
  onChangeCb,
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
          onChange={(event) => {
            onChange(event);
            if (onChangeCb) onChangeCb(event.target.value);
          }}
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
  onChangeCb,
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
          onValueChange={(change) => {
            const value =
              typeof change === "string" ? parseFloat(change) : change;
            onChange(value);
            if (onChangeCb) onChangeCb(value);
          }}
          onBlur={onBlur}
          inputRef={ref}
          helperText={error && error.message}
          errorMessage={error?.message}
        />
      )}
    />
  );
}

export function FormSelectField<
  FormData extends FieldValues,
  ValueType extends string | number | readonly string[] | undefined,
>({
  name,
  control,
  options,
  onChangeCb,
  items,
  minWidth = 120,
}: FormFieldProps<FormData> & {
  items: { label: string; value: ValueType }[];
  minWidth?: number;
}) {
  const label = camelCaseToTitle(name.split(".").at(-1)!);
  return (
    <Controller
      rules={options}
      control={control}
      name={name}
      render={({
        field: { value, onChange, onBlur, ref, name },
        fieldState: { error },
      }) => (
        <FormControl sx={{ minWidth }} error={error && true}>
          <InputLabel>{label}</InputLabel>
          <Select
            name={name}
            label={label}
            value={value}
            onChange={(option) => {
              onChange(option.target.value);
              if (onChangeCb) onChangeCb(option.target.value);
            }}
            onBlur={onBlur}
            inputRef={ref}
          >
            {items.map((option) => (
              <MenuItem key={option.label} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {error && <FormHelperText>{error.message}</FormHelperText>}
        </FormControl>
      )}
    />
  );
}
