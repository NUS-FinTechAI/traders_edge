import type { ButtonHTMLAttributes } from 'react';
import { THEME_CONFIG, type ButtonVariant, type ButtonSize } from './config/themeConfig';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export function Button({
  variant = 'success',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const buttonConfig = THEME_CONFIG.components.button;
  
  const classes = [
    buttonConfig.base,
    buttonConfig.variants[variant],
    buttonConfig.sizes[size],
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}
