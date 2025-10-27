import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onNavigateToProfile: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onNavigateToProfile }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
            <h1 className="ml-3 text-2xl font-bold text-teal-700">Eco-Cleanup Crew</h1>
          </div>
          <div className="flex items-center">
            <span className="text-gray-700 mr-4 hidden sm:block">Welcome, {user.name}</span>
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen(!dropdownOpen)} className="block h-10 w-10 rounded-full overflow-hidden border-2 border-transparent focus:outline-none focus:border-teal-500">
                <img className="h-full w-full object-cover" src={user.avatarUrl} alt="User avatar" />
              </button>
              {dropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <button
                    onClick={() => { onNavigateToProfile(); setDropdownOpen(false); }}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    My Profile
                  </button>
                  <button
                    onClick={() => { onLogout(); setDropdownOpen(false); }}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;