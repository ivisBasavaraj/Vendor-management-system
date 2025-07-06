import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  interactive?: boolean;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  bordered?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  interactive = false,
  shadow = 'md',
  padding = 'md',
  rounded = 'md',
  bordered = false,
  onClick,
}) => {
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  };

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
  };

  const baseClasses = 'bg-white dark:bg-neutral-800 overflow-hidden transition-all duration-200';
  const hoverClasses = hover ? 'hover:shadow-lg dark:hover:shadow-neutral-700/20' : '';
  const interactiveClasses = interactive ? 'cursor-pointer transition-transform hover:-translate-y-1' : '';
  const borderClasses = bordered ? 'border border-neutral-200 dark:border-neutral-700' : '';

  const classes = [
    baseClasses,
    shadowClasses[shadow],
    paddingClasses[padding],
    roundedClasses[rounded],
    hoverClasses,
    interactiveClasses,
    borderClasses,
    className,
  ].join(' ');

  const cardContent = (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );

  if (interactive) {
    return (
      <motion.div 
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
};

export default Card; 