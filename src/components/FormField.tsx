import type {
  FieldError,
  FieldValues,
  Path,
  RegisterOptions,
  UseFormRegister,
} from "react-hook-form";

export type FormFieldProps<FormData extends FieldValues> = {
  type: string;
  placeholder: string;
  name: Path<FormData>;
  register: UseFormRegister<FormData>;
  error: FieldError | undefined;
  options?: RegisterOptions<FormData, Path<FormData>>;
};

function FormField<FormData extends FieldValues>({
  type,
  placeholder,
  name,
  register,
  error,
  options,
}: FormFieldProps<FormData>) {
  return (
    <>
      <input
        type={type}
        placeholder={placeholder}
        {...register(name, options)}
      />
      {error && <span className="error-message">{error.message}</span>}
    </>
  );
}

export default FormField;
