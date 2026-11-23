// src/components/ActivityFeed.tsx
import React, { useState } from 'react';
import {
  Heart,
  Radio,
  MapPin,
  Send,
  Sparkles,
  Search,
  MessageCircle,
  Share2,
  Navigation,
  Globe,
  Users,
} from 'lucide-react';
import { formatTimeAgo, filterActivities } from '../utils/activityFilters.ts';

interface ActivityFeedProps {
  activities: any[];
  currentUser: any;
  friends: any[];
  onPostActivity: (content: string, tag: string, locationName?: string) => Promise<void>;
  onLikeActivity: (id: number) => Promise<void>;
  onPingActivity: (id: number) => Promise<void>;
  onDirectChat: (authorUid: string) => void;
  isLoading: boolean;
  onRequireLogin: () => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  currentUser,
  friends,
  onPostActivity,
  onLikeActivity,
  onPingActivity,
  onDirectChat,
  isLoading,
  onRequireLogin,
}) => {
  const [content, setContent] = useState('');
  const [selectedTag, setSelectedTag] = useState('ping');
  const [locationName, setLocationName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterTag, setFilterTag] = useState('all');
  const [feedScope, setFeedScope] = useState<'all' | 'friends' | 'public'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pingPulseId, setPingPulseId] = useState<number | null>(null);

  const friendUids = new Set(friends.map((f) => f.uid));
  if (currentUser) {
    friendUids.add(currentUser.uid); // include own posts
  }

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    if (!content.trim()) return;

    try {
      setIsSubmitting(true);
      await onPostActivity(content.trim(), selectedTag, locationName.trim() || undefined);
      setContent('');
      setLocationName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePing = async (id: number) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    setPingPulseId(id);
    setTimeout(() => setPingPulseId(null), 1200);
    await onPingActivity(id);
  };

  const detectLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationName(`${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`);
        },
        () => {
          setLocationName('Local Hub');
        }
      );
    }
  };

  // Filter activities by tag and search query
  let filtered = filterActivities(activities, filterTag, searchQuery);

  // Apply feed scope filter ('all', 'friends', 'public')
  if (feedScope === 'friends') {
    filtered = filtered.filter((item) => friendUids.has(item.authorUid));
  } else if (feedScope === 'public') {
    filtered = filtered.filter((item) => !friendUids.has(item.authorUid));
  }

  const tags = [
    { id: 'all', label: 'All Activities', icon: Sparkles },
    { id: 'ping', label: '⚡ Pings', icon: Radio },
    { id: 'checkin', label: '📍 Check-ins', icon: MapPin },
    { id: 'shout', label: '📢 Shouts', icon: Share2 },
    { id: 'update', label: '💡 Updates', icon: Sparkles },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Activity Composer Box */}
      <div className="rounded-2xl border shadow-xs p-4 sm:p-5 transition-all bg-white border-slate-200 dark:bg-slate-900/90 dark:border-slate-800">
        <form onSubmit={handlePost} className="space-y-3.5">
          <div className="flex items-start space-x-3">
            <div className="relative">
              <img
                src={
                  currentUser?.photoURL ||
                  currentUser?.photoUrl ||
                  'https://api.dicebear.com/7.x/bottts/svg?seed=guest'
                }
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
              {currentUser && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  currentUser
                    ? "What's pinging in your world? Share an update, ping, or check-in..."
                    : 'Sign in with Google to ping the community and post updates!'
                }
                rows={3}
                disabled={!currentUser || isSubmitting}
                className="w-full text-sm rounded-xl p-3 border resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
              />
            </div>
          </div>

          {/* Tag Selector & Location */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 mr-1">
                Tag:
              </span>
              {[
                { id: 'ping', label: '⚡ Ping' },
                { id: 'checkin', label: '📍 Check-in' },
                { id: 'shout', label: '📢 Shout' },
                { id: 'update', label: '💡 Update' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTag(t.id)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    selectedTag === t.id
                      ? 'bg-violet-50 border-violet-300 font-semibold text-violet-700 dark:bg-violet-950/60 dark:border-violet-700 dark:text-violet-300'
                      : 'bg-transparent border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-44">
                <MapPin className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Location / Spot"
                  className="w-full text-xs pl-8 pr-7 py-1.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={detectLocation}
                  title="Detect GPS location"
                  className="absolute right-2 top-2 text-slate-400 hover:text-violet-500"
                >
                  <Navigation className="w-3 h-3" />
                </button>
              </div>

              <button
                type="submit"
                disabled={!currentUser || !content.trim() || isSubmitting}
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm shadow-violet-500/25 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Pinging...' : 'Post'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Feed Scope Filter Tabs ('All', 'Friends Only', 'Public') & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Scope Selector: All / Friends Only / Public */}
        <div className="flex rounded-xl p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs w-full sm:w-auto">
          <button
            onClick={() => setFeedScope('all')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              feedScope === 'all'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>All Posts</span>
          </button>
          <button
            onClick={() => setFeedScope('friends')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              feedScope === 'friends'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Friends Only</span>
          </button>
          <button
            onClick={() => setFeedScope('public')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              feedScope === 'public'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Public</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activities..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white border-slate-200 text-slate-800 placeholder-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      {/* Tag Filters */}
      <div className="flex items-center space-x-1 overflow-x-auto w-full pb-1 scrollbar-none">
        {tags.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilterTag(t.id)}
            className={`text-xs px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              filterTag === t.id
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Activities List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="rounded-2xl border p-5 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 animate-pulse space-y-3"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  <div className="h-2 w-20 bg-slate-100 dark:bg-slate-850 rounded"></div>
                </div>
              </div>
              <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 bg-slate-50/50 dark:bg-slate-900/30">
          <Radio className="w-8 h-8 mx-auto text-slate-400 mb-2 animate-bounce" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No activities in this feed scope
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            Try switching between 'All', 'Friends Only', or 'Public' or post a new ping!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const isPulsing = pingPulseId === item.id;
            const isOnline = item.authorUid === currentUser?.uid || Math.random() > 0.35;
            return (
              <article
                key={item.id}
                className={`rounded-2xl border p-4 sm:p-5 transition-all bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-900/80 shadow-xs relative overflow-hidden ${
                  isPulsing ? 'ring-2 ring-violet-500 shadow-lg shadow-violet-500/20' : ''
                }`}
              >
                {/* Ping Pulse Wave Overlay */}
                {isPulsing && (
                  <span className="absolute inset-0 bg-violet-500/10 dark:bg-violet-500/20 animate-pulse pointer-events-none"></span>
                )}

                {/* Author Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={
                          item.authorPhoto ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${item.authorUid}`
                        }
                        alt={item.authorName || 'Author'}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                      {/* Online/Offline Status Indicator */}
                      <span
                        title={isOnline ? 'Active Online' : 'Offline'}
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                          isOnline ? 'bg-emerald-500 shadow-xs' : 'bg-slate-400'
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {item.authorName || 'Pingit Member'}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase border ${
                            item.tag === 'ping'
                              ? 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800'
                              : item.tag === 'checkin'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                              : item.tag === 'shout'
                              ? 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800'
                              : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                          }`}
                        >
                          {item.tag || 'ping'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{formatTimeAgo(item.createdAt)}</span>
                        {item.locationName && (
                          <>
                            <span>•</span>
                            <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                              <MapPin className="w-3 h-3 mr-0.5 inline" />
                              {item.locationName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Direct Chat Button */}
                  {currentUser && currentUser.uid !== item.authorUid && (
                    <button
                      onClick={() => onDirectChat(item.authorUid)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-950/50 transition-colors"
                      title="Direct Chat via SQL Ping"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ping Chat</span>
                    </button>
                  )}
                </div>

                {/* Content */}
                <p className="mt-3 text-sm text-slate-800 dark:text-slate-200 leading-relaxed break-words whitespace-pre-wrap">
                  {item.content}
                </p>

                {/* Card Actions: Like & Ping */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center space-x-3">
                    {/* Like Action */}
                    <button
                      onClick={() => onLikeActivity(item.id)}
                      className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition-colors ${
                        item.isLiked
                          ? 'text-rose-600 dark:text-rose-400 font-semibold'
                          : 'text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400'
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          item.isLiked ? 'fill-rose-500 text-rose-500 scale-110' : ''
                        }`}
                      />
                      <span>{item.likesCount || 0}</span>
                    </button>

                    {/* Ping Action */}
                    <button
                      onClick={() => handlePing(item.id)}
                      className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400 transition-colors group"
                      title="Send a radar ping to this post"
                    >
                      <Radio className="w-4 h-4 text-violet-500 group-hover:scale-110 transition-transform" />
                      <span>{item.pingsCount || 0} Pings</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    Cloud SQL Postgres
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
