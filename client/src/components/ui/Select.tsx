import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  error?: string;
}

const Select: React.FC<SelectProps> = ({ 
  children, 
  className = '', 
  error,
  ...props 
}) => {
  return (
    <div className="relative">
      <select
        className={`
          block w-full px-3 py-2 bg-white dark:bg-neutral-800 border 
          ${error ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-600'} 
          rounded-md shadow-sm placeholder-neutral-400 
          focus:outline-none focus:ring-primary focus:border-primary text-sm
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      
      {error && (
        <p className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default Select; 