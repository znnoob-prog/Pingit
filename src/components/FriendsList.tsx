// src/components/FriendsList.tsx
import React, { useState } from 'react';
import {
  Users,
  Search,
  MessageCircle,
  UserPlus,
  UserCheck,
  UserX,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface FriendsListProps {
  currentUser: any;
  friends: any[];
  communityUsers: any[];
  onAddFriend: (uid: string) => Promise<void>;
  onRemoveFriend: (uid: string) => Promise<void>;
  onDirectChat: (friend: any) => void;
  onRequireLogin: () => void;
}

export const FriendsList: React.FC<FriendsListProps> = ({
  currentUser,
  friends,
  communityUsers,
  onAddFriend,
  onRemoveFriend,
  onDirectChat,
  onRequireLogin,
}) => {
  const [subTab, setSubTab] = useState<'my_friends' | 'community'>('my_friends');
  const [searchQuery, setSearchQuery] = useState('');

  const friendUids = new Set(friends.map((f) => f.uid));

  const filteredFriends = friends.filter((f) => {
    const q = searchQuery.toLowerCase();
    return (
      (f.displayName || '').toLowerCase().includes(q) ||
      (f.email || '').toLowerCase().includes(q) ||
      (f.city || '').toLowerCase().includes(q)
    );
  });

  const filteredCommunity = communityUsers.filter((u) => {
    if (currentUser && u.uid === currentUser.uid) return false;
    const q = searchQuery.toLowerCase();
    return (
      (u.displayName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.city || '').toLowerCase().includes(q) ||
      (u.interests || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header & Subtabs */}
      <div className="rounded-2xl border p-5 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <Users className="w-5 h-5 text-violet-500" />
            <span>Friends &amp; Ping Community</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your network, find local friends, and connect with fellow pingers.
          </p>
        </div>

        {/* Subtabs */}
        <div className="flex rounded-xl p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setSubTab('my_friends')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              subTab === 'my_friends'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            My Friends ({friends.length})
          </button>
          <button
            onClick={() => setSubTab('community')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              subTab === 'community'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Community Directory
          </button>
        </div>
      </div>

      {/* Search Bar for Filtering Friends by Display Name */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            subTab === 'my_friends'
              ? 'Quickly filter and find friends by display name...'
              : 'Search members by display name, city, or interests...'
          }
          className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border bg-white border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-xs"
        />
      </div>

      {/* Content */}
      {subTab === 'my_friends' ? (
        filteredFriends.length === 0 ? (
          <div className="text-center p-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 space-y-3">
            <Users className="w-8 h-8 mx-auto text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No friends found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Switch to the "Community Directory" tab or use Google Maps Suggestions to discover
              friends!
            </p>
            <button
              onClick={() => setSubTab('community')}
              className="text-xs px-4 py-2 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 shadow-xs"
            >
              Explore Community Directory
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredFriends.map((friend) => {
              const isOnline = friend.status === 'online' || Math.random() > 0.3; // online indicator
              return (
                <div
                  key={friend.uid}
                  className="rounded-2xl border p-4 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-xs flex items-center justify-between space-x-3"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="relative">
                      <img
                        src={
                          friend.photoUrl ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${friend.uid}`
                        }
                        alt={friend.displayName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {/* Online/Offline Status Indicator */}
                      <span
                        title={isOnline ? 'Active Online' : 'Offline'}
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                          isOnline ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-400'
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {friend.displayName || friend.email}
                        </h3>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                            isOnline
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center mt-0.5">
                        <MapPin className="w-3 h-3 mr-0.5 inline" />
                        {friend.city || 'Global Member'}
                      </p>
                      {friend.interests && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {friend.interests}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => onDirectChat(friend)}
                      className="p-2 rounded-xl bg-violet-50 text-violet-600 hover:bg-violet-100 dark:bg-violet-950/60 dark:text-violet-300 dark:hover:bg-violet-900/80 transition-colors"
                      title="Start Ping Chat"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRemoveFriend(friend.uid)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Remove Friend"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Community Directory */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredCommunity.map((person) => {
            const isFriend = friendUids.has(person.uid);
            const isOnline = person.status === 'online' || Math.random() > 0.4;
            return (
              <div
                key={person.uid}
                className="rounded-2xl border p-4 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={
                        person.photoUrl ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${person.uid}`
                      }
                      alt={person.displayName}
                      className="w-11 h-11 rounded-full object-cover"
                    />
                    <span
                      title={isOnline ? 'Active Online' : 'Offline'}
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                        isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                      {person.displayName || person.email}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
                      <MapPin className="w-3 h-3 mr-0.5 inline" />
                      {person.city || 'Community Member'}
                    </p>
                  </div>
                </div>

                {person.bio && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {person.bio}
                  </p>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  {isFriend ? (
                    <button
                      onClick={() => onDirectChat(person)}
                      className="w-full flex items-center justify-center space-x-1.5 py-1.5 rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-950 dark:text-violet-300 text-xs font-semibold transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Ping Chat</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onAddFriend(person.uid)}
                      className="w-full flex items-center justify-center space-x-1.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-semibold transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Friend</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
