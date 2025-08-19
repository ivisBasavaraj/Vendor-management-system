import React, { ButtonHTMLAttributes, ReactNode, forwardRef, ElementType } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Link, LinkProps } from 'react-router-dom';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  rounded?: boolean;
  to?: string;
  as?: ElementType;
  className?: string;
  'data-submission-id'?: string;
  'data-document-id'?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  rounded = false,
  className = '',
  disabled,
  to,
  as: Component,
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium focus:outline-none transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed btn-windows-hover';
  
  const sizeClasses = {
    xs: 'text-xs px-2 py-1 rounded',
    sm: 'text-xs px-2.5 py-1.5 rounded',
    md: 'text-sm px-4 py-2 rounded-md',
    lg: 'text-base px-6 py-3 rounded-lg',
    icon: 'p-2 rounded-full',
  };
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500',
    outline: 'border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 focus:ring-neutral-500',
    ghost: 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:ring-neutral-500',
    destructive: 'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500',
    success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500',
    danger: 'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500',
  };

  const borderRadiusClasses = rounded ? 'rounded-full' : 'rounded-md';
  const widthClasses = fullWidth ? 'w-full' : '';

  const classes = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    borderRadiusClasses,
    widthClasses,
    className
  ].join(' ');

  const content = (
    <>
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0 mr-2">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex-shrink-0 ml-2">{rightIcon}</span>}
        </>
      )}
    </>
  );

  // Animation properties
  const tapAnimation = {
    whileTap: { scale: 0.98 }
  };

  // Handle Link component specially
  if (Component === Link) {
    return (
      <motion.div {...tapAnimation} style={{ display: 'inline-block' }}>
        <Link 
          to={to || '/'} 
          className={classes}
        >
          {content}
        </Link>
      </motion.div>
    );
  }

  // If other Component is provided, render using that component
  if (Component) {
    return (
      <motion.div {...tapAnimation} style={{ display: 'inline-block' }}>
        <Component className={classes} {...props}>
          {content}
        </Component>
      </motion.div>
    );
  }

  // If 'to' prop is provided, render as Link
  if (to) {
    return (
      <motion.div {...tapAnimation} style={{ display: 'inline-block' }}>
        <Link to={to} className={classes}>
          {content}
        </Link>
      </motion.div>
    );
  }

  // Otherwise render as button
  // Extract data attributes explicitly for proper type handling
  const { 'data-submission-id': submissionId, 'data-document-id': documentId, ...otherProps } = props;
  
  return (
    <motion.button
      ref={ref}
      className={classes}
      disabled={isLoading || disabled}
      {...tapAnimation}
      data-submission-id={submissionId}
      data-document-id={documentId}
      {...otherProps as Omit<HTMLMotionProps<"button">, "ref">}
    >
      {content}
    </motion.button>
  );
});

export default Button; 