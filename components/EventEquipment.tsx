import React, { useState } from 'react';
import { Event, User } from '../types';

interface EventEquipmentProps {
  event: Event;
  currentUser: User;
  isOrganizer: boolean;
  isParticipant: boolean;
  isPast: boolean;
  onClaimItem: (itemId: string, claim: boolean) => void;
  onMarkAsProvided: (itemId: string, provided: boolean) => void;
  onAddItem: (itemName: string) => void;
  claimingItemId: string | null;
  providingItemId: string | null;
}

const EventEquipment: React.FC<EventEquipmentProps> = ({
  event,
  currentUser,
  isOrganizer,
  isParticipant,
  isPast,
  onClaimItem,
  onMarkAsProvided,
  onAddItem,
  claimingItemId,
  providingItemId
}) => {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [isSavingNewItem, setIsSavingNewItem] = useState(false);

  const handleSaveNewItem = async () => {
    if (!newItemName.trim()) {
      setIsAddingItem(false);
      return;
    }
    setIsSavingNewItem(true);
    await onAddItem(newItemName.trim());
    setIsSavingNewItem(false);
    setIsAddingItem(false);
    setNewItemName('');
  };

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-800 mb-3 flex justify-between items-center">
        <span>What to Bring</span>
        {isOrganizer && !isAddingItem && !isPast && (
          <button 
            onClick={() => setIsAddingItem(true)} 
            className="text-sm font-semibold text-teal-600 hover:text-teal-800 bg-teal-100 hover:bg-teal-200 px-3 py-1 rounded-md transition flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Item
          </button>
        )}
      </h3>

      {isAddingItem && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg mb-3 border border-teal-200">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="New item name..."
            autoFocus
            disabled={isSavingNewItem}
            className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          />
          <button 
            onClick={handleSaveNewItem} 
            disabled={isSavingNewItem || !newItemName.trim()} 
            className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-wait"
          >
            {isSavingNewItem ? 'Saving...' : 'Save'}
          </button>
          <button 
            onClick={() => setIsAddingItem(false)} 
            disabled={isSavingNewItem} 
            className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      )}

      {event.equipment.length > 0 ? (
        <ul className="space-y-2">
          {event.equipment.map(item => {
            const claimant = item.claimedBy ? event.participants.find(p => p.id === item.claimedBy) : null;
            const isClaimedByCurrentUser = item.claimedBy === currentUser.id;
            const isActionInProgress = claimingItemId === item.id || providingItemId === item.id;
            const canManageProvidedStatus = (isClaimedByCurrentUser || isOrganizer) && !!item.claimedBy;

            return (
              <li key={item.id} className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${item.isProvided ? 'bg-green-50' : 'bg-gray-50/70 hover:bg-gray-100'}`}>
                <div className="flex items-center">
                  {item.isProvided && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  <div>
                    <span className={`font-medium ${item.isProvided ? 'line-through text-gray-500' : 'text-gray-800'}`}>{item.name}</span>
                    {claimant && (
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <img src={claimant.avatarUrl} alt={claimant.name} className="w-4 h-4 rounded-full mr-1.5" />
                        <span>Brought by <span className="font-semibold">{isClaimedByCurrentUser ? 'You' : claimant.name}</span></span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 min-w-[150px] justify-end">
                  {isActionInProgress ? (
                    <span className="text-sm text-gray-500">Updating...</span>
                  ) : (
                    <>
                      {isParticipant && !claimant && (
                        <button 
                          onClick={() => onClaimItem(item.id, true)} 
                          className="flex items-center text-sm font-semibold text-teal-600 hover:text-teal-800 bg-teal-100 hover:bg-teal-200 px-3 py-1 rounded-md transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                          Claim
                        </button>
                      )}
                      {isClaimedByCurrentUser && !item.isProvided && (
                        <button 
                          onClick={() => onClaimItem(item.id, false)} 
                          className="flex items-center text-sm font-semibold text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          Unclaim
                        </button>
                      )}
                      {canManageProvidedStatus && (
                        <button 
                          onClick={() => onMarkAsProvided(item.id, !item.isProvided)} 
                          className={`flex items-center text-sm font-semibold px-3 py-1 rounded-md transition ${
                            item.isProvided 
                              ? 'text-yellow-600 hover:text-yellow-800 bg-yellow-100 hover:bg-yellow-200' 
                              : 'text-green-600 hover:text-green-800 bg-green-100 hover:bg-green-200'
                          }`}
                        >
                          {item.isProvided ? (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                              </svg>
                              Undo
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Provided
                            </>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        !isAddingItem && <p className="text-gray-500 italic p-3 bg-gray-50 rounded-md">No equipment has been listed for this event yet.</p>
      )}
    </div>
  );
};

export default EventEquipment;