import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Compass, Users, Clock, Trash2, Send } from 'lucide-react';
import { Post, Comment } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSocial } from '../context/SocialContext';
import { motion, AnimatePresence } from 'motion/react';

interface FeedProps {
  onSelectUser: (userUid: string) => void;
}

export const Feed: React.FC<FeedProps> = ({ onSelectUser }) => {
  const { currentUser } = useAuth();
  const { 
    posts, 
    isLoadingPosts, 
    followingIds, 
    toggleLikePost, 
    addComment, 
    getComments, 
    postLikes, 
    commentsByPost,
    deleteComment
  } = useSocial();

  const [feedFilter, setFeedFilter] = useState<'all' | 'following'>('all');
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [newCommentsText, setNewCommentsText] = useState<{ [postId: string]: string }>({});

  // Filter posts based on tab
  const filteredPosts = posts.filter(post => {
    if (feedFilter === 'following') {
      return followingIds.includes(post.userId);
    }
    return true; // Return all on Explore
  });

  const handleToggleComments = async (postId: string) => {
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null);
    } else {
      setActiveCommentsPostId(postId);
      await getComments(postId);
    }
  };

  const handlePostLike = (postId: string) => {
    toggleLikePost(postId);
  };

  const handleAddComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = newCommentsText[postId] || '';
    if (!text.trim()) return;

    setNewCommentsText(prev => ({ ...prev, [postId]: '' }));
    await addComment(postId, text);
    // Refresh list
    await getComments(postId);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-24">
      
      {/* Feed Filters Header */}
      <div className="bg-[#050505]/60 sticky top-0 backdrop-blur-md z-15 py-4 border-b border-white/5 flex items-center justify-between px-4 sm:px-0">
        <h2 className="text-xl font-bold tracking-tight text-white select-none">Feed</h2>
        
        {/* Toggle Controls */}
        <div className="flex bg-[#0a0a0a] p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setFeedFilter('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
              feedFilter === 'all'
                ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Compass size={14} />
            <span>Explore All</span>
          </button>
          
          <button
            onClick={() => setFeedFilter('following')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
              feedFilter === 'following'
                ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users size={14} />
            <span>Following</span>
          </button>
        </div>
      </div>

      {/* Loading state spinner */}
      {isLoadingPosts ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 space-y-3 font-mono text-xs">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-pink-500 border-t-transparent"></div>
          <span>SYNCING CLOUD IMAGES...</span>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-400">
          <Clock size={40} className="mx-auto text-zinc-600 mb-3" />
          <h3 className="text-sm font-bold text-zinc-300 mb-1">No Posts Found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {feedFilter === 'following' 
              ? "You are not following anyone yet or they haven't posted. Hop over to 'Explore All' to find active creators." 
              : "Looks quiet here. Be the first to capture a photo or film a reel!"}
          </p>
        </div>
      ) : (
        /* Posts Scroll Containers */
        <div className="space-y-6">
          {filteredPosts.map((post) => {
            const likes = postLikes[post.id] || [];
            const isLiked = currentUser ? likes.includes(currentUser.uid) : false;
            const comments = commentsByPost[post.id] || [];

            return (
              <motion.article
                layout
                key={post.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0a0a0a]/90 border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative"
              >
                {/* 1. Header Profile details */}
                <div className="p-4 flex items-center justify-between border-b border-white/5">
                  <button
                    onClick={() => onSelectUser(post.userId)}
                    className="flex items-center gap-3 hover:opacity-90 select-none group focus:outline-none text-left"
                  >
                    <img
                      src={post.userPhotoURL || 'https://via.placeholder.com/150'}
                      alt={post.displayName}
                      className="w-10 h-10 rounded-full object-cover border border-white/5 hover:border-purple-500 transition-colors"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-semibold text-gray-200 group-hover:text-purple-400 transition-colors">
                        {post.displayName}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </button>

                  {/* Indicator badlet type */}
                  <span className="text-[9px] uppercase tracking-wider bg-white/5 text-gray-400 py-1 px-2.5 rounded-full border border-white/5 font-semibold font-mono">
                    {post.type}
                  </span>
                </div>

                {/* 2. Visual Content Area */}
                <div 
                  className="w-full relative bg-black/40 overflow-hidden cursor-pointer"
                  onClick={() => handlePostLike(post.id)}
                >
                  {post.type === 'reel' ? (
                    /* Embedded Reel video element */
                    <div className="aspect-square flex items-center justify-center relative bg-black">
                      <video
                        src={post.mediaUrl}
                        muted
                        controls
                        className="w-full h-full object-cover max-h-[500px]"
                      />
                      <div className="absolute top-3 left-3 bg-[#0a0a0a]/90 px-2.5 py-1 rounded text-[10px] font-bold text-gray-300 backdrop-blur-sm shadow border border-white/5 font-mono">
                        REEL PREVIEW
                      </div>
                    </div>
                  ) : (
                    /* Standard photo image element */
                    <img
                      src={post.mediaUrl}
                      alt={post.caption || 'Upload image'}
                      className="w-full h-auto object-cover max-h-[550px] aspect-square"
                      loading="lazy"
                    />
                  )}
                </div>

                {/* 3. Action Toggles Panels */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3 text-gray-200">
                    <div className="flex items-center gap-4">
                      {/* Like Trigger */}
                      <button
                        onClick={() => handlePostLike(post.id)}
                        className={`group p-1.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 transition-colors ${
                          isLiked ? 'text-pink-500 border-pink-500/20' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Heart
                          size={18}
                          className={`transition-all duration-200 active:scale-130 group-hover:scale-105 ${
                            isLiked ? 'fill-pink-500 stroke-pink-500' : ''
                          }`}
                        />
                      </button>

                      {/* Comment toggle trigger */}
                      <button
                        onClick={() => handleToggleComments(post.id)}
                        className={`p-1.5 bg-white/5 hover:bg-white/10 rounded-full border transition-all active:scale-95 ${
                          activeCommentsPostId === post.id 
                            ? 'text-purple-400 border-purple-500/30 bg-purple-950/15' 
                            : 'text-gray-400 hover:text-white border-white/5'
                        }`}
                      >
                        <MessageCircle size={18} className="hover:scale-105 transition-transform" />
                      </button>
                    </div>

                    {/* Copy Share links */}
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(post.mediaUrl);
                        alert("Visual resource link copied to clip!");
                      }}
                      className="p-1.5 hover:text-white text-gray-400 bg-white/5 rounded-full hover:bg-white/10 border border-white/5"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>

                  {/* Likes Count Summary */}
                  <p className="text-xs font-bold text-gray-300 mb-2">
                    {likes.length || post.likesCount} {likes.length === 1 ? 'like' : 'likes'}
                  </p>

                  {/* Caption */}
                  {post.caption && (
                    <p className="text-xs text-gray-300 leading-relaxed font-sans mb-2">
                      <span className="font-bold text-gray-200 mr-2 hover:text-purple-400 cursor-pointer" onClick={() => onSelectUser(post.userId)}>
                        {post.displayName}
                      </span>
                      {post.caption}
                    </p>
                  )}

                  {/* Comment Trigger indicators */}
                  <button
                    onClick={() => handleToggleComments(post.id)}
                    className="text-[11px] text-gray-500 font-medium hover:text-gray-400 block tracking-tight mt-1"
                  >
                    {comments.length > 0 
                      ? `View all ${comments.length} comments` 
                      : 'Add a comment...'}
                  </button>

                  {/* 4. Real-time Dropdown Comments Tray */}
                  <AnimatePresence>
                    {activeCommentsPostId === post.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-t border-white/5 mt-4 pt-4 whitespace-normal"
                      >
                        {/* Comments scrolling stack */}
                        <div className="max-y-[320px] overflow-y-auto space-y-3 pb-4 pr-1 select-text">
                          {comments.length === 0 ? (
                            <p className="text-center py-6 text-[10px] text-gray-600 font-sans tracking-wide">
                              NO USER COMMENTS REGISTERED. ADD YOUR REFLECTIONS BELOW.
                            </p>
                          ) : (
                            comments.map((comment) => (
                              <div key={comment.id} className="flex gap-2.5 items-start text-left">
                                <img
                                  src={comment.userPhotoURL || 'https://via.placeholder.com/150'}
                                  alt={comment.displayName}
                                  className="w-7 h-7 rounded-full object-cover border border-white/5 mt-0.5"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="flex-1 bg-[#050505]/60 p-2.5 rounded-xl text-xs border border-white/5 leading-relaxed">
                                  <div className="flex justify-between items-center mb-1">
                                    <span 
                                      className="font-bold text-gray-300 hover:text-purple-400 cursor-pointer"
                                      onClick={() => onSelectUser(comment.userId)}
                                    >
                                      {comment.displayName}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[9px] text-gray-500 font-mono">
                                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                      
                                      {/* Option to delete own comments */}
                                      {currentUser && (currentUser.uid === comment.userId || currentUser.uid === post.userId) && (
                                        <button 
                                          onClick={() => deleteComment(post.id, comment.id)}
                                          className="text-gray-600 hover:text-red-400 transition-colors p-0.5"
                                        >
                                          <Trash2 size={10} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-gray-400 leading-normal font-sans text-xs whitespace-pre-wrap">{comment.text}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Text form additions */}
                        <form
                          onSubmit={(e) => handleAddComment(post.id, e)}
                          className="flex gap-2 border-t border-white/5 pt-3"
                        >
                          <input
                            type="text"
                            placeholder="Add comment..."
                            value={newCommentsText[post.id] || ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              setNewCommentsText(prev => ({ ...prev, [post.id]: v }));
                            }}
                            className="flex-1 bg-white/5 border border-white/10 text-xs text-gray-300 rounded-xl px-3 py-2.5 outline-none placeholder-gray-500 focus:border-purple-500 transition-colors"
                          />
                          <button
                            type="submit"
                            disabled={!(newCommentsText[post.id] || '').trim()}
                            className="bg-purple-600 hover:bg-purple-500 active:scale-95 disabled:opacity-50 text-white px-3.5 rounded-xl flex items-center justify-center transition-all cursor-pointer border-none font-bold"
                          >
                            <Send size={12} />
                          </button>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
};
