/**
 * Botón base (Design System: Kinetic Enterprise)
 * Variantes: Primary (Night Blue), Secondary, Tertiary (Warm Copper), Ghost
 */
import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost';
  fullWidth?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  fullWidth = false,
  isLoading = false,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const baseClasses = "relative inline-flex items-center justify-center font-inter font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-DEFAULT px-5 py-2.5 text-sm";
  
  const variantClasses = {
    primary: "bg-night-blue text-white hover:bg-night-blue-hover focus:ring-night-blue",
    secondary: "bg-secondary text-white hover:bg-secondary-container focus:ring-secondary",
    tertiary: "bg-warm-copper text-white hover:bg-warm-copper-hover focus:ring-warm-copper",
    ghost: "bg-transparent border border-outline text-on-surface hover:bg-surface-container focus:ring-outline",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center" aria-label="Cargando">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      )}
      <span className={`flex items-center justify-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </span>
    </button>
  );
};
