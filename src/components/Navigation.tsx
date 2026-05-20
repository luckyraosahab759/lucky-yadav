import React from 'react';
import { Home, Film, PlusSquare, User, Search, LogOut } from 'lucide-react';
import { AppTab } from '../types';
import { useAuth } from '../context/AuthContext';

interface NavigationProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onOpenSearch: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, onOpenSearch }) => {
  const { currentUser, logout, isFirebaseMode } = useAuth();

  const navItems = [
    { id: 'feed' as AppTab, label: 'Feed', icon: Home },
    { id: 'reels' as AppTab, label: 'Reels', icon: Film },
    { id: 'upload' as AppTab, label: 'Upload', icon: PlusSquare },
    { id: 'search' as AppTab, label: 'Explore', icon: Search },
    { id: 'profile' as AppTab, label: 'Profile', icon: User },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR - Hidden on mobile, shown on md and larger */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-64 bg-[#0a0a0a] border-r border-white/5 text-[#e5e7eb] p-6 z-10 transition-all duration-300">
        {/* Brand Header */}
        <div className="flex items-center gap-2 mb-10 px-2 select-none">
          <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">
            S
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Socialize<span className="text-purple-500">.</span>
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group active:scale-98 ${
                  isActive
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-gray-400 hover:bg-white/5 hover:text-[#e5e7eb]'
                }`}
              >
                <IconComponent 
                  size={20} 
                  className={`transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? 'text-purple-500' : 'text-gray-400 group-hover:text-gray-200'
                  }`} 
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Footer Profile Summary */}
        {currentUser && (
          <div className="mt-auto pt-6 border-t border-white/5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-purple-600 to-pink-500 shrink-0">
                <div className="w-full h-full rounded-full bg-black border border-black overflow-hidden">
                  <img
                    src={currentUser.photoURL || 'https://via.placeholder.com/150'}
                    alt={currentUser.displayName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate">
                  {currentUser.displayName}
                </span>
                <span className="text-[10px] text-gray-500 truncate font-mono">
                  {currentUser.email}
                </span>
              </div>
            </div>

            {/* Cloud/Local Sync Sign Indicator */}
            <div className="flex items-center justify-between text-[10px] px-3 text-gray-400 bg-white/5 py-2 rounded-xl border border-white/5">
              <span>Sync Mode:</span>
              <span className={`font-semibold py-0.5 px-1.5 rounded text-[9px] leading-none ${
                isFirebaseMode ? 'bg-[#3b0764] text-purple-400 border border-purple-900/30' : 'bg-amber-950/40 text-amber-400 border border-amber-900/30'
              }`}>
                {isFirebaseMode ? 'Live Firebase' : 'Fallback Local'}
              </span>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-pink-500 hover:bg-pink-950/20 hover:text-pink-400 transition-all duration-200 w-full"
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR - Sticky on bottom, hidden on md */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-white/5 flex items-center justify-around text-gray-400 z-50 px-4">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center justify-center w-12 h-12 relative rounded-full group"
            >
              <IconComponent
                size={22}
                className={`transition-all duration-200 ${
                  isActive ? 'text-purple-500 scale-110' : 'text-gray-400 hover:text-white'
                }`}
              />
              {isActive && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-purple-500 shadow-lg shadow-purple-500" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
