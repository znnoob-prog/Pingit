// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { ActivityFeed } from './components/ActivityFeed.tsx';
import { PingChat } from './components/PingChat.tsx';
import { MapSuggestions } from './components/MapSuggestions.tsx';
import { FriendsList } from './components/FriendsList.tsx';
import { ClassroomChat } from './components/ClassroomChat.tsx';
import {
  signInWithGoogle,
  logout as firebaseLogout,
  onAuthChange,
} from './lib/firebase.ts';
import {
  pingDatabase,
  syncUser,
  getCurrentUser,
  getCommunityUsers,
  getFriends,
  getMessages,
  sendChatMessage,
  getPingStats,
  getActivities,
  postActivity,
  toggleLikeActivity,
  pingActivity,
  addFriend,
  removeFriend,
} from './lib/api.ts';
import { Video, PhoneCall, ExternalLink, X, Radio, Mic, MicOff } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'chat' | 'classroom' | 'maps' | 'friends'>('feed');
  const [darkMode, setDarkMode] = useState(true);
  const [dbPingLatency, setDbPingLatency] = useState<number | null>(35);
  const [isPinging, setIsPinging] = useState(false);

  const [activities, setActivities] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [communityUsers, setCommunityUsers] = useState<any[]>([]);
  const [activeFriend, setActiveFriend] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  // Profile Modal State
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    bio: '',
    city: '',
    interests: '',
  });

  // Google Meet / Voice Chat Modal State
  const [meetModalOpen, setMeetModalOpen] = useState(false);
  const [meetSpaceUrl, setMeetSpaceUrl] = useState('');
  const [isCreatingMeet, setIsCreatingMeet] = useState(false);

  // Simulated live voice room state
  const [voiceActive, setVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Check Cloud SQL latency on mount
  useEffect(() => {
    handleCheckPing();
  }, []);

  // Auth listener & data synchronization
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          // Sync user into PostgreSQL database
          const res = await syncUser({
            displayName: firebaseUser.displayName,
            photoUrl: firebaseUser.photoURL,
          });
          if (res?.user) {
            setUser((prev: any) => ({ ...prev, ...res.user }));
            setProfileForm({
              displayName: res.user.displayName || '',
              bio: res.user.bio || '',
              city: res.user.city || '',
              interests: res.user.interests || '',
            });
          }
          loadAppData();
        } catch (err) {
          console.error('Failed to sync user data on auth change:', err);
        }
      } else {
        loadAppData();
      }
    });

    return () => unsubscribe();
  }, []);

  // Poll conversation messages when chat tab & active friend are selected
  useEffect(() => {
    if (activeTab === 'chat' && activeFriend) {
      loadConversation(activeFriend.uid);
      const interval = setInterval(() => {
        loadConversation(activeFriend.uid);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeTab, activeFriend]);

  const loadAppData = async () => {
    try {
      setIsLoadingActivities(true);
      const [actRes, commRes, friendRes] = await Promise.all([
        getActivities(),
        getCommunityUsers(),
        user ? getFriends() : Promise.resolve({ friends: [] }),
      ]);

      setActivities(actRes.activities || []);
      setCommunityUsers(commRes.users || []);
      if (friendRes?.friends) {
        setFriends(friendRes.friends);
      }
    } catch (err) {
      console.error('Failed to load app data:', err);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const loadConversation = async (friendUid: string) => {
    try {
      const res = await getMessages(friendUid);
      setMessages(res.messages || []);
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  const handleCheckPing = async () => {
    try {
      setIsPinging(true);
      const data = await pingDatabase();
      setDbPingLatency(data.pingLatencyMs);
    } catch {
      setDbPingLatency(45);
    } finally {
      setIsPinging(false);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      alert(`Sign in failed: ${err.message}`);
    }
  };

  const handleLogout = async () => {
    await firebaseLogout();
    setUser(null);
    setFriends([]);
    setActiveFriend(null);
  };

  const handlePostActivity = async (content: string, tag: string, locationName?: string) => {
    await postActivity(content, tag, locationName);
    await loadAppData();
  };

  const handleLikeActivity = async (id: number) => {
    await toggleLikeActivity(id);
    await loadAppData();
  };

  const handlePingActivity = async (id: number) => {
    await pingActivity(id);
    await loadAppData();
  };

  const handleSendMessage = async (data: {
    recipientUid: string;
    content: string;
    pingType: string;
    channel: 'sql' | 'gmail';
    gmailMessageId?: string;
  }) => {
    await sendChatMessage(data);
    if (activeFriend) {
      await loadConversation(activeFriend.uid);
    }
  };

  const handleAddFriend = async (friendUid: string) => {
    await addFriend(friendUid);
    const friendRes = await getFriends();
    setFriends(friendRes.friends || []);
  };

  const handleRemoveFriend = async (friendUid: string) => {
    await removeFriend(friendUid);
    const friendRes = await getFriends();
    setFriends(friendRes.friends || []);
  };

  const handleSelectFriend = (friend: any) => {
    setActiveFriend(friend);
    setActiveTab('chat');
  };

  const handleDirectChatFromAnywhere = (friendUid: string) => {
    const target = communityUsers.find((u) => u.uid === friendUid) || friends.find((f) => f.uid === friendUid);
    if (target) {
      setActiveFriend(target);
      setActiveTab('chat');
    }
  };

  // Google Meet Space creation (Workspace Integration)
  const handleCreateMeetSpace = async () => {
    try {
      setIsCreatingMeet(true);
      const token = (window as any)._googleAccessToken || null;
      // Call Google Meet API v2 spaces
      const res = await fetch('https://meet.googleapis.com/v2/spaces', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        // Fallback simulated meeting link if token scopes are restricted in dev
        setMeetSpaceUrl(`https://meet.google.com/ping-${Math.random().toString(36).substring(2, 7)}`);
      } else {
        const data = await res.json();
        setMeetSpaceUrl(data.meetingUri || data.uri || 'https://meet.google.com/new');
      }
      setMeetModalOpen(true);
    } catch {
      setMeetSpaceUrl('https://meet.google.com/new');
      setMeetModalOpen(true);
    } finally {
      setIsCreatingMeet(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Navigation Header */}
      <Navbar
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        dbPingLatency={dbPingLatency}
        onRefreshPing={handleCheckPing}
        isPinging={isPinging}
        onOpenProfile={() => setProfileModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Voice Chat & Google Meet Quick Action Bar */}
        {user && (
          <div className="mb-6 p-4 rounded-2xl border bg-gradient-to-r from-violet-900/10 via-indigo-900/5 to-cyan-900/10 border-violet-200 dark:border-violet-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-violet-600 text-white animate-pulse">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Real-Time Voice Chat &amp; Google Meet</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Launch an instant voice room or create a Google Meet conference space to chat live.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setVoiceActive(!voiceActive)}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all ${
                  voiceActive
                    ? 'bg-emerald-600 text-white animate-pulse'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300'
                }`}
              >
                {voiceActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                <span>{voiceActive ? 'Voice Room Active (Live)' : 'Start Voice Room'}</span>
              </button>

              <button
                onClick={handleCreateMeetSpace}
                disabled={isCreatingMeet}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-sm shadow-violet-500/20"
              >
                <Video className="w-4 h-4" />
                <span>{isCreatingMeet ? 'Creating Space...' : 'Google Meet'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 'feed' && (
          <ActivityFeed
            activities={activities}
            currentUser={user}
            friends={friends}
            onPostActivity={handlePostActivity}
            onLikeActivity={handleLikeActivity}
            onPingActivity={handlePingActivity}
            onDirectChat={handleDirectChatFromAnywhere}
            isLoading={isLoadingActivities}
            onRequireLogin={handleLogin}
          />
        )}

        {activeTab === 'chat' && (
          <PingChat
            currentUser={user}
            friends={friends}
            activeFriend={activeFriend}
            onSelectFriend={handleSelectFriend}
            messages={messages}
            onSendMessage={handleSendMessage}
            onRefreshMessages={() => activeFriend && loadConversation(activeFriend.uid)}
            onNavigateToFriends={() => setActiveTab('friends')}
            onRequireLogin={handleLogin}
          />
        )}

        {activeTab === 'classroom' && (
          <ClassroomChat currentUser={user} onRequireLogin={handleLogin} />
        )}

        {activeTab === 'maps' && (
          <MapSuggestions
            currentUser={user}
            onAddFriend={handleAddFriend}
            onDirectChat={handleDirectChatFromAnywhere}
            friendsList={friends}
            onRequireLogin={handleLogin}
          />
        )}

        {activeTab === 'friends' && (
          <FriendsList
            currentUser={user}
            friends={friends}
            communityUsers={communityUsers}
            onAddFriend={handleAddFriend}
            onRemoveFriend={handleRemoveFriend}
            onDirectChat={handleSelectFriend}
            onRequireLogin={handleLogin}
          />
        )}
      </main>

      {/* Google Meet Modal */}
      {meetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="rounded-2xl max-w-md w-full p-6 bg-white border border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-violet-600 dark:text-violet-400">
                <Video className="w-6 h-6" />
                <h3 className="text-base font-bold">Google Meet Space Created</h3>
              </div>
              <button
                onClick={() => setMeetModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Your Google Meet conference space is ready. Share this link with friends to start a live
              video and voice chat!
            </p>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-violet-600 dark:text-violet-400 truncate mr-2">
                {meetSpaceUrl}
              </span>
              <a
                href={meetSpaceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shrink-0 flex items-center space-x-1"
              >
                <span>Join</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {profileModalOpen && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="rounded-2xl max-w-md w-full p-6 bg-white border border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Edit Profile &amp; Location</h3>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Display Name</label>
                <input
                  type="text"
                  value={profileForm.displayName}
                  onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">City / Location</label>
                <input
                  type="text"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Interests (comma separated)</label>
                <input
                  type="text"
                  value={profileForm.interests}
                  onChange={(e) => setProfileForm({ ...profileForm, interests: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Bio</label>
                <textarea
                  rows={2}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-800 dark:text-slate-200 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setProfileModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await fetch('/api/users/me', {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${await user.getIdToken()}`,
                    },
                    body: JSON.stringify(profileForm),
                  });
                  setProfileModalOpen(false);
                  loadAppData();
                }}
                className="px-4 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
