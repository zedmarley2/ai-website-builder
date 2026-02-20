import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div
      className={[
        'rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}

function CardHeader({ className = '', children, ...props }: CardProps) {
  return (
    <div className={['px-6 pt-6 pb-2', className].join(' ')} {...props}>
      {children}
    </div>
  );
}

function CardTitle({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={['text-lg font-semibold text-gray-900 dark:text-gray-100', className].join(' ')}
      {...props}
    >
      {children}
    </h3>
  );
}

function CardDescription({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={['mt-1 text-sm text-gray-500 dark:text-gray-400', className].join(' ')}
      {...props}
    >
      {children}
    </p>
  );
}

function CardContent({ className = '', children, ...props }: CardProps) {
  return (
    <div className={['px-6 py-4', className].join(' ')} {...props}>
      {children}
    </div>
  );
}

function CardFooter({ className = '', children, ...props }: CardProps) {
  return (
    <div className={['px-6 pb-6 pt-2', className].join(' ')} {...props}>
      {children}
    </div>
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
