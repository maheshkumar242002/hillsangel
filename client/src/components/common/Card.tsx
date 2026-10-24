import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export const Card = ({
  hoverable = false,
  padding = 'none',
  className = '',
  children,
  ...props
}: CardProps): React.ReactElement => {
  return (
    <div
      className={`bg-white rounded-3xl border border-gray-100 shadow-xs transition-all duration-200 overflow-hidden ${
        hoverable ? 'hover:shadow-md hover:border-gray-200' : ''
      } ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

Card.Header = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-surface/30 ${className}`}
    {...props}
  >
    {children}
  </div>
);

Card.Title = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`font-serif text-base sm:text-lg font-bold text-text leading-tight ${className}`} {...props}>
    {children}
  </h3>
);

Card.Description = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-xs text-muted mt-0.5 ${className}`} {...props}>
    {children}
  </p>
);

Card.Body = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-5 sm:p-6 text-xs ${className}`} {...props}>
    {children}
  </div>
);

Card.Footer = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`p-4 sm:p-5 border-t border-gray-100 bg-surface/30 flex items-center justify-end gap-2 text-xs ${className}`}
    {...props}
  >
    {children}
  </div>
);

export default Card;
