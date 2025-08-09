import React, { useState } from 'react';
import { FontAwesomeIcon } from '../../utils/icons';
import { 
  faBroadcastTower, 
  faPaperPlane, 
  faUsers, 
  faExclamationTriangle,
  faInfoCircle,
  faCheckCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';

interface BroadcastNotificationFormProps {
  onSend: (notificationData: BroadcastNotificationData) => Promise<void>;
  isLoading?: boolean;
}

export interface BroadcastNotificationData {
  title: string;
  message: string;
  type: 'system' | 'document_submission' | 'document_review' | 'document_approved' | 'document_rejected' | 'user_registration' | 'workflow_update';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  targetRoles?: string[];
}

const BroadcastNotificationForm: React.FC<BroadcastNotificationFormProps> = ({
  onSend,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<BroadcastNotificationData>({
    title: '',
    message: '',
    type: 'system',
    priority: 'medium',
    actionUrl: '',
    targetRoles: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const notificationTypes = [
    { value: 'system', label: 'System Announcement', icon: faInfoCircle, color: 'text-blue-600' },
    { value: 'document_submission', label: 'Document Submission', icon: faPaperPlane, color: 'text-green-600' },
    { value: 'document_review', label: 'Document Review', icon: faExclamationTriangle, color: 'text-yellow-600' },
    { value: 'document_approved', label: 'Document Approved', icon: faCheckCircle, color: 'text-green-600' },
    { value: 'document_rejected', label: 'Document Rejected', icon: faTimesCircle, color: 'text-red-600' },
    { value: 'user_registration', label: 'User Registration', icon: faUsers, color: 'text-purple-600' },
    { value: 'workflow_update', label: 'Workflow Update', icon: faInfoCircle, color: 'text-indigo-600' }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  const roleOptions = [
    { value: 'admin', label: 'Administrators' },
    { value: 'consultant', label: 'Consultants' },
    { value: 'vendor', label: 'Vendors' }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length > 500) {
      newErrors.message = 'Message must be less than 500 characters';
    }

    if (formData.actionUrl && !isValidUrl(formData.actionUrl)) {
      newErrors.actionUrl = 'Please enter a valid URL or path';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      // Check if it's a relative path or absolute URL
      return url.startsWith('/') || new URL(url).protocol.startsWith('http');
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSend(formData);
      // Reset form on success
      setFormData({
        title: '',
        message: '',
        type: 'system',
        priority: 'medium',
        actionUrl: '',
        targetRoles: []
      });
      setErrors({});
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      targetRoles: prev.targetRoles?.includes(role)
        ? prev.targetRoles.filter(r => r !== role)
        : [...(prev.targetRoles || []), role]
    }));
  };

  const selectedType = notificationTypes.find(type => type.value === formData.type);
  const selectedPriority = priorityLevels.find(priority => priority.value === formData.priority);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
          <FontAwesomeIcon icon={faBroadcastTower} className="text-blue-600 text-xl" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Broadcast Notification</h2>
          <p className="text-gray-600">Send notifications to all users or specific roles</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Notification Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter notification title..."
            maxLength={100}
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          <p className="mt-1 text-sm text-gray-500">{formData.title.length}/100 characters</p>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Message *
          </label>
          <textarea
            id="message"
            rows={4}
            value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.message ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your message..."
            maxLength={500}
          />
          {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
          <p className="mt-1 text-sm text-gray-500">{formData.message.length}/500 characters</p>
        </div>

        {/* Type and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Type
            </label>
            <div className="relative">
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                {notificationTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {selectedType && (
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                  <FontAwesomeIcon icon={selectedType.icon} className={selectedType.color} />
                </div>
              )}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority Level
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {priorityLevels.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
            {selectedPriority && (
              <div className="mt-2">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${selectedPriority.color}`}>
                  {selectedPriority.label} Priority
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action URL */}
        <div>
          <label htmlFor="actionUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Action URL (Optional)
          </label>
          <input
            type="text"
            id="actionUrl"
            value={formData.actionUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, actionUrl: e.target.value }))}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.actionUrl ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="/dashboard or https://example.com"
          />
          {errors.actionUrl && <p className="mt-1 text-sm text-red-600">{errors.actionUrl}</p>}
          <p className="mt-1 text-sm text-gray-500">URL or path users will navigate to when clicking the notification</p>
        </div>

        {/* Target Roles */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Audience
          </label>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="all-users"
                checked={!formData.targetRoles || formData.targetRoles.length === 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData(prev => ({ ...prev, targetRoles: [] }));
                  }
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="all-users" className="ml-2 text-sm text-gray-700">
                All Users
              </label>
            </div>
            
            {roleOptions.map(role => (
              <div key={role.value} className="flex items-center">
                <input
                  type="checkbox"
                  id={`role-${role.value}`}
                  checked={formData.targetRoles?.includes(role.value) || false}
                  onChange={() => handleRoleToggle(role.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`role-${role.value}`} className="ml-2 text-sm text-gray-700">
                  {role.label} Only
                </label>
              </div>
            ))}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Select specific roles or leave unchecked to send to all users
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              setFormData({
                title: '',
                message: '',
                type: 'system',
                priority: 'medium',
                actionUrl: '',
                targetRoles: []
              });
              setErrors({});
            }}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPaperPlane} />
                <span>Send Notification</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BroadcastNotificationForm;