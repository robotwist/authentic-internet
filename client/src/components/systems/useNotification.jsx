import { useContext, createContext, useRef } from 'react';

// Create a context for notifications
const NotificationContext = createContext(null);

// Custom hook to use notifications
export const useNotification = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    // Fallback for when context is not available
    return {
      addXPNotification: () => console.warn('Notification system not available'),
      addAchievementNotification: () => console.warn('Notification system not available'),
      showPortalNotification: () => console.warn('Notification system not available'),
      hidePortalNotification: () => console.warn('Notification system not available'),
      createInteractiveNotification: () => console.warn('Notification system not available'),
      setPortalNotificationActive: () => console.warn('Notification system not available'),
    };
  }

  return context;
};

// Provider component
export const NotificationProvider = ({ children, notificationAPI }) => {
  return (
    <NotificationContext.Provider value={notificationAPI}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to get notification API from DOM (fallback method)
export const useNotificationFromDOM = () => {
  const apiRef = useRef(null);

  // Try to get API from DOM element
  const getAPI = () => {
    if (!apiRef.current) {
      const el = document.querySelector('[data-notification-api]');
      if (el && el.notificationAPI) {
        apiRef.current = el.notificationAPI;
      }
    }
    return apiRef.current;
  };

  return {
    addXPNotification: (...args) => getAPI()?.addXPNotification(...args),
    addAchievementNotification: (...args) => getAPI()?.addAchievementNotification(...args),
    showPortalNotification: (...args) => getAPI()?.showPortalNotification(...args),
    hidePortalNotification: (...args) => getAPI()?.hidePortalNotification(...args),
    createInteractiveNotification: (...args) => getAPI()?.createInteractiveNotification(...args),
    setPortalNotificationActive: (...args) => getAPI()?.setPortalNotificationActive(...args),
  };
};

export default useNotification;