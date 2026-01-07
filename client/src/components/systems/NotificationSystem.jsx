import React, { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import XPNotification from '../XPNotification';
import AchievementNotification from '../AchievementNotification';
import { NotificationProvider } from './useNotification.jsx';

const NotificationSystem = ({ soundManager }) => {
  // Notifications state
  const [notifications, setNotifications] = useState({
    notification: null,
    achievementNotification: null,
    xpNotifications: [],
    achievementNotifications: [],
    winMessage: "",
    currentAchievement: "",
  });

  // Portal notification state
  const [portalNotificationActive, setPortalNotificationActive] = useState(false);

  // Separate XP notifications state (for positioned notifications)
  const [xpNotifications, setXPNotifications] = useState([]);

  // Update notifications state
  const updateNotifications = useCallback((updates) => {
    setNotifications((prev) => ({ ...prev, ...updates }));
  }, []);

  // Remove an XP notification
  const removeXpNotification = useCallback(
    (id) => {
      updateNotifications({
        xpNotifications: (prev) =>
          prev.filter((notification) => notification.id !== id),
      });
    },
    [updateNotifications],
  );

  // Remove an achievement notification
  const removeAchievementNotification = useCallback(
    (id) => {
      updateNotifications({
        achievementNotifications: (prev) =>
          prev.filter((notification) => notification.id !== id),
      });
    },
    [updateNotifications],
  );

  // Portal notification functions
  const showPortalNotification = useCallback((title, message) => {
    // Create the notification element if it doesn't exist
    let notification = document.getElementById("portal-notification");

    if (!notification) {
      notification = document.createElement("div");
      notification.id = "portal-notification";
      notification.className = "portal-notification";
      document.body.appendChild(notification);
    }

    // Update notification content
    notification.innerHTML = `
      <div class="portal-notification-content">
        <h3>${title}</h3>
        <p>${message}</p>
      </div>
    `;

    // Make notification visible
    setTimeout(() => {
      notification.classList.add("visible");
    }, 10);

    // Hide notification after a few seconds
    setTimeout(() => {
      notification.classList.remove("visible");
    }, 4000);
  }, []);

  const hidePortalNotification = useCallback(() => {
    const notification = document.getElementById("portal-notification");
    if (notification) {
      notification.classList.remove("active");
      notification.classList.remove("visible");
    }
  }, []);

  // Reusable function for handling interactive portal notifications
  const createInteractiveNotification = useCallback(
    (title, message, conditionFn, actionFn, cleanupFn = null) => {
      if (!portalNotificationActive) {
        showPortalNotification(title, message);
        setPortalNotificationActive(true);

        const handleInteraction = (e) => {
          if (e.code === "Space" && conditionFn()) {
            // Play portal sound
            if (soundManager) {
              soundManager.playSound("portal");
            }

            actionFn();
            setPortalNotificationActive(false);
            document.removeEventListener("keydown", handleInteraction);

            if (cleanupFn) {
              cleanupFn();
            }
          }
        };

        document.addEventListener("keydown", handleInteraction);
      }
    },
    [portalNotificationActive, showPortalNotification, soundManager],
  );

  // API for external components to trigger notifications
  const addXPNotification = useCallback((amount, reason, position = null) => {
    if (position) {
      // Add positioned XP notification
      setXPNotifications((prev) => [
        ...prev,
        { amount, position, id: uuidv4() },
      ]);
    } else {
      // Add regular XP notification
      updateNotifications({
        xpNotifications: (prev) => [
          ...prev,
          { id: uuidv4(), amount, reason },
        ],
      });
    }
  }, [updateNotifications]);

  const addAchievementNotification = useCallback((achievement) => {
    updateNotifications({
      achievementNotifications: (prev) => [
        ...prev,
        { id: uuidv4(), achievement },
      ],
    });
  }, [updateNotifications]);

  // Expose API
  const notificationAPI = {
    addXPNotification,
    addAchievementNotification,
    showPortalNotification,
    hidePortalNotification,
    createInteractiveNotification,
    setPortalNotificationActive,
  };

  return (
    <NotificationProvider notificationAPI={notificationAPI}>
      {/* Positioned XP Notifications */}
      {xpNotifications.map((notification) => (
        <XPNotification
          key={notification.id}
          amount={notification.amount}
          position={notification.position}
          onComplete={() => {
            setXPNotifications((prev) =>
              prev.filter((n) => n.id !== notification.id),
            );
          }}
        />
      ))}

      {/* Regular XP Notifications */}
      <div className="notification-container">
        {notifications.xpNotifications.map((notification) => (
          <XPNotification
            key={notification.id}
            amount={notification.amount}
            reason={notification.reason}
            onClose={() => removeXpNotification(notification.id)}
          />
        ))}
      </div>

      {/* Achievement Notifications */}
      <div className="achievement-notification-container">
        {notifications.achievementNotifications.map((notification) => (
          <AchievementNotification
            key={notification.id}
            achievement={notification.achievement}
            onClose={() => removeAchievementNotification(notification.id)}
          />
        ))}
      </div>

      {/* Legacy achievement notification (single) */}
      {notifications.achievementNotification && (
        <AchievementNotification
          title={notifications.achievementNotification.title}
          description={notifications.achievementNotification.description}
          onClose={() => updateNotifications({ achievementNotification: null })}
        />
      )}
    </NotificationProvider>
  );
};

export default NotificationSystem;