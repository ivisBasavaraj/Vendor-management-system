import React from 'react';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  ClockIcon, 
  ArrowRightIcon 
} from '@heroicons/react/24/outline';

interface ActionItemProps {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'urgent' | 'completed';
  date: string;
  onClick: (id: number) => void;
}

const ActionItem: React.FC<ActionItemProps> = ({
  id,
  title,
  description,
  status,
  date,
  onClick
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'urgent':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return '';
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 mb-4 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onClick(id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center">
            {getStatusIcon()}
            <h3 className="text-lg font-medium ml-2">{title}</h3>
          </div>
          <p className="text-gray-600 mt-1">{description}</p>
          <p className="text-sm text-gray-500 mt-2">Date: {date}</p>
        </div>
        <div className="flex flex-col items-end">
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusClass()}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          <button 
            className="mt-4 flex items-center text-primary-600 hover:text-primary-800 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onClick(id);
            }}
          >
            View Details
            <ArrowRightIcon className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionItem;