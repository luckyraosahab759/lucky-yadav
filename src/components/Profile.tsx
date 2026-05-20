import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocial } from '../context/SocialContext';
import { Grid, Film, Settings, Edit3, Check, CheckCircle2, UserPlus, UserCheck, Inbox } from 'lucide-react';
import { Post, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ProfileProps {
  selectedUserUid: string | null;
  onSelectUser: (userUid: string | null) => void;
}

export const Profile: React.FC<ProfileProps> = ({ selectedUserUid, onSelectUser }) => {
  const { currentUser, allUsers, updateUserBioAndPhoto } = useAuth();
  const { posts, followingIds, followUser, unfollowUser } = useSocial();

  const [activeTab, setActiveTab2] = useState<'grids' | 'reels'>('grids');
  const [isEditing, setIsEditing] = useState(false);
  
  // Local edit states
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhoto, setEditPhoto] = useState('');

  // 1. Identify which profile to show
  const isOwnProfile = !selectedUserUid || (currentUser && selectedUserUid === currentUser.uid);
  const profileUser = isOwnProfile 
    ? currentUser 
    : allUsers.find(user => user.uid === selectedUserUid) || null;

  const isFollowing = profileUser ? followingIds.includes(profileUser.uid) : false;

  // Filter posts created by this user
  const userPosts = profileUser 
    ? posts.filter(post => post.userId === profileUser.uid) 
    : [];

  const photos = userPosts.filter(p => p.type === 'photo');
  const reels = userPosts.filter(p => p.type === 'reel');

  const startEditing = () => {
    if (!currentUser) return;
    setEditName(currentUser.displayName || '');
    setEditBio(currentUser.bio || '');
    setEditPhoto(currentUser.photoURL || '');
    setIsEditing(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    await updateUserBioAndPhoto(editName, editBio, editPhoto);
    setIsEditing(false);
  };

  const handleFollowAction = async () => {
    if (!profileUser) return;
    if (isFollowing) {
      await unfollowUser(profileUser.uid);
    } else {
      await followUser(profileUser.uid);
    }
  };

  if (!profileUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500 space-y-4">
        <Inbox size={48} />
        <h3 className="text-gray-300 font-bold">User profile not found</h3>
        <button 
          onClick={() => onSelectUser(null)}
          className="text-purple-400 font-semibold text-xs border border-purple-500/30 px-4 py-2 rounded-xl bg-purple-950/20"
        >
          Return to My Profile
        </button>
      </div>
    );
  }

  // Count helper representing dynamic local edits update since sync speeds depend
  const finalFollowersCount = isOwnProfile ? profileUser.followersCount : (profileUser.followersCount || 0);
  const finalFollowingCount = isOwnProfile ? profileUser.followingCount : (profileUser.followingCount || 0);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 pb-24 px-4 sm:px-0">
      
      {/* Back to feed navigation indicator */}
      {!isOwnProfile && (
        <div className="flex items-center gap-2 py-2">
          <button 
            onClick={() => onSelectUser(null)}
            className="text-xs font-semibold text-gray-400 hover:text-white flex items-center gap-1 bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg active:scale-95 transition-all outline-none"
          >
            ← Back to Feed
          </button>
          <span className="text-xs text-gray-700">/</span>
          <span className="text-xs text-gray-500 font-mono">Viewing profile of {profileUser.displayName}</span>
        </div>
      )}

      {/* Profile Header Block */}
      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 bg-[#0a0a0a]/65 p-6 sm:p-8 rounded-3xl border border-white/5">
        {/* User Image avatar */}
        <div className="relative group">
          <img
            src={profileUser.photoURL || 'https://via.placeholder.com/150'}
            alt={profileUser.displayName}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-white/5 ring-4 ring-purple-600/15"
            referrerPolicy="no-referrer"
          />
          {isOwnProfile && (
            <button
              onClick={startEditing}
              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-purple-600 hover:bg-purple-500 shadow border border-none text-white cursor-pointer active:scale-90"
            >
              <Edit3 size={12} />
            </button>
          )}
        </div>

        {/* User Details info */}
        <div className="flex-1 text-center sm:text-left space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-center sm:justify-start">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center justify-center sm:justify-start gap-1.5">
              {profileUser.displayName}
              <CheckCircle2 size={15} className="text-purple-500 fill-purple-950/20 stroke-[2.5]" />
            </h2>

            {/* Profile CTA trigger */}
            {isOwnProfile ? (
              <button
                onClick={startEditing}
                className="text-xs font-semibold px-4 py-1.5 rounded-xl border border-white/10 text-gray-300 bg-[#0a0a0a] hover:bg-white/5 active:scale-95 transition-transform"
              >
                Edit Profile
              </button>
            ) : (
              <button
                onClick={handleFollowAction}
                className={`text-xs font-bold px-4 py-1.5 rounded-xl border transition-all duration-300 flex items-center gap-1.5 mx-auto sm:mx-0 ${
                  isFollowing
                    ? 'border-white/5 bg-[#050505] hover:bg-white/5 text-gray-400'
                    : 'border-none bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-100 shadow-md active:scale-95'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck size={14} />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={14} />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Social Counts Info */}
          <div className="flex items-center justify-center sm:justify-start gap-8 font-sans select-none text-gray-200">
            <div className="text-center sm:text-left">
              <span className="text-base font-bold text-white block sm:inline mr-1">{userPosts.length}</span>
              <span className="text-xs text-gray-500 font-medium">posts</span>
            </div>
            <div className="text-center sm:text-left">
              <span className="text-base font-bold text-white block sm:inline mr-1">{finalFollowersCount}</span>
              <span className="text-xs text-gray-500 font-medium">followers</span>
            </div>
            <div className="text-center sm:text-left">
              <span className="text-base font-bold text-white block sm:inline mr-1">{finalFollowingCount}</span>
              <span className="text-xs text-gray-500 font-medium">following</span>
            </div>
          </div>

          {/* User Bio biography */}
          <div className="space-y-1">
            <p className="text-xs text-gray-550 font-mono font-bold leading-none truncate">@{profileUser.email.split('@')[0]}</p>
            {profileUser.bio ? (
              <p className="text-xs text-gray-300 max-w-sm mx-auto sm:mx-0 leading-relaxed font-sans mt-2">
                {profileUser.bio}
              </p>
            ) : (
              <p className="text-xs text-gray-605 italic pt-1">No biography added yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit modal collapse overlay */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 select-text"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#0a0a0a]/95 border border-white/10 p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl relative"
            >
              <h3 className="text-base font-bold text-white mb-6">Edit Profile details</h3>
              
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Display Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 px-4 py-2.5 rounded-xl text-xs text-gray-200 outline-none focus:border-purple-500 transition-colors font-semibold select-text"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Biography Bio</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={3}
                    maxLength={160}
                    className="w-full bg-[#050505] border border-white/10 px-4 py-2.5 rounded-xl text-xs text-gray-200 outline-none focus:border-purple-500 transition-colors resize-none font-semibold"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Avatar Image URL</label>
                  <input
                    type="url"
                    value={editPhoto}
                    onChange={(e) => setEditPhoto(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 px-4 py-2.5 rounded-xl text-xs text-gray-200 outline-none focus:border-purple-500 transition-colors font-semibold select-text"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <div className="flex gap-3 pt-4 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-xs px-4 py-2 rounded-xl border border-white/5 text-gray-400 bg-[#050505] hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-xs px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-1 shadow-lg active:scale-95 transition-transform border-none cursor-pointer"
                  >
                    <Check size={14} />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid Filter tab controllers */}
      <div className="space-y-4">
        {/* Toggle select items tab */}
        <div className="flex border-b border-white/5 select-none">
          <button
            onClick={() => setActiveTab2('grids')}
            className={`flex items-center justify-center gap-2 flex-1 pb-3 text-xs font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
              activeTab === 'grids'
                ? 'border-purple-500 text-white font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Grid size={14} />
            <span>Photos ({photos.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab2('reels')}
            className={`flex items-center justify-center gap-2 flex-1 pb-3 text-xs font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
              activeTab === 'reels'
                ? 'border-purple-500 text-white font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Film size={14} />
            <span>Reels ({reels.length})</span>
          </button>
        </div>

        {/* Display photos elements */}
        {activeTab === 'grids' ? (
          photos.length === 0 ? (
            <div className="py-20 text-center text-gray-550 text-xs bg-[#0a0a0a]/40 rounded-2xl border border-white/5">
              <Grid size={32} className="mx-auto text-gray-700 mb-2" />
              <p className="font-semibold text-gray-400">No Photos Uploaded</p>
              <p className="text-xxs text-gray-600 mt-1">Uploaded images will appear in this dynamic grid layout.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
              {photos.map((post) => (
                <div 
                  key={post.id}
                  className="aspect-square bg-[#0a0a0a] relative group overflow-hidden rounded-xl border border-white/5"
                >
                  <img
                    src={post.mediaUrl}
                    alt={post.caption || 'Grid item'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 border-none"
                    loading="lazy"
                  />
                  
                  {/* Overlay stats indicators on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-xs select-none pointer-events-none">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Grid size={13} className="text-purple-500 fill-purple-500/20" />
                      {post.likesCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Display reels elements */
          reels.length === 0 ? (
            <div className="py-20 text-center text-gray-550 text-xs bg-[#0a0a0a]/40 rounded-2xl border border-white/5">
              <Film size={32} className="mx-auto text-gray-700 mb-2" />
              <p className="font-semibold text-gray-400">No Video Reels Recorded</p>
              <p className="text-xxs text-gray-600 mt-1">Film clips to share active vertical stories.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
              {reels.map((post) => (
                <div 
                  key={post.id}
                  className="aspect-[9/16] bg-[#0a0a0a] relative group overflow-hidden rounded-xl border border-white/5"
                >
                  {/* Since thumbnail is video itself, render silent video loop or first frame poster */}
                  <video
                    src={post.mediaUrl}
                    muted
                    preload="metadata"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 border-none"
                  />
                  
                  <div className="absolute bottom-3 left-3 bg-black/80 px-2 py-0.5 rounded text-[8px] font-mono text-gray-400 font-bold border border-white/5">
                    REEL CC
                  </div>

                  {/* Stats hover panel overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-xs select-none pointer-events-none">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Film size={13} className="text-purple-500" />
                      {post.likesCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

    </div>
  );
};
