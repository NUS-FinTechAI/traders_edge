import type { InputHTMLAttributes, Ref } from 'react';
import { THEME_CONFIG } from './config/themeConfig';

type TextFieldSize = 'sm' | 'md' | 'lg';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: TextFieldSize;
  fullWidth?: boolean;
  inputRef?: Ref<HTMLInputElement>;
}

export function TextField({
  label,
  error,
  helperText,
  size = 'md',
  fullWidth = false,
  inputRef,
  className = '',
  id,
  ...rest
}: TextFieldProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const inputConfig = THEME_CONFIG.components.input;
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg'
  };

  const baseClasses = [
    inputConfig.base,
    inputConfig.background,
    inputConfig.text,
    inputConfig.placeholder,
    error ? inputConfig.borderError : inputConfig.borderFocus,
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');

  const labelClass = THEME_CONFIG.colors.text.secondary;
  const helperTextClass = error 
    ? 'text-red-400' 
    : THEME_CONFIG.colors.text.muted;

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label 
          htmlFor={inputId} 
          className={`block text-sm font-medium ${labelClass} mb-1`}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={inputRef}
        className={baseClasses}
        {...rest}
      />
      {(error || helperText) && (
        <p className={`mt-1 text-sm ${helperTextClass}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}
