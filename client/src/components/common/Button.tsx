import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'danger'
  | 'success'
  | 'warning'
  | 'ghost'
  | 'gold';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white shadow-sm hover:shadow-md active:scale-98 border border-transparent',
  secondary:
    'bg-surface hover:bg-gray-200/80 text-text border border-gray-200/80 active:scale-98',
  outline:
    'bg-transparent hover:bg-primary-light/40 text-primary-dark border border-primary/30 active:scale-98',
  danger:
    'bg-rose-600 hover:bg-rose-700 text-white shadow-xs hover:shadow-sm active:scale-98 border border-transparent',
  success:
    'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-xs hover:shadow-sm active:scale-98 border border-transparent',
  warning:
    'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs hover:shadow-sm active:scale-98 border border-transparent',
  gold:
    'bg-gradient-to-r from-accent to-accent-hover hover:from-accent-hover hover:to-accent text-white shadow-xs hover:shadow-md active:scale-98 border border-transparent',
  ghost:
    'bg-transparent hover:bg-gray-100 text-gray-700 border border-transparent active:scale-98',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-[11px] font-semibold rounded-lg gap-1 min-h-[30px]',
  sm: 'px-3 py-1.5 text-xs font-semibold rounded-xl gap-1.5 min-h-[36px]',
  md: 'px-4 py-2 text-xs font-bold rounded-xl gap-2 min-h-[42px]',
  lg: 'px-5 py-2.5 text-sm font-bold rounded-2xl gap-2.5 min-h-[48px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center font-sans tracking-wide transition-all duration-150 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${
          variantStyles[variant]
        } ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!loading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
