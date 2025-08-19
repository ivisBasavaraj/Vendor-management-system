import React from 'react';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default' | 'info' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
  icon?: React.ReactNode;
  rounded?: boolean;
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'primary', 
  className = '',
  size = 'sm',
  dot = false
}) => {
  const variantClasses = {
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
    secondary: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    default: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700/50 dark:text-neutral-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    neutral: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700/50 dark:text-neutral-300'
  };

  const sizeClasses = {
    xs: 'text-xs py-0.5 px-2',
    sm: 'text-xs py-1 px-2.5',
    md: 'text-sm py-1 px-3'
  };

  return (
    <span 
      className={`
        inline-flex items-center rounded-full font-medium
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {dot && (
        <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${variant === 'default' ? 'bg-neutral-400' : `bg-${variant}-500`}`}></span>
      )}
      {children}
    </span>
  );
};

export default Badge; 