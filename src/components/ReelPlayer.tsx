import React, { useRef, useState, useEffect } from 'react';
import { Heart, MessageCircle, Volume2, VolumeX, Play, Pause, Bookmark, Send, Plus, Check } from 'lucide-react';
import { Post, Comment } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSocial } from '../context/SocialContext';
import { motion, AnimatePresence } from 'motion/react';

interface ReelPlayerProps {
  post: Post;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onSelectUser: (userUid: string) => void;
}

export const ReelPlayer: React.FC<ReelPlayerProps> = ({ 
  post, 
  isActive, 
  isMuted, 
  onToggleMute,
  onSelectUser
}) => {
  const { currentUser } = useAuth();
  const { toggleLikePost, addComment, getComments, postLikes, commentsByPost, followUser, unfollowUser, followingIds } = useSocial();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);
  const [showPlayOverlay, setShowPlayOverlay] = useState<'play' | 'pause' | null>(null);
  
  // Comment drawer state
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const likes = postLikes[post.id] || [];
  const isLiked = currentUser ? likes.includes(currentUser.uid) : false;
  const isFollowing = followingIds.includes(post.userId);

  // Manage video playback
  useEffect(() => {
    if (videoRef.current) {
      if (isActive && isPlaying) {
        videoRef.current.play().catch((err) => {
          console.warn("Autoplay was blocked or video failed to play:", err);
          setIsPlaying(false);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive, isPlaying]);

  // Load comments when drawer is opened
  useEffect(() => {
    if (showComments) {
      setIsLoadingComments(true);
      getComments(post.id).then((list) => {
        setCommentsList(list);
        setIsLoadingComments(false);
      });
    }
  }, [showComments, commentsByPost[post.id]]);

  const handleTogglePlay = (e: React.MouseEvent) => {
    // Prevent triggering play-pause when clicking button controls
    if ((e.target as HTMLElement).closest('.control-button')) return;
    
    if (isPlaying) {
      setIsPlaying(false);
      setShowPlayOverlay('pause');
    } else {
      setIsPlaying(true);
      setShowPlayOverlay('play');
    }
    setTimeout(() => setShowPlayOverlay(null), 500);
  };

  // Double tap to like
  let lastTap = 0;
  const handleDoubleTap = (e: React.MouseEvent) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTap < DOUBLE_PRESS_DELAY) {
      if (!isLiked) {
        toggleLikePost(post.id);
      }
      setShowHeartOverlay(true);
      setTimeout(() => setShowHeartOverlay(false), 800);
    } else {
      handleTogglePlay(e);
    }
    lastTap = now;
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const textSnapshot = commentText;
    setCommentText('');
    await addComment(post.id, textSnapshot);
    // Reload local list
    const updated = await getComments(post.id);
    setCommentsList(updated);
  };

  const handleToggleFollow = async () => {
    if (!currentUser) return;
    if (isFollowing) {
      await unfollowUser(post.userId);
    } else {
      await followUser(post.userId);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto aspect-[9/16] bg-black rounded-[32px] overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 group">
      
      {/* 1. Main HTML5 Uncontrolled Autoplay Video */}
      <video
        ref={videoRef}
        src={post.mediaUrl}
        loop
        playsInline
        muted={isMuted}
        onClick={handleDoubleTap}
        className="w-full h-full object-cover cursor-pointer select-none"
      />

      {/* 2. Visual Overlays */}
      <AnimatePresence>
        {showHeartOverlay && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.9] }}
            exit={{ scale: 1.5, opacity: 0, transition: { duration: 0.3 } }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <div className="bg-black/40 backdrop-blur-md p-6 rounded-full shadow-2xl border border-white/20">
              <Heart size={80} className="text-pink-500 fill-pink-500 shadow-lg" />
            </div>
          </motion.div>
        )}

        {showPlayOverlay && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <div className="bg-black/60 p-5 rounded-full border border-white/5">
              {showPlayOverlay === 'play' ? (
                <Play size={36} className="text-zinc-100 fill-zinc-100 ml-1" />
              ) : (
                <Pause size={36} className="text-zinc-100 fill-zinc-100" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Global Sound Control Toggle Button Overlay */}
      <button 
        onClick={onToggleMute}
        className="control-button absolute top-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-md p-3 rounded-full border border-white/10 text-white transition-all active:scale-95 z-20 shadow-lg"
      >
        {isMuted ? <VolumeX size={18} className="text-pink-500" /> : <Volume2 size={18} />}
      </button>

      {/* 4. Bottom and Right Panels Overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 pt-20 flex justify-between items-end pointer-events-none z-10">
        
        {/* Left Side Info Details */}
        <div className="flex-1 min-w-0 pr-10 text-white flex flex-col pointer-events-auto select-text">
          {/* User Bio Line with Follow System */}
          <div className="flex items-center gap-3 mb-3">
            <button 
              onClick={() => onSelectUser(post.userId)}
              className="group/avatar flex items-center gap-2.5 focus:outline-none"
            >
              <img
                src={post.userPhotoURL || 'https://via.placeholder.com/150'}
                alt={post.displayName}
                className="w-10 h-10 rounded-full object-cover border border-white/10 hover:border-purple-500 transition-colors"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col text-left">
                <span className="text-sm font-semibold tracking-wide hover:text-purple-400 transition-colors truncate">
                  {post.displayName}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">original audio</span>
              </div>
            </button>

            {/* Follow / Unfollow inline trigger pill */}
            {currentUser && currentUser.uid !== post.userId && (
              <button 
                onClick={handleToggleFollow}
                className={`control-button text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full flex items-center gap-1 border transition-all duration-300 ${
                  isFollowing 
                    ? 'bg-white/10 hover:bg-white/15 border-white/10 text-gray-300' 
                    : 'bg-gradient-to-r from-purple-600 to-pink-500 border-none text-white shadow-md shadow-purple-600/20'
                }`}
              >
                {isFollowing ? (
                  <>
                    <Check size={10} /> Following
                  </>
                ) : (
                  <>
                    <Plus size={10} /> Follow
                  </>
                )}
              </button>
            )}
          </div>

          {/* Reel Caption text */}
          {post.caption && (
            <p className="text-xs text-gray-200 leading-relaxed font-sans line-clamp-3">
              {post.caption}
            </p>
          )}
        </div>

        {/* Right Side Vertical Action Rail */}
        <div className="flex flex-col gap-6 items-center pointer-events-auto text-white z-20">
          
          {/* Like Circle Trigger */}
          <div className="flex flex-col items-center select-none">
            <button
              onClick={() => toggleLikePost(post.id)}
              className={`control-button w-12 h-12 rounded-full flex items-center justify-center border transition-all active:scale-90 ${
                isLiked 
                  ? 'bg-pink-950/40 border-pink-500/50 text-pink-500 fill-pink-500' 
                  : 'bg-black/60 border-white/10 text-gray-200 hover:bg-black/80'
              }`}
            >
              <Heart size={20} className={isLiked ? 'fill-pink-500' : ''} />
            </button>
            <span className="text-xxs font-medium mt-1.5 text-gray-400">{likes.length || post.likesCount}</span>
          </div>

          {/* Comment Circle Trigger */}
          <div className="flex flex-col items-center select-none">
            <button
              onClick={() => setShowComments(true)}
              className="control-button w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 flex items-center justify-center text-gray-200 transition-all active:scale-90"
            >
              <MessageCircle size={20} />
            </button>
            <span className="text-xxs font-medium mt-1.5 text-gray-400">{commentsList.length || post.commentsCount}</span>
          </div>

          {/* Mock Share Icon or stats */}
          <div className="flex flex-col items-center select-none">
            <button
              onClick={() => {
                navigator.clipboard.writeText(post.mediaUrl);
                alert("Deep Link copied to clipboard to share this reel!");
              }}
              className="control-button w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 flex items-center justify-center text-gray-200 transition-all active:scale-90"
            >
              <Send size={18} />
            </button>
            <span className="text-xxs font-medium mt-1.5 text-gray-500">Share</span>
          </div>
        </div>
      </div>

      {/* 5. Real-Time Slide-up Comment Drawer Overlay */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="absolute inset-x-0 bottom-0 h-[65%] bg-[#0a0a0a]/98 border-t border-white/10 rounded-t-[32px] z-30 flex flex-col shadow-2xl text-left"
          >
            {/* Header Drag Handle */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <span className="text-sm font-bold text-gray-200 flex items-center gap-2">
                Comments 
                <span className="text-xs font-normal text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                  {commentsList.length}
                </span>
              </span>
              <button 
                onClick={() => setShowComments(false)}
                className="text-xs text-gray-400 hover:text-white transition-colors uppercase font-bold tracking-wider px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg"
              >
                Close
              </button>
            </div>

            {/* List scroll elements */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans select-text">
              {isLoadingComments ? (
                <div className="text-center py-10 space-y-2 text-gray-550 text-xs font-mono">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-purple-500 border-white/5 mb-2"></div>
                  <p>SYNCING RESPONSIVE STACKS...</p>
                </div>
              ) : commentsList.length === 0 ? (
                <div className="text-center py-16 text-gray-500 text-xs">
                  <p className="font-semibold mb-1 col">No comments yet</p>
                  <p className="text-xxs text-gray-600">Be the first to share your thoughts on this reel!</p>
                </div>
              ) : (
                commentsList.map((c) => (
                  <div key={c.id} className="flex gap-3 text-left">
                    <img
                      src={c.userPhotoURL || 'https://via.placeholder.com/150'}
                      alt={c.displayName}
                      className="w-8 h-8 rounded-full object-cover border border-white/5 mt-0.5"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 bg-white/5 p-2.5 rounded-xl border border-white/5">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-gray-300">
                          {c.displayName}
                        </span>
                        <span className="text-[9px] text-gray-500 font-mono">
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 break-all leading-relaxed whitespace-pre-wrap">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Form Add comments */}
            <form onSubmit={handleAddComment} className="p-4 border-t border-white/5 bg-[#0a0a0a] flex gap-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                maxLength={400}
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white font-semibold text-xs px-4 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 border-none"
              >
                Post
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
