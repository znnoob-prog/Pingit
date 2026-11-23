// src/components/PingChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Radio,
  Mail,
  Zap,
  Volume2,
  VolumeX,
  RefreshCw,
  Clock,
  Sparkles,
  AlertCircle,
  Check,
  CheckCheck,
  Users,
  Search,
  Smile,
  Cloud,
} from 'lucide-react';
import { calculatePingRating, getPingAudioPitch } from '../utils/pingMetrics.ts';
import { sendGmailMessage } from '../lib/gmail.ts';
import { EmojiPickerModal } from './EmojiPickerModal.tsx';
import { DrivePickerModal } from './DrivePickerModal.tsx';

interface PingChatProps {
  currentUser: any;
  friends: any[];
  activeFriend: any;
  onSelectFriend: (friend: any) => void;
  messages: any[];
  onSendMessage: (data: {
    recipientUid: string;
    content: string;
    pingType: string;
    channel: 'sql' | 'gmail';
    gmailMessageId?: string;
  }) => Promise<void>;
  onRefreshMessages: () => void;
  onNavigateToFriends: () => void;
  onRequireLogin: () => void;
}

export const PingChat: React.FC<PingChatProps> = ({
  currentUser,
  friends,
  activeFriend,
  onSelectFriend,
  messages,
  onSendMessage,
  onRefreshMessages,
  onNavigateToFriends,
  onRequireLogin,
}) => {
  const [content, setContent] = useState('');
  const [channelMode, setChannelMode] = useState<'sql' | 'gmail'>('sql');
  const [pingType, setPingType] = useState('normal');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [lastLatency, setLastLatency] = useState<number | null>(null);

  // Emoji Picker & Drive Picker State
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [driveModalOpen, setDriveModalOpen] = useState(false);

  // Gmail Confirmation Modal State
  const [gmailModalOpen, setGmailModalOpen] = useState(false);
  const [gmailDraft, setGmailDraft] = useState<{ recipientEmail: string; content: string } | null>(
    null
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Audio Ping Synthesis (Web Audio API)
  const playPingSound = (type: string) => {
    if (!audioEnabled || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freq = getPingAudioPitch(type);
      osc.type = type === 'urgent' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Audio autoplay policy catch
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    if (!activeFriend) return;
    if (!content.trim()) return;

    if (channelMode === 'gmail') {
      setGmailDraft({
        recipientEmail: activeFriend.email,
        content: content.trim(),
      });
      setGmailModalOpen(true);
      return;
    }

    try {
      setIsSending(true);
      const start = performance.now();
      await onSendMessage({
        recipientUid: activeFriend.uid,
        content: content.trim(),
        pingType,
        channel: 'sql',
      });
      const latency = Math.round(performance.now() - start);
      setLastLatency(latency);
      playPingSound(pingType);
      setContent('');
    } catch (err: any) {
      console.error('Failed to send SQL ping message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const confirmAndSendGmail = async () => {
    if (!gmailDraft || !currentUser) return;
    try {
      setIsSending(true);
      setGmailModalOpen(false);

      const result = await sendGmailMessage(
        gmailDraft.recipientEmail,
        currentUser.email || 'me',
        gmailDraft.content,
        `Pingit Chat from ${currentUser.displayName || 'a friend'}`
      );

      await onSendMessage({
        recipientUid: activeFriend.uid,
        content: gmailDraft.content,
        pingType: 'normal',
        channel: 'gmail',
        gmailMessageId: result.id,
      });

      playPingSound('wave');
      setContent('');
      setGmailDraft(null);
    } catch (err: any) {
      alert(`Gmail error: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const filteredFriends = friends.filter((f) =>
    (f.displayName || f.email || '').toLowerCase().includes(friendSearch.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8.5rem)] min-h-[550px] flex rounded-2xl border overflow-hidden shadow-xs bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
      {/* Left Sidebar: Friends List */}
      <div className="w-72 sm:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/40">
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-violet-500" />
              <span>Ping Contacts</span>
            </h2>
            <button
              onClick={onNavigateToFriends}
              className="text-xs text-violet-600 hover:text-violet-700 dark:text-violet-400 font-medium"
            >
              + Add
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={friendSearch}
              onChange={(e) => setFriendSearch(e.target.value)}
              placeholder="Filter friends..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border bg-white border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850">
          {filteredFriends.length === 0 ? (
            <div className="p-6 text-center space-y-2">
              <Users className="w-6 h-6 mx-auto text-slate-400" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {friends.length === 0 ? 'No friends connected yet.' : 'No match found.'}
              </p>
              {friends.length === 0 && (
                <button
                  onClick={onNavigateToFriends}
                  className="text-xs px-3 py-1 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors"
                >
                  Browse Community
                </button>
              )}
            </div>
          ) : (
            filteredFriends.map((friend) => {
              const isSelected = activeFriend?.uid === friend.uid;
              return (
                <button
                  key={friend.uid}
                  onClick={() => onSelectFriend(friend)}
                  className={`w-full text-left p-3 flex items-center space-x-3 transition-colors ${
                    isSelected
                      ? 'bg-violet-50 dark:bg-violet-950/40 border-l-4 border-violet-600'
                      : 'hover:bg-slate-100/70 dark:hover:bg-slate-850'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={
                        friend.photoUrl ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${friend.uid}`
                      }
                      alt={friend.displayName}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                        friend.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {friend.displayName || friend.email}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {friend.city || 'Global Community'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Conversation Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
        {activeFriend ? (
          <>
            {/* Conversation Header */}
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex items-center space-x-3">
                <img
                  src={
                    activeFriend.photoUrl ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${activeFriend.uid}`
                  }
                  alt={activeFriend.displayName}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {activeFriend.displayName || activeFriend.email}
                  </h3>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{activeFriend.email}</span>
                    <span>•</span>
                    <span className="text-emerald-500 font-medium">Ready to Ping</span>
                  </div>
                </div>
              </div>

              {/* Mode & Audio Controls */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  title={audioEnabled ? 'Mute ping sounds' : 'Enable ping sounds'}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 dark:border-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  {audioEnabled ? <Volume2 className="w-4 h-4 text-violet-500" /> : <VolumeX className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={onRefreshMessages}
                  title="Ping DB for new messages"
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 dark:border-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-950 text-xs">
                  <button
                    type="button"
                    onClick={() => setChannelMode('sql')}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                      channelMode === 'sql'
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>SQL Ping</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannelMode('gmail')}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                      channelMode === 'gmail'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Gmail</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <Radio className="w-10 h-10 mb-2 text-violet-400 animate-pulse" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No pings exchanged yet
                  </p>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    Send a real-time SQL ping or Gmail message to break the ice with{' '}
                    {activeFriend.displayName || 'your friend'}!
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderUid === currentUser?.uid;
                  const isGmail = msg.channel === 'gmail';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-xs text-sm relative ${
                          isMe
                            ? isGmail
                              ? 'bg-red-600 text-white'
                              : 'bg-violet-600 text-white'
                            : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                        }`}
                      >
                        <p className="break-words leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>

                        {/* Ping / Channel Badge + Read Receipt Indicator (Double Checkmark for Sent Messages) */}
                        <div
                          className={`flex items-center justify-between space-x-2 mt-1.5 text-[10px] ${
                            isMe ? 'text-violet-200' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {isGmail ? (
                            <span className="flex items-center space-x-1 font-semibold text-red-200">
                              <Mail className="w-3 h-3" />
                              <span>Gmail Sent</span>
                            </span>
                          ) : (
                            <span className="flex items-center space-x-1 font-mono">
                              <Radio className="w-3 h-3" />
                              <span>Ping: {msg.pingLatency || 35}ms</span>
                              <span className="opacity-75 font-sans capitalize">
                                • {msg.pingType || 'normal'}
                              </span>
                            </span>
                          )}

                          {/* Read receipt indicator (Double checkmark for read status) */}
                          {isMe && (
                            <span title="Read by recipient" className="flex items-center text-cyan-200 ml-2">
                              <CheckCheck className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Last Ping Latency Meter */}
            {lastLatency !== null && channelMode === 'sql' && (
              <div className="px-4 py-1 bg-violet-50 dark:bg-violet-950/30 border-t border-violet-100 dark:border-violet-900/40 text-[11px] text-violet-700 dark:text-violet-300 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-violet-500" />
                  <span>Last DB roundtrip latency:</span>
                  <span className="font-bold">{lastLatency}ms</span>
                </span>
                <span className="text-[10px] text-slate-500">Cloud SQL PostgreSQL</span>
              </div>
            )}

            {/* Input Form */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 relative">
              {/* Emoji Picker Modal */}
              <EmojiPickerModal
                isOpen={emojiPickerOpen}
                onClose={() => setEmojiPickerOpen(false)}
                onSelectEmoji={(emoji) => setContent((prev) => prev + emoji)}
              />

              {/* Google Drive Picker Modal */}
              <DrivePickerModal
                isOpen={driveModalOpen}
                onClose={() => setDriveModalOpen(false)}
                onSelectFile={(file) => {
                  setContent((prev) => `${prev} [Drive Attachment: ${file.name}](${file.url})`);
                }}
              />

              <form onSubmit={handleSend} className="space-y-2">
                {channelMode === 'sql' && (
                  <div className="flex items-center space-x-1 text-xs">
                    <span className="text-[11px] text-slate-400 mr-1">Type:</span>
                    {[
                      { id: 'normal', label: '⚡ Normal' },
                      { id: 'wave', label: '🌊 Wave' },
                      { id: 'urgent', label: '🚨 Urgent' },
                      { id: 'heartbeat', label: '💓 Heartbeat' },
                    ].map((pt) => (
                      <button
                        key={pt.id}
                        type="button"
                        onClick={() => setPingType(pt.id)}
                        className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${
                          pingType === pt.id
                            ? 'bg-violet-600 text-white border-violet-600 font-semibold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {pt.label}
                      </button>
                    ))}
                  </div>
                )}

                {channelMode === 'gmail' && (
                  <div className="flex items-center space-x-1.5 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900/50">
                    <Mail className="w-3.5 h-3.5" />
                    <span>
                      Will deliver as an email to <strong>{activeFriend.email}</strong> via Gmail
                      API with explicit confirmation dialog.
                    </span>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  {/* Emoji Picker Trigger */}
                  <button
                    type="button"
                    onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                    title="Add Emoji"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  {/* Google Drive Picker Trigger */}
                  <button
                    type="button"
                    onClick={() => setDriveModalOpen(true)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                    title="Attach Google Drive File"
                  >
                    <Cloud className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={
                      channelMode === 'sql'
                        ? `Ping ${activeFriend.displayName || 'friend'} via SQL database...`
                        : `Compose Gmail message to ${activeFriend.email}...`
                    }
                    className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !content.trim()}
                    className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white shadow-sm transition-all disabled:opacity-50 ${
                      channelMode === 'gmail'
                        ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                        : 'bg-violet-600 hover:bg-violet-700 shadow-violet-500/20'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {isSending
                        ? 'Pinging...'
                        : channelMode === 'gmail'
                        ? 'Send Email'
                        : 'Ping SQL'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <Radio className="w-12 h-12 text-violet-500 animate-pulse" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Select a friend to begin chatting
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              Connect with fellow members to exchange sub-50ms database pings or send email chats via
              Gmail integration.
            </p>
            {friends.length === 0 && (
              <button
                onClick={onNavigateToFriends}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-md shadow-violet-500/20"
              >
                Browse Friends &amp; Community
              </button>
            )}
          </div>
        )}
      </div>

      {/* Gmail Send Confirmation Dialog */}
      {gmailModalOpen && gmailDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="rounded-2xl max-w-md w-full p-5 bg-white border border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3 text-red-600 dark:text-red-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Confirm Sending Email via Gmail
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Pingit is about to send a real email on your behalf using your Google account. Please
              confirm the details:
            </p>

            <div className="rounded-xl p-3 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 space-y-1.5 text-xs">
              <div>
                <span className="font-semibold text-slate-500">To:</span>{' '}
                <span className="font-mono text-slate-900 dark:text-slate-200">
                  {gmailDraft.recipientEmail}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Subject:</span>{' '}
                <span>Pingit Chat from {currentUser?.displayName || 'Friend'}</span>
              </div>
              <div className="pt-1 border-t border-slate-200 dark:border-slate-800">
                <span className="font-semibold text-slate-500">Message Body:</span>
                <p className="mt-1 text-slate-800 dark:text-slate-200 italic line-clamp-3">
                  "{gmailDraft.content}"
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setGmailModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAndSendGmail}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm"
              >
                Yes, Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
