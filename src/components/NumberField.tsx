// From: https://github.com/mui/material-ui/issues/44284#issuecomment-2687922477

import { type ChangeEvent, useEffect, useState } from "react";
import TextField, { type TextFieldProps } from "@mui/material/TextField";

const positiveDigitsRegex = /^\d*$/g; // positive digits
const signedDigitsRegex = /^-?\d*$/g; // negative/positive digits
const positiveFloatingDigitsRegex = /^\d*\.?\d*$/g; // positive floating digits. Allows "11." scenario
const signedFloatingDigitsRegex = /^-?\d*\.?\d*$/g; // negative/positive floating digits. Allows "-11." scenario

export type NumberFieldProps = TextFieldProps & {
  onValueChange?: (
    value: string,
    fieldErrors: string[],
    fieldName: string,
  ) => void;
  allowNegative?: boolean;
  allowFloat?: boolean;
  maxValue?: number;
  minValue?: number;
  decimalLimit?: number;
  errorMessage?: string;
};

/**
 * ### NumberField ###
 * Allows signed/unsigned numeric/floating digits entry
 *
 * NOTE - Format of "props.value" should be in sync with "allowNegative" and "allowFloat" flags, else field's content couldn't be edited unless cleared.
 * @param {function} onValueChange Receives changed value of input field.
 * @param {boolean} allowNegative Enables input to take negative entry.
 * @param {boolean} allowFloat Enables input to take floating entry.
 * @param {number} maxValue Maximum allowed numeric/floating signed value.
 * @param {number} minValue Minimum allowed numeric/floating signed value.
 * Note - Input won't register entry if entered value is less than minValue.
 * @param {number} decimalLimit Number of allowed decimal digits.
 * @param {object} ... All parameters same as a TextField component.
 */
export default function NumberField({
  value,
  onValueChange = undefined,
  allowNegative = false,
  allowFloat = false,
  maxValue = NaN,
  minValue = NaN,
  decimalLimit = NaN,
  helperText,
  InputProps,
  inputProps,
  errorMessage,
  ...props
}: NumberFieldProps) {
  let validationRegex: RegExp; // regex for formatting value depending on properties

  if (allowNegative) {
    validationRegex = allowFloat
      ? signedFloatingDigitsRegex
      : signedDigitsRegex;
  } else {
    validationRegex = allowFloat
      ? positiveFloatingDigitsRegex
      : positiveDigitsRegex;
  }

  // NOTE - Format of "props.value" should be in sync with "allowNegative" and "allowFloat" flags, else field's content couldn't be edited unless cleared.
  const [fieldValue, setFieldValue] = useState<string>((value || "") as string);

  useEffect(() => {
    setFieldValue((value || "") as string);
  }, [value]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { value: inputValue, name } = e.target;

    if (!inputValue.match(validationRegex)) return;

    const inputNumber = parseFloat(inputValue);

    if (!Number.isNaN(maxValue) && inputNumber && inputNumber >= maxValue)
      return; // limit maximum allowed value
    if (!Number.isNaN(minValue) && inputNumber && inputNumber <= minValue)
      return; // limit minimum allowed value

    if (allowFloat && !Number.isNaN(decimalLimit)) {
      // check for the length of decimal digits
      const [_, decimals] = inputValue.split(".");

      if (decimals?.length > decimalLimit) return;
    }

    setFieldValue(inputValue);

    // check for required field error
    const fieldErrors =
      props.required && !inputValue ? ["Value is required"] : [];

    if (onValueChange) onValueChange(inputValue, fieldErrors, name);
    if (props.onChange) props.onChange(e);
  };

  return (
    <TextField
      {...props}
      type="text" // if we use "number", we need to take care of formatting and handle onWheel, onTouchStart and onTouchMove events
      value={fieldValue}
      onChange={handleChange}
      InputProps={{
        ...InputProps,
        inputProps: {
          inputMode: "numeric",
          pattern: validationRegex.source,
          ...InputProps?.inputProps,
          ...inputProps,
        },
      }}
      error={!!errorMessage}
      helperText={errorMessage}
    />
  );
}
