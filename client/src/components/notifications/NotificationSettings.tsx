import React, { useState } from 'react';
import { useNotificationPopup } from '../../contexts/NotificationPopupContext';
import soundService from '../../utils/soundService';
import { FontAwesomeIcon } from '../../utils/icons';
import { 
  faCog, 
  faVolumeUp, 
  faVolumeXmark, 
  faBell, 
  faCheck, 
  faTimes,
  faPlay
} from '@fortawesome/free-solid-svg-icons';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, showNotification } = useNotificationPopup();
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    updateSettings(localSettings);
    onClose();
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    onClose();
  };

  const testNotification = () => {
    showNotification({
      title: 'Test Notification',
      message: 'This is a test notification to preview your settings.',
      type: 'system',
      priority: 'medium',
      createdAt: new Date().toISOString(),
    });
  };

  const testSound = () => {
    soundService.playNotificationSound({ type: 'info', volume: 0.3 });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FontAwesomeIcon icon={faCog} className="mr-2 text-blue-600" />
            Notification Settings
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Enable/Disable Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enable Pop-up Notifications
              </label>
              <p className="text-xs text-gray-500">
                Show notifications as pop-ups on your screen
              </p>
            </div>
            <button
              onClick={() => setLocalSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${localSettings.enabled ? 'bg-blue-600' : 'bg-gray-200'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${localSettings.enabled ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Position
            </label>
            <select
              value={localSettings.position}
              onChange={(e) => setLocalSettings(prev => ({ 
                ...prev, 
                position: e.target.value as any 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!localSettings.enabled}
            >
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </div>

          {/* Auto Close */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Auto Close
              </label>
              <p className="text-xs text-gray-500">
                Automatically dismiss notifications after a few seconds
              </p>
            </div>
            <button
              onClick={() => setLocalSettings(prev => ({ ...prev, autoClose: !prev.autoClose }))}
              disabled={!localSettings.enabled}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${localSettings.autoClose && localSettings.enabled ? 'bg-blue-600' : 'bg-gray-200'}
                ${!localSettings.enabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${localSettings.autoClose && localSettings.enabled ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* Duration */}
          {localSettings.autoClose && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto Close Duration: {localSettings.duration / 1000}s
              </label>
              <input
                type="range"
                min="2000"
                max="10000"
                step="1000"
                value={localSettings.duration}
                onChange={(e) => setLocalSettings(prev => ({ 
                  ...prev, 
                  duration: parseInt(e.target.value) 
                }))}
                disabled={!localSettings.enabled}
                className={`w-full ${!localSettings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>2s</span>
                <span>10s</span>
              </div>
            </div>
          )}

          {/* Sound */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Sound Effects
              </label>
              <p className="text-xs text-gray-500">
                Play sounds when notifications appear
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={testSound}
                disabled={!localSettings.enabled || !localSettings.soundEnabled}
                className={`
                  p-2 rounded text-gray-600 hover:text-blue-600 transition-colors
                  ${!localSettings.enabled || !localSettings.soundEnabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                title="Test sound"
              >
                <FontAwesomeIcon icon={faPlay} className="text-sm" />
              </button>
              <button
                onClick={() => setLocalSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                disabled={!localSettings.enabled}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${localSettings.soundEnabled && localSettings.enabled ? 'bg-blue-600' : 'bg-gray-200'}
                  ${!localSettings.enabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${localSettings.soundEnabled && localSettings.enabled ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          </div>

          {/* Max Notifications */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Notifications: {localSettings.maxNotifications}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={localSettings.maxNotifications}
              onChange={(e) => setLocalSettings(prev => ({ 
                ...prev, 
                maxNotifications: parseInt(e.target.value) 
              }))}
              disabled={!localSettings.enabled}
              className={`w-full ${!localSettings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>10</span>
            </div>
          </div>

          {/* Show Only Important */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Important Only
              </label>
              <p className="text-xs text-gray-500">
                Show only high and urgent priority notifications
              </p>
            </div>
            <button
              onClick={() => setLocalSettings(prev => ({ ...prev, showOnlyImportant: !prev.showOnlyImportant }))}
              disabled={!localSettings.enabled}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${localSettings.showOnlyImportant && localSettings.enabled ? 'bg-blue-600' : 'bg-gray-200'}
                ${!localSettings.enabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${localSettings.showOnlyImportant && localSettings.enabled ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* Test Button */}
          <div className="pt-4 border-t">
            <button
              onClick={testNotification}
              disabled={!localSettings.enabled}
              className={`
                w-full px-4 py-2 text-sm font-medium rounded-md transition-colors
                ${localSettings.enabled 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              <FontAwesomeIcon icon={faBell} className="mr-2" />
              Test Notification
            </button>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            <FontAwesomeIcon icon={faCheck} className="mr-2" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;

// Export for module compatibility
export {};