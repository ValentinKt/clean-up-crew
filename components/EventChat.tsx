import React, { useState } from 'react';
import { Event, User } from '../types';

interface EventChatProps {
  event: Event;
  currentUser: User;
  isParticipant: boolean;
  onPostMessage: (message: string) => Promise<void>;
  onViewProfile: (userId: string) => void;
  chatContainerRef: React.RefObject<HTMLDivElement>;
}

const EventChat: React.FC<EventChatProps> = ({
  event,
  currentUser,
  isParticipant,
  onPostMessage,
  onViewProfile,
  chatContainerRef
}) => {
  const [chatMessage, setChatMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const handlePostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      await onPostMessage(chatMessage.trim());
      setChatMessage('');
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (!isParticipant) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg text-center text-gray-600">
        Join the event to participate in the chat.
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg h-96 flex flex-col">
      <h3 className="text-lg font-bold text-gray-800 mb-2">Participant Chat</h3>
      <div ref={chatContainerRef} className="flex-grow overflow-y-auto space-y-4 pr-2">
        {event.chat.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 italic">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          event.chat.map(msg => (
            <div key={msg.id} className={`flex items-start gap-2.5 ${msg.user.id === currentUser.id ? 'justify-end' : ''}`}>
              {msg.user.id !== currentUser.id && (
                <img 
                  className="w-8 h-8 rounded-full cursor-pointer" 
                  src={msg.user.avatarUrl} 
                  alt={msg.user.name} 
                  onClick={() => onViewProfile(msg.user.id)} 
                />
              )}
              <div className={`flex flex-col max-w-[320px] leading-1.5 p-3 rounded-xl ${
                msg.user.id === currentUser.id 
                  ? 'bg-teal-500 text-white rounded-br-none' 
                  : 'bg-gray-200 rounded-bl-none'
              }`}>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <span className={`text-sm font-semibold ${msg.user.id === currentUser.id ? '' : 'text-gray-900'}`}>
                    {msg.user.id === currentUser.id ? 'You' : msg.user.name}
                  </span>
                  <span className={`text-xs font-normal ${
                    msg.user.id === currentUser.id ? 'text-teal-100' : 'text-gray-500'
                  }`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <p className="text-sm font-normal py-1 break-words">{msg.message}</p>
              </div>
              {msg.user.id === currentUser.id && (
                <img 
                  className="w-8 h-8 rounded-full cursor-pointer" 
                  src={msg.user.avatarUrl} 
                  alt={msg.user.name} 
                  onClick={() => onViewProfile(msg.user.id)} 
                />
              )}
            </div>
          ))
        )}
      </div>
      <form onSubmit={handlePostMessage} className="mt-4 flex">
        <input
          type="text"
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={isSendingMessage}
          className="flex-grow p-2 border rounded-l-md focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100"
        />
        <button 
          type="submit" 
          disabled={isSendingMessage} 
          className="bg-teal-600 text-white p-2 rounded-r-md hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-wait flex items-center justify-center w-20 transition-colors"
        >
          {isSendingMessage ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default EventChat;