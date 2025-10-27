import React, { useContext } from 'react';
import { NotificationContext } from '../hooks/useNotifications';
import Notification from './Notification';

const NotificationContainer: React.FC = () => {
    const context = useContext(NotificationContext);

    if (!context) {
        return null;
    }
    
    const { notifications, removeNotification } = context;

    return (
        <div className="fixed top-4 right-4 z-50 w-full max-w-sm space-y-3" aria-live="assertive">
            {notifications.map(notification => (
                <Notification
                    key={notification.id}
                    notification={notification}
                    onClose={removeNotification}
                />
            ))}
        </div>
    );
};

export default NotificationContainer;
