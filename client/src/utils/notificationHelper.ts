// Utility to ensure notifications are enabled and working
export const enableNotifications = () => {
  // Enable browser notifications
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  
  // Enable popup notifications in localStorage
  const settings = {
    enabled: true,
    position: 'top-right',
    autoClose: true,
    duration: 5000,
    soundEnabled: true,
    maxNotifications: 5,
    showOnlyImportant: false,
  };
  
  localStorage.setItem('notificationPopupSettings', JSON.stringify(settings));
  
  console.log('✅ Notifications enabled');
  return true;
};

// Test notification function
export const testNotification = () => {
  const event = new CustomEvent('showTestNotification', {
    detail: {
      title: 'Test Notification',
      message: 'Popup notifications are working correctly!',
      type: 'system',
      priority: 'medium'
    }
  });
  
  window.dispatchEvent(event);
};