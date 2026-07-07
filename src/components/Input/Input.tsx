/**
 * Input base (Design System: Kinetic Enterprise)
 * Text inputs use a White background with a 1px Border.
 * On focus, the border transitions to Deep Night Blue (#15182D) with a subtle 2px outer glow.
 */
import React, { useState } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  endIcon?: React.ReactNode;
  onEndIconClick?: () => void;
  error?: string;
  variant?: 'outline' | 'flushed';
}

export const Input: React.FC<InputProps> = ({
  label,
  icon,
  endIcon,
  onEndIconClick,
  error,
  variant = 'outline',
  id,
  className = '',
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const isFlushed = variant === 'flushed';

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={inputId} className="text-[11px] font-semibold tracking-widest text-outline uppercase">
        {label}
      </label>
      <div className={`flex items-center transition-all duration-200 relative ${
        isFlushed 
          ? `border-b ${error ? 'border-error' : isFocused ? 'border-primary' : 'border-outline hover:border-on-surface-variant'}`
          : `rounded-DEFAULT bg-surface-container-lowest border ${error ? 'border-error focus-within:ring-2 focus-within:ring-error/20' : isFocused ? 'border-primary ring-2 ring-primary/20' : 'border-outline hover:border-on-surface-variant'}`
      }`}>
        {icon && (
          <span className={`flex items-center justify-center pl-3 pr-2 shrink-0 transition-colors duration-200 ${
            error ? 'text-error' : isFocused ? 'text-primary' : 'text-outline'
          }`}>
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={`flex-1 bg-transparent border-none outline-none text-on-surface placeholder-outline-variant text-sm py-2.5 ${!icon ? 'pl-3' : ''}`}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {endIcon && (
          <button
            type="button"
            className={`flex items-center justify-center pr-3 pl-2 bg-transparent border-none cursor-pointer shrink-0 transition-colors duration-200 ${
              isFocused ? 'text-primary' : 'text-outline hover:text-on-surface'
            }`}
            onClick={onEndIconClick}
            tabIndex={-1}
          >
            {endIcon}
          </button>
        )}
      </div>
      {error && <span className="text-xs font-medium text-error">{error}</span>}
    </div>
  );
};
