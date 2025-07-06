import React, { createContext, useContext } from 'react';

interface TabsProps {
  children: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

interface TabsTriggerProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

interface TabsContentProps {
  children: React.ReactNode;
  value: string;
  className?: string;
  hidden?: boolean;
}

// Context for the tabs
const TabsContext = createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
}>({});

export const Tabs: React.FC<TabsProps> = ({ 
  children, 
  value, 
  onValueChange,
  className = ''
}) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<TabsListProps> = ({ 
  children, 
  className = ''
}) => {
  return (
    <div className={`flex space-x-1 overflow-x-auto border-b border-neutral-200 dark:border-neutral-700 ${className}`}>
      {children}
    </div>
  );
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  children,
  value,
  className = ''
}) => {
  const { value: contextValue, onValueChange } = useContext(TabsContext);
  const isActive = contextValue === value;

  const handleClick = () => {
    if (onValueChange) {
      onValueChange(value);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`px-4 py-2 font-medium text-sm flex items-center ${isActive 
        ? 'text-primary-600 border-b-2 border-primary-600' 
        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
      } ${className}`}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<TabsContentProps> = ({
  children,
  value,
  className = '',
  hidden
}) => {
  const { value: contextValue } = useContext(TabsContext);
  const isActive = contextValue === value;
  
  if (!isActive && hidden !== false) {
    return null;
  }

  return (
    <div className={className}>
      {children}
    </div>
  );
};

// Export components
export { TabsContext }; 