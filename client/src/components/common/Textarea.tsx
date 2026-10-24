import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  showCount?: boolean;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      showCount = false,
      maxLength,
      value,
      required,
      disabled,
      rows = 3,
      className = '',
      containerClassName = '',
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className={`w-full space-y-1.5 text-xs ${containerClassName}`}>
        {label && (
          <label
            htmlFor={textareaId}
            className="flex items-center justify-between font-bold text-text tracking-wide select-none"
          >
            <span>
              {label} {required && <span className="text-rose-600 font-bold">*</span>}
            </span>
            {showCount && maxLength && (
              <span className="text-[10px] font-normal text-muted">
                {currentLength} / {maxLength}
              </span>
            )}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          className={`w-full rounded-xl border bg-white p-3 text-xs font-medium text-text placeholder:text-muted/70 transition-all duration-150 focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed resize-y ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
              : 'border-gray-200 focus:border-primary focus:ring-primary/20 hover:border-gray-300'
          } ${className}`}
          {...props}
        />

        {error && (
          <p className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 animate-in fade-in duration-150">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {!error && helperText && (
          <p className="text-[11px] text-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
