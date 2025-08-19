import React, { Fragment, ReactNode, useState, useRef, useEffect } from 'react';
import { Menu, Transition } from '@headlessui/react';

export interface DropdownItem {
  id?: string;
  label: string | ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  divider?: boolean;
  className?: string;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  placement?: 'left' | 'right';
  width?: 'auto' | 'sm' | 'md' | 'lg';
  className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  placement = 'right',
  width = 'md',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard accessibility
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = (onClick: (() => void) | undefined) => {
    if (onClick) {
      onClick();
      setIsOpen(false);
    }
  };

  const widthClasses = {
    auto: 'w-auto',
    sm: 'w-40',
    md: 'w-48',
    lg: 'w-56',
  };

  const placementClasses = {
    right: 'right-0 origin-top-right',
    left: 'left-0 origin-top-left',
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <div onClick={toggleDropdown}>
        {trigger}
      </div>
      
      {isOpen && (
        <div 
          className={`origin-top-${placement} absolute z-10 mt-2 ${placement === 'right' ? 'right-0' : 'left-0'} ${widthClasses[width]} rounded-md bg-white dark:bg-neutral-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}
        >
          <div className="py-1">
            {items.map((item, index) => {
              if (item.divider) {
                return <div key={`divider-${index}`} className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />;
              }

              return (
                <Menu.Item key={item.id || `dropdown-item-${index}`} disabled={item.disabled}>
                  {({ active }) => (
                    <button
                      onClick={() => handleItemClick(item.onClick)}
                      className={`
                        ${active ? 'bg-neutral-100 dark:bg-neutral-700' : ''} 
                        ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} 
                        ${item.destructive ? 'text-danger-600 dark:text-danger-400' : 'text-neutral-700 dark:text-neutral-300'} 
                        ${item.className || ''}
                        group flex w-full items-center px-4 py-2 text-sm
                      `}
                      disabled={item.disabled}
                    >
                      {item.icon && (
                        <span className="mr-3 h-5 w-5 flex-shrink-0">{item.icon}</span>
                      )}
                      {item.label}
                    </button>
                  )}
                </Menu.Item>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown; 