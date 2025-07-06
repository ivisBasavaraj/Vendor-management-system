import React from 'react';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  ClockIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface ActionDetailProps {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'urgent' | 'completed';
  date: string;
  dueDate?: string;
  assignedBy?: string;
  relatedDocument?: string;
  onComplete: (id: number) => void;
  onClose: () => void;
}

const ActionDetail: React.FC<ActionDetailProps> = ({
  id,
  title,
  description,
  status,
  date,
  dueDate,
  assignedBy,
  relatedDocument,
  onComplete,
  onClose
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-6 w-6 text-yellow-500" />;
      case 'urgent':
        return <ExclamationCircleIcon className="h-6 w-6 text-red-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {getStatusIcon()}
          <h2 className="text-xl font-semibold ml-2">{title}</h2>
        </div>
        <span className={`px-3 py-1 text-sm rounded-full ${getStatusClass()}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
      
      <div className="border-t border-b border-gray-200 py-4 my-4">
        <p className="text-gray-700">{description}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center">
          <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
          <div>
            <p className="text-sm text-gray-500">Created On</p>
            <p className="font-medium">{date}</p>
          </div>
        </div>
        
        {dueDate && (
          <div className="flex items-center">
            <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Due Date</p>
              <p className="font-medium">{dueDate}</p>
            </div>
          </div>
        )}
        
        {assignedBy && (
          <div className="flex items-center">
            <UserIcon className="h-5 w-5 text-gray-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Assigned By</p>
              <p className="font-medium">{assignedBy}</p>
            </div>
          </div>
        )}
        
        {relatedDocument && (
          <div className="flex items-center">
            <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Related Document</p>
              <p className="font-medium">{relatedDocument}</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
        
        {status !== 'completed' && (
          <button
            onClick={() => onComplete(id)}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Mark as Completed
          </button>
        )}
      </div>
    </div>
  );
};

export default ActionDetail;