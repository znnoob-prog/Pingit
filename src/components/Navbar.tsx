// src/components/Navbar.tsx
import React, { useState } from 'react';
import {
  Activity,
  MessageSquare,
  Compass,
  Users,
  Moon,
  Sun,
  Radio,
  RefreshCw,
  LogOut,
  User as UserIcon,
  Sparkles,
  GraduationCap,
} from 'lucide-react';

interface NavbarProps {
  user: any;
  onLogin: () => void;
  onLogout: () => void;
  activeTab: 'feed' | 'chat' | 'maps' | 'friends';
  setActiveTab: (tab: 'feed' | 'chat' | 'maps' | 'friends') => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  dbPingLatency: number | null;
  onRefreshPing: () => void;
  isPinging: boolean;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogin,
  onLogout,
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  dbPingLatency,
  onRefreshPing,
  isPinging,
  onOpenProfile,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md border-b transition-colors bg-white/90 border-slate-200 dark:bg-slate-950/90 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Ping Animation */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('feed')}
            className="flex items-center space-x-2.5 text-left group focus:outline-none"
            aria-label="Pingit Home"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Radio className="w-5 h-5 text-white animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent dark:from-violet-400 dark:via-indigo-300 dark:to-cyan-400">
                  Pingit
                </span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  SQL Social
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Pinging the Database
              </p>
            </div>
          </button>

          {/* Database Live Ping Latency Pill */}
          <div className="hidden md:flex items-center space-x-1.5 ml-4 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 shadow-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                (dbPingLatency || 35) < 50
                  ? 'bg-emerald-500 shadow-emerald-500/50'
                  : (dbPingLatency || 35) < 120
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              } animate-ping`}
              style={{ animationDuration: '2s' }}
            />
            <span className="text-slate-500 dark:text-slate-400">SQL:</span>
            <span className="font-semibold text-violet-600 dark:text-violet-400">
              {dbPingLatency !== null ? `${dbPingLatency}ms` : '35ms'}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              (Postgres)
            </span>
            <button
              onClick={onRefreshPing}
              disabled={isPinging}
              title="Ping Cloud SQL Database now"
              className="ml-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2" aria-label="Main Navigation">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'feed'
                ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Activity Feed</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all relative ${
              activeTab === 'chat'
                ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Ping Chat</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('classroom')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'classroom'
                ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span className="hidden sm:inline">Classroom</span>
          </button>

          <button
            onClick={() => setActiveTab('maps')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'maps'
                ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">Maps Suggestions</span>
          </button>

          <button
            onClick={() => setActiveTab('friends')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'friends'
                ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Friends</span>
          </button>
        </nav>

        {/* Right Side Actions: Dark Mode & Auth */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Sign-In or Profile Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center space-x-2 p-1 rounded-full border border-slate-200 dark:border-slate-700 hover:ring-2 hover:ring-violet-500/30 transition-all"
                aria-label="User profile menu"
              >
                <img
                  src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full object-cover"
                />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-2xl shadow-xl border bg-white border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onClick={() => setMenuOpen(false)}
                >
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <p className="font-semibold text-sm truncate">{user.displayName || 'Pingit User'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={onOpenProfile}
                    className="w-full text-left px-4 py-2 text-sm flex items-center space-x-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>My Profile &amp; Location</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('maps')}
                    className="w-full text-left px-4 py-2 text-sm flex items-center space-x-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-violet-500" />
                    <span>Maps Friend Suggestions</span>
                  </button>

                  <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2 text-sm text-rose-600 dark:text-rose-400 flex items-center space-x-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Sole Option: Sign in with Google (Styled to official Google standard) */
            <button
              onClick={onLogin}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 shadow-xs transition-all hover:scale-[1.02]"
              aria-label="Sign in with Google"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
