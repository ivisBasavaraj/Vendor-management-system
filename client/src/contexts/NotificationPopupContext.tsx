import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useWebSocket } from './WebSocketContext';
import NotificationPopup, { PopupNotification } from '../components/notifications/NotificationPopup';
import soundService from '../utils/soundService';

interface NotificationPopupContextType {
  showNotification: (notification: Omit<PopupNotification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  notifications: PopupNotification[];
  settings: NotificationSettings;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
}

interface NotificationSettings {
  enabled: boolean;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoClose: boolean;
  duration: number;
  soundEnabled: boolean;
  maxNotifications: number;
  showOnlyImportant: boolean;
}

const defaultSettings: NotificationSettings = {
  enabled: true,
  position: 'top-right',
  autoClose: true,
  duration: 5000,
  soundEnabled: true,
  maxNotifications: 5,
  showOnlyImportant: false,
};

const NotificationPopupContext = createContext<NotificationPopupContextType | undefined>(undefined);

export const useNotificationPopup = () => {
  const context = useContext(NotificationPopupContext);
  if (!context) {
    throw new Error('useNotificationPopup must be used within a NotificationPopupProvider');
  }
  return context;
};

interface NotificationPopupProviderProps {
  children: React.ReactNode;
}

export const NotificationPopupProvider: React.FC<NotificationPopupProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useWebSocket();
  const [notifications, setNotifications] = useState<PopupNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('notificationPopupSettings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notificationPopupSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const generateId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const getNotificationSoundType = (type: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (type) {
      case 'document_approved':
      case 'login_approved':
        return 'success';
      case 'document_rejected':
      case 'login_rejected':
        return 'error';
      case 'document_review':
      case 'system':
        return 'warning';
      case 'workflow_update':
      case 'user_registration':
        return 'info';
      default:
        return 'default';
    }
  };

  const shouldShowNotification = (notification: Omit<PopupNotification, 'id'>): boolean => {
    if (!settings.enabled) return false;
    
    if (settings.showOnlyImportant) {
      return notification.priority === 'high' || notification.priority === 'urgent';
    }
    
    return true;
  };

  const showNotification = useCallback((notification: Omit<PopupNotification, 'id'>) => {
    console.log('showNotification called with:', notification);
    
    if (!shouldShowNotification(notification)) {
      console.log('Notification filtered out by settings');
      return;
    }

    const newNotification: PopupNotification = {
      ...notification,
      id: generateId(),
      autoClose: settings.autoClose,
      duration: settings.duration,
    };

    console.log('Adding notification to state:', newNotification);

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // Limit the number of notifications
      return updated.slice(0, settings.maxNotifications);
    });

    // Play sound if enabled
    if (settings.soundEnabled) {
      const soundType = getNotificationSoundType(notification.type);
      console.log('Playing sound:', soundType);
      soundService.playNotificationSound({ type: soundType, volume: 0.3 });
    } else {
      console.log('Sound disabled in settings');
    }

    // Browser notification (if permission granted)
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: newNotification.id,
          requireInteraction: notification.priority === 'urgent',
        });

        // Auto-close browser notification after 5 seconds (unless urgent)
        if (notification.priority !== 'urgent') {
          setTimeout(() => {
            browserNotification.close();
          }, 5000);
        }
      } catch (error) {
        console.warn('Failed to show browser notification:', error);
      }
    }
  }, [settings]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const handleNotificationAction = useCallback((id: string, actionUrl?: string) => {
    if (actionUrl) {
      // Navigate to the action URL
      window.location.href = actionUrl;
    }
    removeNotification(id);
  }, [removeNotification]);

  // Listen for WebSocket notifications
  useEffect(() => {
    if (!socket || !user) return;

    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket notification:', data);
        
        // Check if this is a notification message
        if (data.type === 'notification' || data.event === 'notification') {
          const notificationData = data.data || data;
          
          // Convert WebSocket notification to PopupNotification format
          const popupNotification: Omit<PopupNotification, 'id'> = {
            title: notificationData.title || 'New Notification',
            message: notificationData.message || '',
            type: notificationData.type || 'system',
            priority: notificationData.priority || 'medium',
            createdAt: notificationData.createdAt || new Date().toISOString(),
            sender: notificationData.sender,
            relatedDocument: notificationData.relatedDocument,
            actionUrl: notificationData.actionUrl,
          };

          showNotification(popupNotification);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.addEventListener('message', handleWebSocketMessage);

    return () => {
      socket.removeEventListener('message', handleWebSocketMessage);
    };
  }, [socket, user, showNotification]);

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  const contextValue: NotificationPopupContextType = {
    showNotification,
    removeNotification,
    clearAllNotifications,
    notifications,
    settings,
    updateSettings,
  };

  return (
    <NotificationPopupContext.Provider value={contextValue}>
      {children}
      
      {/* Render notification popups */}
      {notifications.map((notification, index) => (
        <NotificationPopup
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
          onAction={handleNotificationAction}
          position={settings.position}
          index={index}
        />
      ))}
    </NotificationPopupContext.Provider>
  );
};

export default NotificationPopupProvider;