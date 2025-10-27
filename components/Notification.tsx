import React, { useState, useEffect } from 'react';
import { Notification as NotificationData } from '../types';

const icons = {
  info: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  error: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const styles = {
  info: { bg: 'bg-blue-500', text: 'text-blue-50' },
  success: { bg: 'bg-green-500', text: 'text-green-50' },
  warning: { bg: 'bg-yellow-500', text: 'text-yellow-50' },
  error: { bg: 'bg-red-500', text: 'text-red-50' },
};


interface NotificationProps {
    notification: NotificationData;
    onClose: (id: string) => void;
}

const Notification: React.FC<NotificationProps> = ({ notification, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Animate in
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose(notification.id);
        }, 300); // Duration of the exit animation
    };

    const style = styles[notification.type];

    return (
        <div
            className={`
                relative w-full rounded-md shadow-lg p-4 flex items-start gap-4 transition-all duration-300 ease-in-out
                ${style.bg} ${style.text}
                ${isVisible && !isExiting ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
            `}
            role="alert"
        >
            <div className="flex-shrink-0">{icons[notification.type]}</div>
            <div className="flex-grow">
                <p className="font-bold">{notification.title}</p>
                <p className="text-sm">{notification.message}</p>
            </div>
            <button
                onClick={handleClose}
                className="flex-shrink-0 p-1 -m-1 rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Close notification"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default Notification;
