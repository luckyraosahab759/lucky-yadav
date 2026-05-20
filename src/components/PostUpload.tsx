import React, { useState } from 'react';
import { useSocial } from '../context/SocialContext';
import { UploadCloud, Image, Film, Send, Sparkles, Check, Link } from 'lucide-react';
import { motion } from 'motion/react';

interface PostUploadProps {
  onSuccess: () => void;
}

const TEMPLATE_PHOTOS = [
  { url: 'https://images.unsplash.com/photo-1515462277126-270d878326e5?w=600&h=600&fit=crop', label: 'Neon Cyber' },
  { url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=600&h=600&fit=crop', label: 'Neo Street' },
  { url: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600&h=600&fit=crop', label: 'Tech Stack' },
  { url: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=600&h=600&fit=crop', label: 'Galaxy View' },
];

const TEMPLATE_REELS = [
  { url: 'https://assets.mixkit.co/videos/preview/mixkit-starry-night-sky-loop-2115-large.mp4', label: 'Star Canopy' },
  { url: 'https://assets.mixkit.co/videos/preview/mixkit-neon-light-from-a-building-at-night-loop-41712-large.mp4', label: 'Neon Glow' },
  { url: 'https://assets.mixkit.co/videos/preview/mixkit-delicious-coffee-dripping-into-a-cup-loop-41551-large.mp4', label: 'Filter Drip' },
  { url: 'https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-look-of-a-man-with-futuristic-glasses-loop-42861-large.mp4', label: 'Cyber Mirror' },
];

export const PostUpload: React.FC<PostUploadProps> = ({ onSuccess }) => {
  const { createPost } = useSocial();

  const [caption, setCaption] = useState('');
  const [type, setType] = useState<'photo' | 'reel'>('photo');
  const [mediaUrl, setMediaUrl] = useState('');
  
  // Drag & drop local simulation
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customFileLoaded, setCustomFileLoaded] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Convert dragged files to base64 or temporary URLs
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaUrl(reader.result as string);
        setCustomFileLoaded(true);
        // Auto-detect type
        if (file.type.startsWith('video/')) {
          setType('reel');
        } else {
          setType('photo');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaUrl(reader.result as string);
        setCustomFileLoaded(true);
        if (file.type.startsWith('video/')) {
          setType('reel');
        } else {
          setType('photo');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl.trim()) return alert("Please upload a file or choose an aesthetic template!");

    setIsSubmitting(true);
    try {
      await createPost(caption, type, mediaUrl);
      setCaption('');
      setMediaUrl('');
      setCustomFileLoaded(false);
      onSuccess(); // Switch back to feed
    } catch (err) {
      console.error(err);
      alert("Failed to submit post! Double check the constraints.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectTemplate = (url: string) => {
    setMediaUrl(url);
    setCustomFileLoaded(false);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-8 pb-24 px-4 sm:px-0">
      
      {/* Header Info */}
      <div className="flex items-center justify-between py-4 border-b border-white/5 select-none">
        <h2 className="text-xl font-bold tracking-tight text-white">Create Post</h2>
        <span className="text-xxs font-mono bg-white/5 text-purple-400 py-1 px-3 border border-white/5 rounded-full font-bold">
          LIVE WRITER
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Toggle selector: Photo vs Reel */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => {
              setType('photo');
              if (!customFileLoaded) setMediaUrl('');
            }}
            className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-2xl border text-xs font-bold transition-all ${
              type === 'photo'
                ? 'bg-white/10 border-purple-500/50 text-white'
                : 'bg-[#0a0a0a] border-white/5 text-gray-500 hover:text-gray-350'
            }`}
          >
            <Image size={16} className={type === 'photo' ? 'text-purple-500' : ''} />
            <span>Photo Display</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setType('reel');
              if (!customFileLoaded) setMediaUrl('');
            }}
            className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-2xl border text-xs font-bold transition-all ${
              type === 'reel'
                ? 'bg-white/10 border-purple-500/50 text-white'
                : 'bg-[#0a0a0a] border-white/5 text-gray-500 hover:text-gray-355'
            }`}
          >
            <Film size={16} className={type === 'reel' ? 'text-purple-500' : ''} />
            <span>Short Reel Video</span>
          </button>
        </div>

        {/* Upload Container - Drag/Drop & Input selection */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleFileDrop}
          className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
            isDragging 
              ? 'border-purple-500 bg-purple-950/15' 
              : mediaUrl 
                ? 'border-white/5 bg-[#0a0a0a]/40' 
                : 'border-white/10 hover:border-white/20 hover:bg-[#0a0a0a]/30'
          }`}
        >
          {mediaUrl ? (
            /* Media preview */
            <div className="space-y-4">
              <div className="w-full max-h-[240px] rounded-2xl overflow-hidden bg-black border border-white/5 flex items-center justify-center">
                {type === 'reel' ? (
                  <video 
                    src={mediaUrl} 
                    controls 
                    muted 
                    className="max-h-[240px] w-auto max-w-full object-contain"
                  />
                ) : (
                  <img 
                    src={mediaUrl} 
                    alt="Uploaded preview" 
                    className="max-h-[240px] w-auto max-w-full object-contain"
                  />
                )}
              </div>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMediaUrl('');
                    setCustomFileLoaded(false);
                  }}
                  className="text-xs bg-[#0a0a0a] text-red-400 hover:text-red-300 border border-white/5 px-4 py-2 rounded-xl active:scale-95 transition-all"
                >
                  Remove Media
                </button>
              </div>
            </div>
          ) : (
            /* Standard drag directions */
            <div className="space-y-4 py-6">
              <div className="inline-flex bg-[#0a0a0a] border border-white/5 p-4 rounded-full text-zinc-400">
                <UploadCloud size={24} className="text-purple-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-200">
                  Drag and drop your file here, or{' '}
                  <label className="text-purple-500 hover:text-purple-400 cursor-pointer underline">
                    browse
                    <input 
                      type="file" 
                      accept={type === 'reel' ? 'video/*' : 'image/*'} 
                      onChange={handleFileInput}
                      className="hidden" 
                    />
                  </label>
                </p>
                <p className="text-[10px] text-gray-500 mt-1">Supports high-res PNG, JPG, WebP, or vertical MP4 files</p>
              </div>
            </div>
          )}
        </div>

        {/* Manual Direct links or Beautiful templates selects */}
        <div className="space-y-3 bg-[#0a0a0a]/65 p-5 rounded-3xl border border-white/5 text-left">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-purple-500" />
            <h4 className="text-xs font-bold text-gray-300">Quick-Select Premium Templates</h4>
          </div>
          
          <p className="text-[10px] text-gray-500 leading-normal">
            No media on your device? Instantly select one of our premium street, cyber, or scenic designs:
          </p>

          <div className="grid grid-cols-4 gap-2">
            {(type === 'photo' ? TEMPLATE_PHOTOS : TEMPLATE_REELS).map((tpl, idx) => {
              const isSelected = mediaUrl === tpl.url;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectTemplate(tpl.url)}
                  className={`relative aspect-square rounded-xl overflow-hidden border transition-all text-left group cursor-pointer ${
                    isSelected ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors z-5" />
                  {type === 'photo' ? (
                    <img src={tpl.url} alt={tpl.label} className="w-full h-full object-cover" />
                  ) : (
                    /* Light duration tag */
                    <div className="w-full h-full bg-[#050505] flex items-center justify-center">
                      <Film size={16} className="text-gray-600 group-hover:text-purple-500 transition-colors" />
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 bg-purple-600 rounded-full p-0.5 text-white z-10">
                      <Check size={8} className="stroke-[3]" />
                    </div>
                  )}
                  <span className="absolute bottom-1.5 left-2 text-[8px] font-bold text-white z-10 truncate max-w-[80%] font-mono">
                    {tpl.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 items-center border-t border-white/5 pt-4 mt-2">
            <Link size={12} className="text-gray-500 animate-pulse" />
            <input
              type="url"
              placeholder="Or paste any custom image/video URL directly..."
              value={customFileLoaded ? '' : mediaUrl}
              onChange={(e) => {
                setMediaUrl(e.target.value);
                setCustomFileLoaded(false);
              }}
              className="flex-1 bg-transparent text-xs text-gray-300 placeholder-gray-600 outline-none font-semibold select-text"
            />
          </div>
        </div>

        {/* Text Area for Caption */}
        <div className="space-y-1.5 text-left">
          <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Post Caption</label>
          <textarea
            required
            rows={4}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write details, tags, and story highlights. Add tags using # etc."
            maxLength={2200}
            className="w-full bg-[#0a0a0a]/50 border border-white/5 px-4 py-3 rounded-2xl text-xs text-gray-200 outline-none focus:border-purple-500 transition-colors resize-none placeholder-gray-600 font-semibold select-text"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 disabled:opacity-50 font-bold text-xs py-3.5 rounded-2xl text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10 active:scale-98 transition-all scroll-smooth border-none"
        >
          <Send size={14} />
          <span>{isSubmitting ? 'Uploading Contents...' : 'Publish Post to Feed'}</span>
        </button>

      </form>
    </div>
  );
};
