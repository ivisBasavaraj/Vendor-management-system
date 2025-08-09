import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificationPopup } from '../../contexts/NotificationPopupContext';
import BroadcastNotificationForm, { BroadcastNotificationData } from '../../components/notifications/BroadcastNotificationForm';
import { FontAwesomeIcon } from '../../utils/icons';
import { 
  faBell, 
  faBroadcastTower, 
  faUsers, 
  faCheckCircle,
  faExclamationTriangle,
  faVolumeUp
} from '@fortawesome/free-solid-svg-icons';
import soundService from '../../utils/soundService';

const NotificationManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotificationPopup();
  const [isLoading, setIsLoading] = useState(false);
  const [lastSentNotification, setLastSentNotification] = useState<any>(null);

  // Only allow admins to access this page
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-4xl mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can access notification management.</p>
        </div>
      </div>
    );
  }

  const handleSendBroadcast = async (notificationData: BroadcastNotificationData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(notificationData)
      });

      const result = await response.json();

      if (result.success) {
        // Show success notification
        showNotification({
          title: 'Broadcast Sent Successfully!',
          message: `Notification sent to ${result.count} users`,
          type: 'system',
          priority: 'high',
          createdAt: new Date().toISOString()
        });

        // Play success sound
        soundService.playNotificationSound({ type: 'success', volume: 0.5 });

        // Store last sent notification for display
        setLastSentNotification({
          ...notificationData,
          sentAt: new Date().toISOString(),
          recipientCount: result.count
        });

        console.log('Broadcast notification sent successfully:', result);
      } else {
        throw new Error(result.message || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending broadcast notification:', error);
      
      // Show error notification
      showNotification({
        title: 'Failed to Send Notification',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        type: 'system',
        priority: 'high',
        createdAt: new Date().toISOString()
      });

      // Play error sound
      soundService.playNotificationSound({ type: 'error', volume: 0.5 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = () => {
    // Send a test notification to the current user
    showNotification({
      title: 'Test Notification',
      message: 'This is a test notification with sound to verify the popup system is working correctly!',
      type: 'system',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      sender: {
        name: 'System Test',
        email: 'system@test.com'
      }
    });
  };

  const handleTestAllSounds = () => {
    soundService.testAllSounds();
    
    showNotification({
      title: 'Sound Test Started',
      message: 'Playing all notification sounds. You should hear 5 different sounds over the next 7 seconds.',
      type: 'system',
      priority: 'medium',
      createdAt: new Date().toISOString()
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notification Management</h1>
              <p className="mt-2 text-gray-600">
                Send broadcast notifications to all users or specific roles with pop-up alerts and sounds
              </p>
            </div>
            
            {/* Test Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleTestNotification}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <FontAwesomeIcon icon={faBell} />
                <span>Test Popup</span>
              </button>
              <button
                onClick={handleTestAllSounds}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <FontAwesomeIcon icon={faVolumeUp} />
                <span>Test Sounds</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faBroadcastTower} className="text-blue-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Broadcast Ready</h3>
                <p className="text-gray-600">Send to all users</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faUsers} className="text-green-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Role Targeting</h3>
                <p className="text-gray-600">Send to specific roles</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faBell} className="text-purple-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Pop-up + Sound</h3>
                <p className="text-gray-600">Visual & audio alerts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Last Sent Notification */}
        {lastSentNotification && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-xl mt-1 mr-3" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Last Notification Sent Successfully
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Title:</strong> {lastSentNotification.title}</p>
                    <p><strong>Type:</strong> {lastSentNotification.type}</p>
                    <p><strong>Priority:</strong> {lastSentNotification.priority}</p>
                  </div>
                  <div>
                    <p><strong>Recipients:</strong> {lastSentNotification.recipientCount} users</p>
                    <p><strong>Sent At:</strong> {new Date(lastSentNotification.sentAt).toLocaleString()}</p>
                    <p><strong>Target Roles:</strong> {
                      lastSentNotification.targetRoles?.length > 0 
                        ? lastSentNotification.targetRoles.join(', ')
                        : 'All users'
                    }</p>
                  </div>
                </div>
                <p className="mt-2"><strong>Message:</strong> {lastSentNotification.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Broadcast Form */}
        <BroadcastNotificationForm 
          onSend={handleSendBroadcast}
          isLoading={isLoading}
        />

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How It Works</h3>
          <div className="space-y-2 text-blue-800">
            <p>• <strong>Pop-up Notifications:</strong> Users will see a visual notification popup in the corner of their screen</p>
            <p>• <strong>Alert Sounds:</strong> Different notification types play different sounds (success, warning, error, info)</p>
            <p>• <strong>Browser Notifications:</strong> If users have granted permission, they'll also see browser notifications</p>
            <p>• <strong>Real-time Delivery:</strong> Notifications are delivered instantly via WebSocket connection</p>
            <p>• <strong>Auto-close:</strong> Notifications auto-close after 5 seconds unless marked as urgent</p>
            <p>• <strong>Priority Levels:</strong> Higher priority notifications are more prominent and may not auto-close</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationManagementPage;