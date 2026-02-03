import { cn } from '../lib/cn';

type FormFieldProps = {
  label: React.ReactNode;
  children: React.ReactNode;
  hint?: string;
  error?: string | null;
  className?: string;
  hintClassName?: string;
  errorClassName?: string;
};

export function FormField({
  label,
  children,
  hint,
  error,
  className,
  hintClassName,
  errorClassName,
}: FormFieldProps) {
  return (
    <label className={cn('flex flex-col gap-2 text-sm font-medium', className)}>
      <span>{label}</span>
      {children}
      {error ? (
        <span className={cn('text-xs text-rose-500', errorClassName)}>
          {error}
        </span>
      ) : hint ? (
        <span className={cn('text-xs text-slate-400', hintClassName)}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}
