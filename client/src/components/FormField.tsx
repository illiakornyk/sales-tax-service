import { cn } from '../lib/cn';

type FormFieldProps = {
  label: React.ReactNode;
  children: React.ReactNode;
  hint?: string;
  error?: string | null;
  className?: string;
  hintClassName?: string;
  errorClassName?: string;
  htmlFor?: string;
  required?: boolean;
};

export function FormField({
  label,
  children,
  hint,
  error,
  className,
  hintClassName,
  errorClassName,
  htmlFor,
  required,
}: FormFieldProps) {
  return (
    <label htmlFor={htmlFor} className={cn('block', className)}>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </span>
      <div>{children}</div>
      {error ? (
        <span className={cn('mt-1 block text-xs text-rose-500', errorClassName)}>
          {error}
        </span>
      ) : hint ? (
        <span
          className={cn(
            'mt-1 block text-xs text-gray-500 dark:text-gray-400',
            hintClassName,
          )}
        >
          {hint}
        </span>
      ) : null}
    </label>
  );
}

type FormInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function FormInput({ className, ...props }: FormInputProps) {
  return (
    <input
      className={cn(
        'mt-0.5 w-full rounded border border-gray-300 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white',
        className,
      )}
      {...props}
    />
  );
}

type FormSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function FormSelect({ className, children, ...props }: FormSelectProps) {
  return (
    <select
      className={cn(
        'mt-0.5 w-full rounded border border-gray-300 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
