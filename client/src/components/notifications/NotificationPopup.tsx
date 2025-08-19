import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '../../utils/icons';
import { 
  faTimes, 
  faBell, 
  faCheck, 
  faExclamationTriangle, 
  faInfoCircle, 
  faCheckCircle,
  faTimesCircle,
  faUser,
  faFileAlt
} from '@fortawesome/free-solid-svg-icons';
import { format, parseISO } from 'date-fns';

export interface PopupNotification {
  id: string;
  title: string;
  message: string;
  type: 'document_submission' | 'document_resubmitted' | 'document_review' | 'document_approved' | 'document_rejected' | 'user_registration' | 'workflow_update' | 'system' | 'login_request' | 'login_approved' | 'login_rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  sender?: {
    name: string;
    email: string;
  };
  relatedDocument?: {
    title: string;
    status: string;
  };
  actionUrl?: string;
  autoClose?: boolean;
  duration?: number; // in milliseconds
}

interface NotificationPopupProps {
  notification: PopupNotification;
  onClose: (id: string) => void;
  onAction?: (id: string, actionUrl?: string) => void;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  index: number;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({
  notification,
  onClose,
  onAction,
  position = 'top-right',
  index
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [progress, setProgress] = useState(100);

  const duration = notification.duration || 5000; // Default 5 seconds
  const autoClose = notification.autoClose !== false; // Default true

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!autoClose) return;

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (duration / 100));
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, 100);

    const autoCloseTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(autoCloseTimer);
    };
  }, [duration, autoClose]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose(notification.id);
    }, 300); // Match animation duration
  };

  const handleAction = () => {
    if (onAction) {
      onAction(notification.id, notification.actionUrl);
    }
    handleClose();
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'document_approved':
      case 'login_approved':
        return faCheckCircle;
      case 'document_rejected':
      case 'login_rejected':
        return faTimesCircle;
      case 'document_submission':
      case 'document_resubmitted':
      case 'document_review':
        return faFileAlt;
      case 'user_registration':
      case 'login_request':
        return faUser;
      case 'workflow_update':
        return faInfoCircle;
      case 'system':
        return faExclamationTriangle;
      default:
        return faBell;
    }
  };

  const getNotificationColor = () => {
    switch (notification.type) {
      case 'document_approved':
      case 'login_approved':
        return 'bg-green-500';
      case 'document_rejected':
      case 'login_rejected':
        return 'bg-red-500';
      case 'document_submission':
      case 'document_resubmitted':
        return 'bg-blue-500';
      case 'document_review':
        return 'bg-yellow-500';
      case 'user_registration':
      case 'login_request':
        return 'bg-purple-500';
      case 'workflow_update':
        return 'bg-indigo-500';
      case 'system':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getPriorityBorder = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'border-l-4 border-red-600';
      case 'high':
        return 'border-l-4 border-orange-500';
      case 'medium':
        return 'border-l-4 border-yellow-500';
      case 'low':
        return 'border-l-4 border-green-500';
      default:
        return 'border-l-4 border-blue-500';
    }
  };

  const getPositionClasses = () => {
    const baseOffset = index * 120; // Stack notifications
    
    switch (position) {
      case 'top-right':
        return `top-4 right-4 transform translate-x-${isVisible ? '0' : 'full'} translate-y-${baseOffset}px`;
      case 'top-left':
        return `top-4 left-4 transform translate-x-${isVisible ? '0' : '-full'} translate-y-${baseOffset}px`;
      case 'bottom-right':
        return `bottom-4 right-4 transform translate-x-${isVisible ? '0' : 'full'} -translate-y-${baseOffset}px`;
      case 'bottom-left':
        return `bottom-4 left-4 transform translate-x-${isVisible ? '0' : '-full'} -translate-y-${baseOffset}px`;
      default:
        return `top-4 right-4 transform translate-x-${isVisible ? '0' : 'full'} translate-y-${baseOffset}px`;
    }
  };

  return (
    <div
      className={`
        fixed z-50 w-96 max-w-sm mx-auto
        ${getPositionClasses()}
        transition-all duration-300 ease-in-out
        ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
      `}
      style={{ 
        transform: `translateY(${index * 120}px) ${isVisible ? 'translateX(0)' : 
          position.includes('right') ? 'translateX(100%)' : 'translateX(-100%)'}`
      }}
    >
      <div className={`
        bg-white rounded-lg shadow-2xl border ${getPriorityBorder()}
        hover:shadow-3xl transition-shadow duration-200
        overflow-hidden
      `}>
        {/* Progress bar for auto-close */}
        {autoClose && (
          <div className="h-1 bg-gray-200">
            <div 
              className={`h-full ${getNotificationColor()} transition-all duration-100 ease-linear`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className={`
                w-10 h-10 rounded-full ${getNotificationColor()} 
                flex items-center justify-center text-white
                shadow-lg
              `}>
                <FontAwesomeIcon icon={getNotificationIcon()} className="text-sm" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 leading-tight">
                  {notification.title}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {format(parseISO(notification.createdAt), 'MMM dd, HH:mm')}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-150 p-1"
              aria-label="Close notification"
            >
              <FontAwesomeIcon icon={faTimes} className="text-sm" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              {notification.message}
            </p>
            
            {/* Sender info */}
            {notification.sender && (
              <p className="text-xs text-gray-500 mt-2">
                From: {notification.sender.name}
              </p>
            )}

            {/* Related document info */}
            {notification.relatedDocument && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                <p className="font-medium text-gray-700">
                  Document: {notification.relatedDocument.title}
                </p>
                <p className="text-gray-500">
                  Status: {notification.relatedDocument.status}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            {notification.actionUrl && (
              <button
                onClick={handleAction}
                className="px-3 py-1 text-xs font-medium text-white bg-blue-600 
                         hover:bg-blue-700 rounded transition-colors duration-150"
              >
                View Details
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-3 py-1 text-xs font-medium text-gray-600 
                       hover:text-gray-800 transition-colors duration-150"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPopup;