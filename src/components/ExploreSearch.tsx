import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocial } from '../context/SocialContext';
import { Search, Flame, UserCheck, UserPlus, Image, Film, Sparkles, AlertCircle } from 'lucide-react';
import { UserProfile, Post } from '../types';

interface ExploreSearchProps {
  onSelectUser: (userUid: string) => void;
}

const TRENDING_HASHTAGS = [
  { tag: 'cinematography', count: '14.2K' },
  { tag: 'streetphotography', count: '28.9K' },
  { tag: 'stargazing', count: '8.4K' },
  { tag: 'developerlife', count: '32.1K' },
  { tag: 'darkmode', count: '94.5K' }
];

export const ExploreSearch: React.FC<ExploreSearchProps> = ({ onSelectUser }) => {
  const { currentUser, allUsers } = useAuth();
  const { posts, followingIds, followUser, unfollowUser } = useSocial();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 1. Search users based on query (displayName or bio or email)
  const filteredUsers = allUsers.filter(user => {
    // Exclude current user from search
    if (currentUser && user.uid === currentUser.uid) return false;

    const query = searchQuery.toLowerCase();
    return (
      user.displayName.toLowerCase().includes(query) ||
      (user.bio && user.bio.toLowerCase().includes(query)) ||
      user.email.toLowerCase().includes(query)
    );
  });

  // 2. Filter posts based on hashtag click or general explore
  const filteredPosts = posts.filter(post => {
    if (selectedTag) {
      return post.caption && post.caption.toLowerCase().includes(`#${selectedTag.toLowerCase()}`);
    }
    return true; // Return all posts in bento grid otherwise
  });

  const handleFollowToggle = async (userId: string, isFollowing: boolean) => {
    if (isFollowing) {
      await unfollowUser(userId);
    } else {
      await followUser(userId);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 pb-24 px-4 sm:px-0 select-none">
      
      {/* Header Search Input */}
      <div className="space-y-4">
        <div className="relative mt-4">
          <Search size={16} className="absolute left-4 top-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search creators by name, tags, or bio details..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedTag(null); // Clear hashtag filter when typing search
            }}
            className="w-full bg-white/5 border border-white/10 px-11 py-3 text-xs text-gray-300 rounded-2xl outline-none focus:border-purple-500 transition-colors placeholder-gray-500 select-text font-semibold"
          />
        </div>
      </div>

      {/* Recommended profiles tray if search is empty or has results */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase flex items-center gap-2">
          <Sparkles size={13} className="text-purple-500" />
          <span>Recommended Creators</span>
        </h3>

        {filteredUsers.length === 0 ? (
          <div className="bg-[#0a0a0a]/40 border border-white/5 rounded-2xl p-6 text-center text-gray-500 text-xs">
            <AlertCircle size={18} className="mx-auto text-gray-600 mb-2" />
            <p className="font-semibold">No creators match your parameters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredUsers.slice(0, 4).map((user) => {
               const isFollowing = followingIds.includes(user.uid);
               return (
                 <div 
                   key={user.uid}
                   className="bg-[#0a0a0a]/65 border border-white/5 p-4 rounded-2xl flex items-center justify-between gap-4 hover:border-white/10 transition-colors"
                 >
                   <button 
                     onClick={() => onSelectUser(user.uid)}
                     className="flex items-center gap-3 text-left focus:outline-none flex-1 min-w-0"
                   >
                     <img 
                       src={user.photoURL || 'https://via.placeholder.com/150'} 
                       alt={user.displayName} 
                       className="w-10 h-10 rounded-full object-cover border border-white/5 shrink-0 animate-fade-in"
                       referrerPolicy="no-referrer"
                     />
                     <div className="min-w-0">
                       <h4 className="text-xs font-bold text-gray-200 truncate">{user.displayName}</h4>
                       <p className="text-[10px] text-gray-500 truncate font-mono">@{user.email.split('@')[0]}</p>
                       {user.bio && (
                         <p className="text-[10px] text-gray-400 mt-1 line-clamp-1 italic">{user.bio}</p>
                       )}
                     </div>
                   </button>

                   <button
                     onClick={() => handleFollowToggle(user.uid, isFollowing)}
                     className={`p-2 rounded-xl border transition-all active:scale-95 ${
                       isFollowing 
                         ? 'border-white/5 bg-black/40 text-gray-500' 
                         : 'border-none bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
                     }`}
                   >
                     {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
                   </button>
                 </div>
               );
            })}
          </div>
        )}
      </div>

      {/* Hot Trend items and hashtag lists */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase flex items-center gap-2">
          <Flame size={13} className="text-purple-400" />
          <span>Trending Hashtags</span>
        </h3>

        <div className="flex flex-wrap gap-2.5">
          {TRENDING_HASHTAGS.map(({ tag, count }) => {
            const isSelected = selectedTag?.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                onClick={() => {
                  if (isSelected) {
                    setSelectedTag(null);
                  } else {
                    setSelectedTag(tag);
                    setSearchQuery(''); // Clear general query
                  }
                }}
                className={`text-[11px] font-semibold tracking-tight px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white border-none shadow-md shadow-purple-500/15' 
                    : 'bg-[#0a0a0a] border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                }`}
              >
                <span>#{tag}</span>
                <span className={`text-[9px] font-mono ml-2 font-medium ${isSelected ? 'text-pink-200' : 'text-gray-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bento content grid of matching posts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase">
            {selectedTag ? `Results for #${selectedTag}` : 'Explore Visuals'}
          </h3>
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="text-[10px] font-bold text-gray-500 hover:text-gray-300"
            >
              Clear filter
            </button>
          )}
        </div>

        {filteredPosts.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-xs bg-[#0a0a0a]/40 rounded-2xl border border-white/5">
            <p className="font-semibold mb-1">No matches in media</p>
            <p className="text-xxs text-gray-600">Try uploading a photo or reel containing this interest tag!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredPosts.map((post) => (
              <div 
                key={post.id}
                onClick={() => onSelectUser(post.userId)}
                className="aspect-square bg-[#0a0a0a] rounded-2xl overflow-hidden relative group border border-white/5 cursor-pointer"
              >
                {post.type === 'photo' ? (
                  <img src={post.mediaUrl} alt={post.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 border-none" />
                ) : (
                  <video src={post.mediaUrl} muted preload="metadata" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 border-none" />
                )}

                {/* Cover label icon type */}
                <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-sm p-1.5 rounded-lg border border-white/5 text-gray-300 z-5">
                  {post.type === 'photo' ? <Image size={11} /> : <Film size={11} />}
                </div>

                {/* Dark Hover description */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3.5 text-left text-white leading-normal select-none">
                  <span className="text-[10px] font-bold truncate block">{post.displayName}</span>
                  {post.caption && (
                    <span className="text-[9px] text-gray-400 line-clamp-2 mt-0.5 font-sans leading-relaxed">
                      {post.caption}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
