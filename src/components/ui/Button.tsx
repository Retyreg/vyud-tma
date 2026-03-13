import { FC } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    borderRadius: 'var(--radius-sm)',
    transition: 'all 0.2s',
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: '#fff',
    },
    secondary: {
      backgroundColor: 'var(--color-primary-light)',
      color: 'var(--color-primary)',
    },
    outline: {
      backgroundColor: 'transparent',
      border: '1px solid var(--color-border)',
      color: 'var(--color-text-primary)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-primary)',
    }
  };

  const sizes = {
    sm: { padding: '6px 12px', fontSize: '14px' },
    md: { padding: '10px 16px', fontSize: '16px' },
    lg: { padding: '14px 24px', fontSize: '18px' },
  };

  const combinedStyle = {
    ...baseStyles,
    ...variants[variant],
    ...sizes[size],
    width: fullWidth ? '100%' : 'auto',
  };

  return (
    <button style={combinedStyle} className={className} {...props}>
      {children}
    </button>
  );
};
