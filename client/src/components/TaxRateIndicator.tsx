import { cn } from '../lib/cn';

type Band = {
  label: string;
  maxPercent: number;
  badgeClass: string;
  outlineClass: string;
  fillClass: string;
};

const BANDS: Band[] = [
  {
    label: 'Low',
    maxPercent: 5,
    badgeClass:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-700 dark:text-emerald-100',
    outlineClass:
      'border border-emerald-500 text-emerald-700 dark:text-emerald-100',
    fillClass: 'bg-emerald-400',
  },
  {
    label: 'Moderate',
    maxPercent: 8,
    badgeClass:
      'bg-amber-100 text-amber-700 dark:bg-amber-700 dark:text-amber-100',
    outlineClass: 'border border-amber-500 text-amber-700 dark:text-amber-100',
    fillClass: 'bg-yellow-400',
  },
  {
    label: 'High',
    maxPercent: 10,
    badgeClass:
      'bg-orange-100 text-orange-700 dark:bg-orange-700 dark:text-orange-100',
    outlineClass:
      'border border-orange-500 text-orange-700 dark:text-orange-100',
    fillClass: 'bg-orange-400',
  },
  {
    label: 'Very high',
    maxPercent: Number.POSITIVE_INFINITY,
    badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-700 dark:text-rose-100',
    outlineClass: 'border border-rose-500 text-rose-700 dark:text-rose-100',
    fillClass: 'bg-rose-500',
  },
];

type TaxRateIndicatorProps = {
  rate: string;
  compact?: boolean;
  className?: string;
};

export function TaxRateIndicator({
  rate,
  compact = false,
  className,
}: TaxRateIndicatorProps) {
  const percent = Number(rate) * 100;
  if (Number.isNaN(percent)) {
    return null;
  }

  const band = BANDS.find((item) => percent <= item.maxPercent) ?? BANDS[3];
  const percentForScale = Math.max(0, Math.min(percent, 20));
  const progressWidth = `${(percentForScale / 20) * 100}%`;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
          Severity
        </span>
        <div className="inline-flex items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-sm whitespace-nowrap',
              band.badgeClass,
            )}
          >
            {band.label}
          </span>
        </div>
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(percentForScale)}
        aria-valuemin={0}
        aria-valuemax={20}
      >
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {percentForScale.toFixed(2)}%
        </p>
        <div className="mt-2 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className={cn('h-full rounded-full transition-all', band.fillClass)}
            style={{ width: progressWidth }}
          />
        </div>
      </div>
      {!compact ? (
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>0%</span>
          <span>5%</span>
          <span>8%</span>
          <span>10%+</span>
        </div>
      ) : null}
    </div>
  );
}
