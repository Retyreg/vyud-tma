import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card: React.FC<CardProps> = ({ children, className = '', style, ...props }) => {
  const cardStyle = {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    padding: '20px',
    boxShadow: 'var(--shadow-card)',
    border: '1px solid var(--color-border)',
    ...style,
  };

  return (
    <div style={cardStyle} className={className} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, style, ...props }) => (
  <div style={{ marginBottom: '16px', ...style }} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<CardProps> = ({ children, style, ...props }) => (
  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, ...style }} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<CardProps> = ({ children, style, ...props }) => (
  <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '4px', ...style }} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<CardProps> = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);
