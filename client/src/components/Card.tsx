import { cn } from '../lib/cn';

type CardVariant = 'light' | 'dark' | 'plain';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  variant?: CardVariant;
};

const variantClasses: Record<CardVariant, string> = {
  light:
    'border-slate-200 bg-white/80 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.4)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-[0_20px_60px_-35px_rgba(15,23,42,0.7)]',
  dark: 'border-slate-200 bg-white/80 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.4)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-[0_20px_60px_-35px_rgba(15,23,42,0.7)]',
  plain: 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60',
};

export function Card({ children, className, variant = 'plain' }: CardProps) {
  return (
    <section
      className={cn('rounded-2xl border p-6', variantClasses[variant], className)}
    >
      {children}
    </section>
  );
}
