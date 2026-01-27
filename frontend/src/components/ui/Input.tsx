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
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string | boolean;
  isDisabled?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  className?: string;
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
}: InputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const hasError = Boolean(error);
  const errorMessage = typeof error === 'string' ? error : undefined;

  return (
    <div className="w-full">
      <input
        id={inputId}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-invalid={hasError}
        aria-disabled={isDisabled}
        aria-describedby={errorMessage ? errorId : ariaDescribedBy}
        tabIndex={isDisabled ? -1 : 0}
        className={`
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
          ${className}
        `}
      />
      {errorMessage && (
        <p id={errorId} className="mt-1 text-sm text-error">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
