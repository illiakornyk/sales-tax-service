import { FormField, FormSelect } from './FormField';

type StateCodeSelectFieldProps = {
  value: string;
  states: string[];
  loading: boolean;
  error?: string | null;
  onChange: (stateCode: string) => void;
  label?: string;
  fieldClassName?: string;
  hintClassName?: string;
  errorClassName?: string;
  selectClassName?: string;
};

export function StateCodeSelectField({
  value,
  states,
  loading,
  error,
  onChange,
  label = 'State code',
  fieldClassName,
  hintClassName,
  errorClassName,
  selectClassName,
}: StateCodeSelectFieldProps) {
  return (
    <FormField
      label={label}
      error={error}
      className={fieldClassName}
      hintClassName={hintClassName}
      errorClassName={errorClassName}
    >
      <FormSelect
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={loading}
        className={selectClassName}
      >
        <option value="">
          {loading ? 'Loading states...' : 'Select a state'}
        </option>
        {states.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </FormSelect>
    </FormField>
  );
}
