import { cn } from '@/lib/cn';

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
  mainClassName?: string;
};

export function PageShell({
  children,
  className,
  mainClassName,
}: PageShellProps) {
  return (
    <div
      className={cn(
        'min-h-screen bg-[radial-gradient(circle_at_top,_#f7f4ff,_#eef2ff_35%,_#f8fafc_70%)] px-6 py-12 text-slate-900 dark:bg-[radial-gradient(circle_at_top,_#111827,_#020617_40%,_#020617_70%)] dark:text-slate-100',
        className,
      )}
    >
      <main className={cn('mx-auto flex w-full flex-col gap-8', mainClassName)}>
        {children}
      </main>
    </div>
  );
}
