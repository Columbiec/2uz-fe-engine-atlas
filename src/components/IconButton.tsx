import { useLocale } from '../core/i18n';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function IconButton({ children, label, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; label: string }) {
 useLocale();
  return <button className={`icon-button ${className}`} aria-label={label} title={label} {...props}>{children}</button>;
}

