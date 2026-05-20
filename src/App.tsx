import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocialProvider, useSocial } from './context/SocialContext';
import { Navigation } from './components/Navigation';
import { Feed } from './components/Feed';
import { ReelPlayer } from './components/ReelPlayer';
import { Profile } from './components/Profile';
import { PostUpload } from './components/PostUpload';
import { ExploreSearch } from './components/ExploreSearch';
import { Auth } from './components/Auth';
import { AppTab } from './types';
import { ChevronUp, ChevronDown, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { currentUser, isLoading } = useAuth();
  const { posts } = useSocial();
  
  const [activeTab, setActiveTab] = useState<AppTab>('feed');
  const [selectedUserUid, setSelectedUserUid] = useState<string | null>(null);

  // Reels sound mute state (shares globally across individual video players)
  const [isReelsMuted, setIsReelsMuted] = useState(true);

  // Active video index for reels feed
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  // Filter out just the reels for the reels scroll feed
  const reelPosts = posts.filter(post => post.type === 'reel');

  // Handle avatar click redirects
  const handleSelectUser = (userUid: string | null) => {
    setSelectedUserUid(userUid);
    setActiveTab('profile');
  };

  // Reset selected user when explicitly navigating to profile in navbar
  const handleTabChange = (tab: AppTab) => {
    if (tab === 'profile') {
      setSelectedUserUid(null); // Load own profile
    }
    setActiveTab(tab);
  };

  // Display a beautiful visual spinner during authentication state checks
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center font-mono text-xs text-zinc-500 space-y-3 select-none">
        <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-r-2 border-pink-500 border-zinc-800"></div>
        <p className="tracking-widest uppercase">INITIALIZING SOCIAL CORE...</p>
      </div>
    );
  }

  // Redirect to sign in sheet if user session is absent
  if (!currentUser) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e7eb] flex flex-col md:flex-row select-none selection:bg-purple-600 selection:text-white antialiased font-sans relative overflow-x-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] bg-purple-900/15 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-blue-900/15 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Dynamic left side margins for widescreen sidebar */}
      <div className="relative z-10 flex flex-col md:flex-row flex-1 min-w-0">
        <Navigation 
          activeTab={activeTab} 
          setActiveTab={handleTabChange} 
          onOpenSearch={() => setActiveTab('search')}
        />

        {/* Main Screen Layout content panel */}
        <main className="flex-1 md:ml-64 min-h-screen flex flex-col min-w-0 relative">
          
          {/* Top Header - Mobile viewports only */}
          <header className="md:hidden flex h-16 items-center justify-between px-6 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-lg flex items-center justify-center font-bold text-white select-none">
                S
              </div>
              <span className="text-lg font-bold tracking-tight text-white select-none">
                Socialize<span className="text-purple-500">.</span>
              </span>
            </div>

            <button 
              onClick={() => handleTabChange('search')}
              className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg text-gray-300 active:scale-95 transition-all"
            >
              Explore
            </button>
          </header>

          {/* Dynamic Route views panel */}
          <div className="flex-1 relative z-10 px-4 md:px-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + (selectedUserUid || '')}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="h-full"
              >
                
                {activeTab === 'feed' && (
                  <div className="pt-2 sm:pt-6">
                    <Feed onSelectUser={handleSelectUser} />
                  </div>
                )}

                {activeTab === 'reels' && (
                  /* Dynamic scroll container for vertical reels */
                  <div className="max-w-md mx-auto pt-4 sm:pt-8 min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center relative gap-4 px-4 sm:px-0">
                    
                    {reelPosts.length === 0 ? (
                      <div className="text-center py-24 text-gray-400 text-xs bg-[#0a0a0a] border border-white/5 p-8 rounded-3xl w-full">
                        <Compass size={40} className="mx-auto text-gray-600 mb-2" />
                        <p className="font-bold text-gray-200">No reels found</p>
                        <p className="text-[10px] text-gray-550 mt-1 max-w-xs mx-auto">
                          Be the first to record a reel! Hop over to the Publish screen.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Interactive scroll card */}
                        <ReelPlayer
                          post={reelPosts[activeVideoIndex]}
                          isActive={activeTab === 'reels'}
                          isMuted={isReelsMuted}
                          onToggleMute={() => setIsReelsMuted(!isReelsMuted)}
                          onSelectUser={handleSelectUser}
                        />

                        {/* Floating Indicator with switcher buttons */}
                        <div className="flex items-center gap-3 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 p-2 rounded-2xl select-none z-10 shadow-lg shadow-black/40">
                          <button
                            disabled={activeVideoIndex === 0}
                            onClick={() => setActiveVideoIndex(prev => Math.max(0, prev - 1))}
                            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-20 disabled:hover:text-gray-400 transition-colors"
                          >
                            <ChevronUp size={16} />
                          </button>
                          
                          <span className="text-[11px] font-mono font-bold text-gray-300">
                            {activeVideoIndex + 1} / {reelPosts.length}
                          </span>
                          
                          <button
                            disabled={activeVideoIndex === reelPosts.length - 1}
                            onClick={() => setActiveVideoIndex(prev => Math.min(reelPosts.length - 1, prev + 1))}
                            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-20 disabled:hover:text-gray-400 transition-colors"
                          >
                            <ChevronDown size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'upload' && (
                  <div className="pt-4 sm:pt-8">
                    <PostUpload onSuccess={() => setActiveTab('feed')} />
                  </div>
                )}

                {activeTab === 'profile' && (
                  <div className="pt-2 sm:pt-6">
                    <Profile 
                      selectedUserUid={selectedUserUid} 
                      onSelectUser={handleSelectUser} 
                    />
                  </div>
                )}

                {activeTab === 'search' && (
                  <div className="pt-2 sm:pt-6">
                    <ExploreSearch onSelectUser={handleSelectUser} />
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocialProvider>
        <AppContent />
      </SocialProvider>
    </AuthProvider>
  );
}
