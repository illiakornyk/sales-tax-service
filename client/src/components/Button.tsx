import { cn } from '../lib/cn';

type ButtonPosition = 'single' | 'left' | 'middle' | 'right';
type ButtonVariant = 'neutral' | 'primary' | 'success';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  position?: ButtonPosition;
  variant?: ButtonVariant;
};

const baseClassName =
  'px-3 py-2 font-medium transition-colors focus:z-10 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-auto disabled:opacity-50';

const variantClasses: Record<ButtonVariant, string> = {
  neutral:
    'border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus:ring-blue-500 focus:ring-offset-white dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white dark:focus:ring-offset-gray-900',
  primary:
    'border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 focus:ring-blue-500 focus:ring-offset-white dark:border-blue-500 dark:bg-blue-500 dark:text-gray-950 dark:hover:border-blue-400 dark:hover:bg-blue-400 dark:focus:ring-offset-gray-900',
  success:
    'border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700 focus:ring-emerald-500 focus:ring-offset-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-gray-950 dark:hover:border-emerald-400 dark:hover:bg-emerald-400 dark:focus:ring-offset-gray-900',
};

const positionClasses: Record<ButtonPosition, string> = {
  single: 'rounded-sm',
  left: 'rounded-l-sm',
  middle: '-ml-px',
  right: '-ml-px rounded-r-sm',
};

export function Button({
  className,
  position = 'single',
  variant = 'neutral',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        baseClassName,
        variantClasses[variant],
        positionClasses[position],
        className,
      )}
      {...props}
    />
  );
}

type ButtonGroupProps = {
  children: React.ReactNode;
  className?: string;
};

export function ButtonGroup({ children, className }: ButtonGroupProps) {
  return <div className={cn('inline-flex', className)}>{children}</div>;
}
