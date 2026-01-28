/**
 * Input Component
 *
 * A styled input component with focus ring, error state, and disabled state.
 */

import React, { useId } from 'react';

export interface InputProps {
  id?: string;
  name?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url';
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string | boolean;
  isDisabled?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  className?: string;
  label?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  multiline?: boolean;
  rows?: number;
}

export function Input({
  id,
  name,
  type = 'text',
  placeholder,
  value,
  defaultValue,
  onChange,
  onBlur,
  onFocus,
  error,
  isDisabled = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  className = '',
  label,
  helperText,
  leftIcon,
  multiline = false,
  rows,
}: InputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const hasError = Boolean(error);
  const errorMessage = typeof error === 'string' ? error : undefined;

  const describedBy = errorMessage ? errorId : helperText ? helperId : ariaDescribedBy;

  const inputClasses = `
    w-full px-3 py-2
    bg-card border rounded-lg
    text-text-primary placeholder:text-text-placeholder
    transition-all duration-200
    ${
      hasError
        ? 'border-error focus:ring-error/20 focus:border-error'
        : 'border-default focus:ring-accent-subtle focus:border-accent'
    }
    focus:outline-none focus:ring-2
    ${isDisabled ? 'opacity-50 cursor-not-allowed bg-hover' : ''}
    ${leftIcon ? 'pl-10' : ''}
    ${className}
  `;

  const sharedProps = {
    id: inputId,
    name,
    placeholder,
    value,
    defaultValue,
    disabled: isDisabled,
    'aria-label': ariaLabel,
    'aria-invalid': hasError as boolean,
    'aria-disabled': isDisabled,
    'aria-describedby': describedBy,
    tabIndex: isDisabled ? -1 : 0,
    className: inputClasses,
  };

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block mb-1 text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {leftIcon}
          </div>
        )}
        {multiline ? (
          <textarea
            {...sharedProps}
            rows={rows}
            onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
            onBlur={onBlur as React.FocusEventHandler<HTMLTextAreaElement>}
            onFocus={onFocus as React.FocusEventHandler<HTMLTextAreaElement>}
          />
        ) : (
          <input
            {...sharedProps}
            type={type}
            onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
            onBlur={onBlur as React.FocusEventHandler<HTMLInputElement>}
            onFocus={onFocus as React.FocusEventHandler<HTMLInputElement>}
          />
        )}
      </div>
      {errorMessage && (
        <p id={errorId} className="mt-1 text-sm text-error">
          {errorMessage}
        </p>
      )}
      {helperText && !errorMessage && (
        <p id={helperId} className="mt-1 text-sm text-text-secondary">
          {helperText}
        </p>
      )}
    </div>
  );
}
