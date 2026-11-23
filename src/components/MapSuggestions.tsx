// src/components/MapSuggestions.tsx
import React, { useState, useEffect } from 'react';
import {
  Compass,
  MapPin,
  Sparkles,
  ExternalLink,
  UserPlus,
  MessageCircle,
  Navigation,
  Check,
  RefreshCw,
  Coffee,
} from 'lucide-react';
import { getMapSuggestions } from '../lib/api.ts';

interface MapSuggestionsProps {
  currentUser: any;
  onAddFriend: (friendUid: string) => Promise<void>;
  onDirectChat: (friendUid: string) => void;
  friendsList: any[];
  onRequireLogin: () => void;
}

export const MapSuggestions: React.FC<MapSuggestionsProps> = ({
  currentUser,
  onAddFriend,
  onDirectChat,
  friendsList,
  onRequireLogin,
}) => {
  const [city, setCity] = useState(currentUser?.city || 'San Francisco, CA');
  const [latitude, setLatitude] = useState<number | undefined>(37.7749);
  const [longitude, setLongitude] = useState<number | undefined>(-122.4194);
  const [interests, setInterests] = useState(
    currentUser?.interests || 'AI, specialty coffee, cycling, design, startups'
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    aiInsight: string;
    groundedPlaces: Array<{ title?: string; uri?: string; snippet?: string }>;
    suggestions: any[];
  } | null>(null);
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  const friendUids = new Set(friendsList.map((f) => f.uid));

  const fetchSuggestions = async () => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    try {
      setLoading(true);
      const data = await getMapSuggestions({
        city,
        latitude,
        longitude,
        interests,
      });
      setResult(data);
    } catch (err) {
      console.error('Failed to load map suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchSuggestions();
    }
  }, [currentUser]);

  const handleDetectGps = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setCity('Current GPS Location');
        },
        (err) => {
          console.warn('Geolocation denied or unavailable:', err);
        }
      );
    }
  };

  const handleAdd = async (uid: string) => {
    setAddedMap((prev) => ({ ...prev, [uid]: true }));
    await onAddFriend(uid);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="rounded-3xl border p-6 sm:p-8 bg-gradient-to-br from-violet-900/10 via-indigo-900/5 to-cyan-900/10 border-violet-200/60 dark:from-violet-950/40 dark:via-indigo-950/20 dark:to-cyan-950/30 dark:border-violet-900/40 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-violet-600 text-white shadow-sm">
                <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '12s' }} />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Google Maps Grounded Friend Suggestions
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
              Powered by <strong>gemini-4-hydrogen</strong> with live Google Maps grounding. Find
              fellow Pingit users nearby who frequent the same neighborhood cafes, coworking hubs,
              and community spots!
            </p>
          </div>

          <button
            onClick={fetchSuggestions}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold shadow-md shadow-violet-500/25 transition-all self-stretch sm:self-auto justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Analyzing Maps...' : 'Find Matches'}</span>
          </button>
        </div>

        {/* Location & Interests Search Form */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-violet-200/50 dark:border-violet-900/30">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Location / City
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. San Francisco, CA or Berlin"
                className="w-full text-xs pl-9 pr-8 py-2 rounded-xl border bg-white border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                type="button"
                onClick={handleDetectGps}
                title="Detect GPS"
                className="absolute right-2.5 top-2 text-slate-400 hover:text-violet-500"
              >
                <Navigation className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Your Interests &amp; Vibes
            </label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="e.g. Tech, specialty coffee, cycling, design"
              className="w-full text-xs px-3.5 py-2 rounded-xl border bg-white border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>
      </div>

      {/* Discovered Google Maps Places (MANDATORY Google Maps links per guidelines) */}
      {result && result.groundedPlaces && result.groundedPlaces.length > 0 && (
        <div className="rounded-2xl border p-5 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Coffee className="w-4 h-4 text-emerald-500" />
            <span>Discovered Local Hangouts &amp; Hubs (via Google Maps Grounding)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {result.groundedPlaces.map((place, idx) => (
              <a
                key={idx}
                href={place.uri || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-600 bg-slate-50/50 dark:bg-slate-950/40 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 line-clamp-1">
                      {place.title}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-500 shrink-0 ml-1" />
                  </div>
                  {place.snippet && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {place.snippet}
                    </p>
                  )}
                </div>
                <span className="mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center">
                  <MapPin className="w-3 h-3 mr-0.5 inline" /> Open on Google Maps
                </span>
              </a>
            ))}
          </div>

          {result.aiInsight && (
            <div className="mt-3 p-3 rounded-xl bg-violet-50/60 dark:bg-violet-950/30 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <span className="font-semibold text-violet-700 dark:text-violet-400 mr-1.5">
                Gemini 4 Hydrogen Insight:
              </span>
              {result.aiInsight}
            </div>
          )}
        </div>
      )}

      {/* Suggested Friend Profiles */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span>Recommended Friends to Ping</span>
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-2xl border p-5 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 animate-pulse space-y-3"
              >
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-850 rounded"></div>
              </div>
            ))}
          </div>
        ) : !result || result.suggestions.length === 0 ? (
          <div className="text-center p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500">
            Click "Find Matches" above to discover personalized friend suggestions based on your
            location and Google Maps data!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {result.suggestions.map((candidate) => {
              const isFriend = friendUids.has(candidate.uid) || addedMap[candidate.uid];
              return (
                <div
                  key={candidate.uid}
                  className="rounded-2xl border p-5 flex flex-col justify-between bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:shadow-md transition-all space-y-3"
                >
                  <div className="space-y-3">
                    {/* Header: Photo + Score */}
                    <div className="flex items-start justify-between">
                      <img
                        src={
                          candidate.photoUrl ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${candidate.uid}`
                        }
                        alt={candidate.displayName}
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                        {candidate.compatibilityScore || 85}% Match
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {candidate.displayName || candidate.email}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center mt-0.5">
                        <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                        {candidate.city || 'Nearby Member'}
                      </p>
                    </div>

                    {candidate.bio && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                        {candidate.bio}
                      </p>
                    )}

                    {/* Shared interests */}
                    {candidate.interests && (
                      <div className="flex flex-wrap gap-1">
                        {candidate.interests.split(',').map((tag: string, i: number) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Suggested Meeting Spot */}
                    {candidate.suggestedMeetingPlace && (
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300">
                        <span className="font-semibold block">Suggested hangout:</span>
                        <a
                          href={candidate.suggestedMeetingPlace.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center mt-0.5"
                        >
                          <MapPin className="w-3 h-3 mr-1 inline" />
                          <span>{candidate.suggestedMeetingPlace.title}</span>
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2">
                    {isFriend ? (
                      <button
                        onClick={() => onDirectChat(candidate.uid)}
                        className="w-full flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Ping Chat</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAdd(candidate.uid)}
                        className="w-full flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold shadow-xs transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add &amp; Ping Friend</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
