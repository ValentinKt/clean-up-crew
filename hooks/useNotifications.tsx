import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { Notification, NotificationType } from '../types';

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (type: NotificationType, title: string, message: string) => void;
    removeNotification: (id: string) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return { addNotification: context.addNotification };
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const addNotification = useCallback((type: NotificationType, title: string, message: string) => {
        const id = new Date().getTime().toString() + Math.random().toString();
        setNotifications(prev => [...prev, { id, type, title, message }]);

        setTimeout(() => {
            removeNotification(id);
        }, 5000);
    }, [removeNotification]);

    const value = { notifications, addNotification, removeNotification };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
