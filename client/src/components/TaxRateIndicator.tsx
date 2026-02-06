import { cn } from '../lib/cn';

type Band = {
  label: string;
  maxPercent: number;
  badgeClass: string;
  fillClass: string;
};

const BANDS: Band[] = [
  {
    label: 'Low',
    maxPercent: 5,
    badgeClass: 'border-emerald-700 bg-emerald-900/40 text-emerald-300',
    fillClass: 'bg-emerald-400',
  },
  {
    label: 'Moderate',
    maxPercent: 8,
    badgeClass: 'border-yellow-700 bg-yellow-900/40 text-yellow-300',
    fillClass: 'bg-yellow-400',
  },
  {
    label: 'High',
    maxPercent: 10,
    badgeClass: 'border-orange-700 bg-orange-900/40 text-orange-300',
    fillClass: 'bg-orange-400',
  },
  {
    label: 'Very high',
    maxPercent: Number.POSITIVE_INFINITY,
    badgeClass: 'border-rose-700 bg-rose-900/40 text-rose-300',
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
        <span
          className={cn(
            'rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.12em]',
            band.badgeClass,
          )}
        >
          {band.label}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-800">
        <div
          className={cn('h-full rounded-full transition-all', band.fillClass)}
          style={{ width: progressWidth }}
        />
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
