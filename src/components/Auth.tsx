import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Sparkles, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const Auth: React.FC = () => {
  const { signUp, login, loginGoogle } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsWorking(true);

    try {
      if (isSignUp) {
        await signUp(email, password, displayName, bio);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "Authentication failed. Please verify credentials.");
    } finally {
      setIsWorking(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg('');
    setIsWorking(true);
    try {
      await loginGoogle();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "Google Authentication failed.");
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e7eb] flex flex-col items-center justify-center p-4 selection:bg-purple-600 selection:text-white relative overflow-hidden">
      {/* Background visual ambiance */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md bg-[#0a0a0a]/65 border border-white/5 backdrop-blur-md rounded-[32px] p-8 sm:p-10 shadow-[0_0_50px_rgba(168,85,247,0.05)] relative z-10 text-left">
        
        {/* Brand logo details */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 items-center justify-center font-bold text-2xl text-white shadow-xl mb-4 select-none">
            S
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2 font-sans">
            {isSignUp ? 'Create Account' : 'Welcome to Socialize'}
          </h2>
          <p className="text-xs text-gray-400">
            {isSignUp ? 'Join other creators to share clips and snaps' : 'Enter your coordinates to resume sharing'}
          </p>
        </div>

        {/* Error Messaging Row */}
        {errorMsg && (
          <div className="mb-5 bg-red-950/20 border border-red-900/50 p-3.5 rounded-2xl flex items-start gap-3 text-red-400 text-xs leading-normal">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p className="font-medium break-words">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          
          {isSignUp && (
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-4 top-3 text-gray-500" />
                <input
                  type="text"
                  required
                  placeholder="Mia Chen"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-purple-500 outline-none text-white text-xs font-semibold px-11 py-3 rounded-2xl transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Email address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-4 top-3.5 text-gray-500" />
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-purple-500 outline-none text-white text-xs font-semibold px-11 py-3 rounded-2xl transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Security key</label>
            <div className="relative">
              <Lock size={15} className="absolute left-4 top-3.5 text-gray-500" />
              <input
                type="password"
                required
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-purple-500 outline-none text-white text-xs font-semibold px-11 py-3 rounded-2xl transition-all"
              />
            </div>
          </div>

          {isSignUp && (
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Brief Biography Bio</label>
              <textarea
                placeholder="Photographer, web designer, or traveler..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={160}
                rows={2}
                className="w-full bg-white/5 border border-white/10 focus:border-purple-500 outline-none text-white text-xs font-semibold px-4 py-3 rounded-2xl transition-all resize-none"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isWorking}
            className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs rounded-2xl transition-all shadow-lg active:scale-98 mt-2"
          >
            {isWorking ? 'Initializing...' : isSignUp ? 'Join Socialize' : 'Authorize Entrance'}
          </button>
        </form>

        {/* Dynamic separator */}
        <div className="relative my-6 select-none">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-[#0a0a0a] px-3 text-gray-500 font-bold">Or continue with</span>
          </div>
        </div>

        {/* Google Authentication Trigger */}
        <button
          onClick={handleGoogleAuth}
          disabled={isWorking}
          className="w-full h-11 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold text-xs rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-98"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Google Space</span>
        </button>

        {/* Toggle option trigger */}
        <p className="text-center text-xs text-gray-500 mt-8 font-sans select-none">
          {isSignUp ? 'Already have an account? ' : "New around here? "}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
            }}
            className="text-purple-400 hover:text-purple-300 font-bold underline focus:outline-none"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>

      </div>
    </div>
  );
};
