import { cn } from '../lib/cn';

type LoadingInlineProps = {
  label?: string;
  className?: string;
};

export function LoadingInline({
  label = 'Loading...',
  className,
}: LoadingInlineProps) {
  return (
    <div className={cn('flex items-center gap-2 text-sm text-slate-400', className)}>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-slate-200" />
      <span>{label}</span>
    </div>
  );
}

type TableSkeletonRowsProps = {
  columns: number;
  rows?: number;
  tone?: 'light' | 'dark';
  cellClassName?: string;
};

export function TableSkeletonRows({
  columns,
  rows = 6,
  tone = 'light',
  cellClassName = 'px-6 py-3',
}: TableSkeletonRowsProps) {
  const barClass = tone === 'light' ? 'bg-slate-200' : 'bg-slate-800';

  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={`skeleton-row-${rowIndex}`} className="animate-pulse">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <td key={`skeleton-cell-${rowIndex}-${columnIndex}`} className={cellClassName}>
              <div
                className={cn(
                  'h-4 rounded',
                  barClass,
                  columnIndex === 0 ? 'w-16' : 'w-full max-w-[160px]',
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
