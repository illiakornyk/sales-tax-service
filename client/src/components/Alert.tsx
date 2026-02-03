import { cn } from '../lib/cn';

type AlertVariant = 'error' | 'success' | 'info';

type AlertProps = {
  title?: string;
  children: React.ReactNode;
  variant?: AlertVariant;
  className?: string;
};

const variantClasses: Record<AlertVariant, string> = {
  error: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  info: 'border-slate-500/30 bg-slate-500/10 text-slate-200',
};

export function Alert({
  title,
  children,
  variant = 'info',
  className,
}: AlertProps) {
  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 text-sm',
        variantClasses[variant],
        className,
      )}
    >
      {title ? (
        <div className="text-xs uppercase tracking-[0.3em] text-current/70">
          {title}
        </div>
      ) : null}
      <div className={cn(title ? 'mt-1' : undefined)}>{children}</div>
    </div>
  );
}
