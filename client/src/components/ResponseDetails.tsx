import { cn } from '../lib/cn';

export type ResponseDetailsField = {
  label: string;
  value: unknown;
};

type ResponseDetailsProps = {
  fields: ResponseDetailsField[];
  className?: string;
};

export function ResponseDetails({ fields, className }: ResponseDetailsProps) {
  return (
    <div className={cn('mt-2 flow-root', className)}>
      <dl className="-my-3 divide-y divide-gray-200 text-sm dark:divide-gray-700">
        {fields.map(({ label, value }) => (
          <div
            key={label}
            className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4"
          >
            <dt className="font-medium text-gray-900 dark:text-white">{label}</dt>
            <dd className="text-gray-700 sm:col-span-2 dark:text-gray-200">
              {value === null || value === undefined ? '—' : String(value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
